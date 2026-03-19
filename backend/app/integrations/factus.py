import time
from decimal import Decimal
from typing import Any, Dict, Optional

import requests

from app.core.config import settings
from app.models.estudiante import Estudiante
from app.models.pago import Pago
from app.models.usuario import Usuario


class FactusError(Exception):
    pass


_TOKEN_CACHE: Dict[str, Any] = {
    "access_token": None,
    "refresh_token": None,
    "expires_at": 0.0,
}


def is_factus_enabled() -> bool:
    return bool(settings.FACTUS_ENABLED and settings.FACTUS_BASE_URL)


def _require_settings() -> None:
    missing = []
    required = [
        "FACTUS_USERNAME",
        "FACTUS_PASSWORD",
        "FACTUS_CLIENT_ID",
        "FACTUS_CLIENT_SECRET",
        "FACTUS_NUMBERING_RANGE_ID",
        "FACTUS_ESTABLISHMENT_NAME",
        "FACTUS_ESTABLISHMENT_ADDRESS",
        "FACTUS_ESTABLISHMENT_EMAIL",
        "FACTUS_ESTABLISHMENT_MUNICIPALITY_ID",
    ]
    for key in required:
        value = getattr(settings, key, None)
        if value in (None, "", 0):
            missing.append(key)
    if missing:
        raise FactusError(f"Faltan settings Factus: {', '.join(missing)}")


def _request_token(payload: Dict[str, Any]) -> str:
    url = f"{settings.FACTUS_BASE_URL.rstrip('/')}/oauth/token"
    headers = {"Accept": "application/json"}
    response = requests.post(url, data=payload, headers=headers, timeout=settings.FACTUS_TIMEOUT_SECONDS)
    if not response.ok:
        raise FactusError(f"Auth Factus falló: {response.status_code} - {response.text}")
    data = response.json()
    access_token = data.get("access_token")
    if not access_token:
        raise FactusError("Auth Factus sin access_token")
    expires_in = int(data.get("expires_in") or 3600)
    _TOKEN_CACHE["access_token"] = access_token
    _TOKEN_CACHE["refresh_token"] = data.get("refresh_token")
    _TOKEN_CACHE["expires_at"] = time.time() + expires_in
    return access_token


def _get_access_token() -> str:
    now = time.time()
    cached = _TOKEN_CACHE.get("access_token")
    expires_at = _TOKEN_CACHE.get("expires_at") or 0
    if cached and now < (expires_at - 30):
        return cached
    refresh_token = _TOKEN_CACHE.get("refresh_token")
    if refresh_token:
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": settings.FACTUS_CLIENT_ID,
            "client_secret": settings.FACTUS_CLIENT_SECRET,
        }
        try:
            return _request_token(payload)
        except FactusError:
            pass
    payload = {
        "grant_type": settings.FACTUS_GRANT_TYPE,
        "username": settings.FACTUS_USERNAME,
        "password": settings.FACTUS_PASSWORD,
        "client_id": settings.FACTUS_CLIENT_ID,
        "client_secret": settings.FACTUS_CLIENT_SECRET,
    }
    if settings.FACTUS_SCOPE:
        payload["scope"] = settings.FACTUS_SCOPE
    return _request_token(payload)


def _build_customer(estudiante: Estudiante, usuario: Usuario) -> Dict[str, Any]:
    municipality_id = settings.FACTUS_CUSTOMER_MUNICIPALITY_ID or settings.FACTUS_ESTABLISHMENT_MUNICIPALITY_ID
    if not municipality_id:
        raise FactusError("FACTUS_CUSTOMER_MUNICIPALITY_ID es requerido")
    return {
        "identification": usuario.cedula,
        "dv": "",
        "company": "",
        "trade_name": "",
        "names": usuario.nombre_completo,
        "address": estudiante.direccion or "NO REGISTRA",
        "email": usuario.email,
        "phone": usuario.telefono or "",
        "legal_organization_id": str(settings.FACTUS_CUSTOMER_LEGAL_ORG_ID),
        "tribute_id": str(settings.FACTUS_CUSTOMER_TRIBUTE_ID),
        "identification_document_id": settings.FACTUS_CUSTOMER_IDENTIFICATION_DOCUMENT_ID,
        "municipality_id": municipality_id,
    }


