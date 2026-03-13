from sqlalchemy import text
from app.core.database import engine


def run():
    with engine.begin() as conn:
        conn.execute(text("ALTER TYPE metodopago ADD VALUE IF NOT EXISTS 'CREDISMART';"))
        conn.execute(text("ALTER TYPE metodopago ADD VALUE IF NOT EXISTS 'SISTECREDITO';"))

    print("Migracion add_metodopago_creditos aplicada.")


if __name__ == "__main__":
    run()
