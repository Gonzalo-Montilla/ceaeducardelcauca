"""
Módulo para cálculo de precios según tipo de servicio y modalidad
"""
from decimal import Decimal
from app.models.estudiante import TipoServicio, OrigenCliente

# Precios base para clientes directos
PRECIOS_BASE = {
    TipoServicio.LICENCIA_A2: Decimal("950000"),
    TipoServicio.LICENCIA_B1: Decimal("1200000"),
    TipoServicio.LICENCIA_C1: Decimal("1300000"),
    TipoServicio.RECATEGORIZACION_C1: Decimal("1300000"),
    TipoServicio.COMBO_A2_B1: Decimal("2000000"),
    TipoServicio.COMBO_A2_C1: Decimal("2200000"),
    TipoServicio.CERTIFICADO_MOTO: Decimal("480000"),
    TipoServicio.CERTIFICADO_B1: Decimal("650000"),  # Sin práctica
    TipoServicio.CERTIFICADO_C1: Decimal("750000"),  # Sin práctica
}

# Costo adicional por práctica en certificados
COSTO_PRACTICA = Decimal("100000")


def calcular_precio(
    tipo_servicio: TipoServicio,
    incluye_practica: bool = True
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
    precio = PRECIOS_BASE.get(tipo_servicio, Decimal("0"))
    
    # Para certificados B1 y C1, agregar costo de práctica si aplica
    if tipo_servicio in [TipoServicio.CERTIFICADO_B1, TipoServicio.CERTIFICADO_C1]:
        if incluye_practica:
            precio += COSTO_PRACTICA
    
    return precio


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
    }
    return mapeo.get(tipo_servicio, "B1")
