import smtplib
from email.message import EmailMessage
from typing import Optional
from app.core.config import settings


def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment: Optional[tuple[str, bytes, str]] = None
) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.set_content(body)

    if attachment:
        filename, content, mime_type = attachment
        maintype, subtype = mime_type.split("/", 1)
        msg.add_attachment(content, maintype=maintype, subtype=subtype, filename=filename)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
            smtp.ehlo()
            if settings.SMTP_USE_TLS:
                smtp.starttls()
                smtp.ehlo()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception:
        return False
