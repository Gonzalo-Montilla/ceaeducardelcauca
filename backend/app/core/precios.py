"""
Módulo para cálculo de precios según tipo de servicio y modalidad
"""
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from app.models.estudiante import TipoServicio, OrigenCliente
from app.models.tarifa import Tarifa

# Precios base para clientes directos
PRECIOS_BASE = {
    TipoServicio.LICENCIA_A2: Decimal("950000"),
    TipoServicio.LICENCIA_B1: Decimal("1200000"),
    TipoServicio.LICENCIA_C1: Decimal("1300000"),
    TipoServicio.RECATEGORIZACION_C1: Decimal("1300000"),
    TipoServicio.COMBO_A2_B1: Decimal("2000000"),
    TipoServicio.COMBO_A2_C1: Decimal("2200000"),
    TipoServicio.CERTIFICADO_MOTO: Decimal("480000"),
    TipoServicio.CERTIFICADO_B1: Decimal("600000"),  # Sin práctica
    TipoServicio.CERTIFICADO_C1: Decimal("750000"),  # Sin práctica
    TipoServicio.CERTIFICADO_B1_SIN_PRACTICA: Decimal("600000"),
    TipoServicio.CERTIFICADO_C1_SIN_PRACTICA: Decimal("750000"),
    TipoServicio.CERTIFICADO_A2_B1_SIN_PRACTICA: Decimal("1080000"),
    TipoServicio.CERTIFICADO_A2_C1_SIN_PRACTICA: Decimal("1230000"),
    TipoServicio.CERTIFICADO_A2_B1_CON_PRACTICA: Decimal("1180000"),
    TipoServicio.CERTIFICADO_A2_C1_CON_PRACTICA: Decimal("1330000"),
}

# Costo adicional por práctica en certificados
COSTO_PRACTICA = Decimal("100000")

CERTIFICADOS_SIN_PRACTICA = {
    TipoServicio.CERTIFICADO_MOTO,
    TipoServicio.CERTIFICADO_B1,
    TipoServicio.CERTIFICADO_C1,
    TipoServicio.CERTIFICADO_B1_SIN_PRACTICA,
    TipoServicio.CERTIFICADO_C1_SIN_PRACTICA,
    TipoServicio.CERTIFICADO_A2_B1_SIN_PRACTICA,
    TipoServicio.CERTIFICADO_A2_C1_SIN_PRACTICA,
}

def es_certificado_sin_practica(tipo_servicio: TipoServicio) -> bool:
    return tipo_servicio in CERTIFICADOS_SIN_PRACTICA


def calcular_precio(
    tipo_servicio: TipoServicio,
    incluye_practica: bool = True,
    db: Optional[Session] = None
) -> Decimal:
    """
    Calcula el precio total del servicio para clientes directos
    
    Args:
        tipo_servicio: Tipo de servicio contratado
        incluye_practica: Si incluye práctica en vehículos (solo para certificados)
    
    Returns:
        Precio total del servicio
    """
    # Obtener precio base
    precio_base = PRECIOS_BASE.get(tipo_servicio, Decimal("0"))
    costo_practica = COSTO_PRACTICA

    if db is not None:
        tarifa = db.query(Tarifa).filter(
            Tarifa.tipo_servicio == tipo_servicio,
            Tarifa.activo == True
        ).first()
        if tarifa:
            precio_base = Decimal(str(tarifa.precio_base))
            costo_practica = Decimal(str(tarifa.costo_practica or 0))
    
    # Para certificados, agregar costo de práctica si aplica
    if tipo_servicio in [
        TipoServicio.CERTIFICADO_B1,
        TipoServicio.CERTIFICADO_C1,
        TipoServicio.CERTIFICADO_A2_B1_CON_PRACTICA,
        TipoServicio.CERTIFICADO_A2_C1_CON_PRACTICA,
    ]:
        if incluye_practica:
            precio_base += costo_practica

    return precio_base


def obtener_categoria_licencia(tipo_servicio: TipoServicio) -> str:
    """
    Mapea el tipo de servicio a la categoría de licencia correspondiente
    """
    mapeo = {
        TipoServicio.LICENCIA_A2: "A2",
        TipoServicio.LICENCIA_B1: "B1",
        TipoServicio.LICENCIA_C1: "C1",
        TipoServicio.RECATEGORIZACION_C1: "C1",
        TipoServicio.COMBO_A2_B1: "B1",  # Se maneja como B1
        TipoServicio.COMBO_A2_C1: "C1",  # Se maneja como C1
        TipoServicio.CERTIFICADO_MOTO: "A2",
        TipoServicio.CERTIFICADO_B1: "B1",
        TipoServicio.CERTIFICADO_C1: "C1",
        TipoServicio.CERTIFICADO_B1_SIN_PRACTICA: "B1",
        TipoServicio.CERTIFICADO_C1_SIN_PRACTICA: "C1",
        TipoServicio.CERTIFICADO_A2_B1_SIN_PRACTICA: "B1",
        TipoServicio.CERTIFICADO_A2_C1_SIN_PRACTICA: "C1",
        TipoServicio.CERTIFICADO_A2_B1_CON_PRACTICA: "B1",
        TipoServicio.CERTIFICADO_A2_C1_CON_PRACTICA: "C1",
    }
    return mapeo.get(tipo_servicio, "B1")