def _build_item(pago: Pago, estudiante: Estudiante) -> Dict[str, Any]:
    tipo_servicio = estudiante.tipo_servicio.value if estudiante.tipo_servicio else None
    code_reference = settings.FACTUS_ITEM_CODE_REFERENCE or tipo_servicio or "SERVICIO_EDUCATIVO"
    name = pago.concepto or "Servicio educativo"
    price = str(Decimal(str(pago.monto)))
    return {
        "code_reference": code_reference,
        "name": name,
        "quantity": 1,
        "discount_rate": settings.FACTUS_ITEM_DISCOUNT_RATE,
        "price": price,
        "tax_rate": settings.FACTUS_ITEM_TAX_RATE,
        "unit_measure_id": settings.FACTUS_ITEM_UNIT_MEASURE_ID,
        "standard_code_id": settings.FACTUS_ITEM_STANDARD_CODE_ID,
        "is_excluded": settings.FACTUS_ITEM_IS_EXCLUDED,
        "tribute_id": settings.FACTUS_ITEM_TRIBUTE_ID,
        "withholding_taxes": [],
    }


def _build_payload(pago: Pago, estudiante: Estudiante, usuario: Usuario) -> Dict[str, Any]:
    return {
        "document": settings.FACTUS_DOCUMENT_CODE,
        "numbering_range_id": settings.FACTUS_NUMBERING_RANGE_ID,
        "reference_code": f"CEA-PAGO-{pago.id}",
        "observation": pago.observaciones or pago.concepto or "",
        "payment_method_code": settings.FACTUS_PAYMENT_METHOD_CODE,
        "establishment": {
            "name": settings.FACTUS_ESTABLISHMENT_NAME,
            "address": settings.FACTUS_ESTABLISHMENT_ADDRESS,
            "phone_number": settings.FACTUS_ESTABLISHMENT_PHONE or "",
            "email": settings.FACTUS_ESTABLISHMENT_EMAIL,
            "municipality_id": settings.FACTUS_ESTABLISHMENT_MUNICIPALITY_ID,
        },
        "customer": _build_customer(estudiante, usuario),
        "items": [_build_item(pago, estudiante)],
    }


def _extract_factura_fields(data: Dict[str, Any]) -> Dict[str, Optional[str]]:
    payload: Any = data
    for _ in range(2):
        if isinstance(payload, dict) and "data" in payload:
            payload = payload.get("data")
        else:
            break

    bill = None
    if isinstance(payload, dict):
        bill = payload.get("bill") if isinstance(payload.get("bill"), dict) else None
    elif isinstance(payload, list) and payload:
        bill = payload[0] if isinstance(payload[0], dict) else None

    bill_data = bill or (payload if isinstance(payload, dict) else None)
    if not isinstance(bill_data, dict):
        return {}

    numero = (
        bill_data.get("number")
        or bill_data.get("bill_number")
        or bill_data.get("numbering")
        or bill_data.get("consecutive")
        or bill_data.get("full_number")
    )
    if not numero and bill_data.get("prefix") and bill_data.get("current"):
        numero = f"{bill_data.get('prefix')}{bill_data.get('current')}"

    factura_url = (
        bill_data.get("pdf_url")
        or bill_data.get("url_pdf")
        or bill_data.get("pdf")
        or bill_data.get("download_pdf_url")
        or bill_data.get("public_url")
    )
    if not factura_url and isinstance(payload, dict):
        bill_info = payload.get("bill") if isinstance(payload.get("bill"), dict) else None
        if bill_info and isinstance(bill_info.get("public_url"), str):
            factura_url = bill_info.get("public_url")

    return {
        "factura_numero": numero,
        "factura_url": factura_url,
        "factura_xml_url": (
            bill_data.get("xml_url")
            or bill_data.get("url_xml")
            or bill_data.get("xml")
            or bill_data.get("download_xml_url")
        ),
        "factura_cufe": bill_data.get("cufe") or bill_data.get("uuid") or bill_data.get("cufe_uuid"),
        "factura_estado": (
            data.get("status")
            if isinstance(data, dict)
            else bill_data.get("status") or bill_data.get("state")
        ),
    }


def emitir_factura_pago(pago: Pago, estudiante: Estudiante, usuario: Usuario) -> Dict[str, Any]:
    if not is_factus_enabled():
        return {}
    _require_settings()
    token = _get_access_token()
    url = f"{settings.FACTUS_BASE_URL.rstrip('/')}/v1/bills/validate"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    payload = _build_payload(pago, estudiante, usuario)
    response = requests.post(url, json=payload, headers=headers, timeout=settings.FACTUS_TIMEOUT_SECONDS)
    if response.status_code in (401, 403):
        token = _get_access_token()
        headers["Authorization"] = f"Bearer {token}"
        response = requests.post(url, json=payload, headers=headers, timeout=settings.FACTUS_TIMEOUT_SECONDS)
    if not response.ok:
        raise FactusError(f"Factus error {response.status_code}: {response.text}")
    data = response.json()
    resultado = _extract_factura_fields(data)
    resultado["_raw"] = data
    return resultado
