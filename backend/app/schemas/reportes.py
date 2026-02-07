from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime


# ==================== DATOS PARA GRÁFICOS ====================

class DatoPunto(BaseModel):
    """Punto de datos para gráficos"""
    fecha: str  # Formato: "YYYY-MM" o "YYYY-MM-DD"
    valor: Decimal
    label: Optional[str] = None  # Para etiquetas personalizadas
    
    class Config:
        from_attributes = True


class DatoCategoria(BaseModel):
    """Dato con categoría para gráficos de barras/dona"""
    nombre: str
    valor: Decimal
    porcentaje: Optional[float] = None
    color: Optional[str] = None
    
    class Config:
        from_attributes = True


class DatoComparativo(BaseModel):
    """Dato comparativo entre dos períodos"""
    periodo_actual: Decimal
    periodo_anterior: Decimal
    diferencia: Decimal
    porcentaje_cambio: float
    
    class Config:
        from_attributes = True


# ==================== KPIs ====================

class KPIMetrica(BaseModel):
    """Métrica individual con comparación"""
    valor_actual: Decimal
    valor_anterior: Optional[Decimal] = None
    cambio_porcentual: Optional[float] = None
    tendencia: str = "neutral"  # "up", "down", "neutral"
    
    class Config:
        from_attributes = True


class KPIDashboard(BaseModel):
    """KPIs principales del dashboard"""
    # Financieros
    ingresos_totales: KPIMetrica
    egresos_totales: KPIMetrica
    ingreso_neto: Decimal
    ingresos_promedio_por_caja: Decimal
    saldo_pendiente: Decimal
    margen_operativo: float  # (ingresos - egresos) / ingresos * 100
    
    # Estudiantes
    total_estudiantes_activos: int
    total_estudiantes_inactivos: int
    nuevas_matriculas_mes: int
    tasa_desercion: float
    
    # Operacionales
    ticket_promedio: Decimal
    dias_promedio_pago: float
    tasa_cobranza: float  # Pagado vs pendiente
    porcentaje_pagos_vencidos: float
    
    class Config:
        from_attributes = True


# ==================== LISTAS DE ESTUDIANTES ====================

class EstudianteRegistrado(BaseModel):
    """Estudiante registrado en el período"""
    id: int
    nombre_completo: str
    documento: str
    categoria: Optional[str] = None
    fecha_inscripcion: datetime
    origen_cliente: Optional[str] = None  # DIRECTO o REFERIDO
    referido_por: Optional[str] = None
    valor_total_curso: Optional[Decimal] = None
    estado: str
    
    class Config:
        from_attributes = True


class EstudiantePago(BaseModel):
    """Estudiante que realizó un pago en el período"""
    estudiante_id: int
    nombre_completo: str
    documento: str
    categoria: Optional[str] = None
    fecha_pago: datetime
    concepto: str
    monto: Decimal
    metodo_pago: Optional[str] = None  # Si es pago simple
    es_pago_mixto: bool
    saldo_pendiente: Optional[Decimal] = None
    
    class Config:
        from_attributes = True


class ReferidoRanking(BaseModel):
    """Ranking de referidos que más estudiantes envían"""
    referido_nombre: str
    telefono: Optional[str] = None
    total_estudiantes_referidos: int
    total_ingresos_generados: Decimal
    estudiantes_activos: int
    estudiantes_graduados: int
    ultima_referencia_fecha: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ==================== DASHBOARD COMPLETO ====================

class GraficoEvolucionIngresos(BaseModel):
    """Gráfico de línea: evolución de ingresos"""
    datos: List[DatoPunto]
    total_periodo: Decimal
    promedio_mensual: Decimal
    
    class Config:
        from_attributes = True


class GraficoMetodosPago(BaseModel):
    """Gráfico de barras: ingresos por método de pago"""
    datos: List[DatoCategoria]
    metodo_preferido: str
    
    class Config:
        from_attributes = True


class GraficoEstudiantesCategorias(BaseModel):
    """Gráfico de dona: estudiantes por categoría"""
    datos: List[DatoCategoria]
    total: int
    
    class Config:
        from_attributes = True


class GraficoEgresos(BaseModel):
    """Gráfico de barras horizontales: egresos por categoría"""
    datos: List[DatoCategoria]
    total: Decimal
    categoria_mayor: str
    
    class Config:
        from_attributes = True


class DashboardEjecutivo(BaseModel):
    """Dashboard ejecutivo completo"""
    kpis: KPIDashboard
    grafico_ingresos: GraficoEvolucionIngresos
    grafico_metodos_pago: GraficoMetodosPago
    grafico_estudiantes: GraficoEstudiantesCategorias
    grafico_egresos: GraficoEgresos
    ranking_referidos: List[ReferidoRanking]
    lista_estudiantes_registrados: List[EstudianteRegistrado]
    lista_estudiantes_pagos: List[EstudiantePago]
    fecha_generacion: datetime
    periodo_inicio: datetime
    periodo_fin: datetime
    
    class Config:
        from_attributes = True


# ==================== ALERTAS OPERATIVAS ====================

class AlertasOperativas(BaseModel):
    caja_abierta: bool
    caja_id: Optional[int] = None
    caja_abierta_horas: Optional[float] = None
    pagos_vencidos_cantidad: int
    pagos_vencidos_total: Decimal
    compromisos_por_vencer_cantidad: int
    compromisos_por_vencer_total: Decimal
    pin_por_vencer_cantidad: int
    fallas_abiertas_cantidad: int
    estudiantes_listos_examen_cantidad: int

    class Config:
        from_attributes = True


class AlertaDocumentoVehiculo(BaseModel):
    vehiculo_id: int
    placa: str
    documento: str
    fecha_vencimiento: datetime
    dias_restantes: int


class AlertaPin(BaseModel):
    estudiante_id: int
    nombre_completo: str
    cedula: str
    fecha_vencimiento: datetime
    dias_restantes: int


class AlertaPagoVencido(BaseModel):
    pago_id: int
    estudiante_id: int
    nombre_completo: str
    monto: Decimal
    fecha_vencimiento: datetime
    dias_mora: int


class AlertaCompromiso(BaseModel):
    cuota_id: int
    estudiante_id: int
    nombre_completo: str
    saldo_cuota: Decimal
    fecha_vencimiento: datetime
    dias_restantes: int


class AlertaDocumentoInstructor(BaseModel):
    instructor_id: int
    nombre_completo: str
    documento: str
    fecha_vencimiento: datetime
    dias_restantes: int


class AlertasVencimientosResponse(BaseModel):
    documentos_vehiculo: List[AlertaDocumentoVehiculo]
    documentos_instructor: List[AlertaDocumentoInstructor]
    pins_por_vencer: List[AlertaPin]
    pagos_vencidos: List[AlertaPagoVencido]
    compromisos_por_vencer: List[AlertaCompromiso]


class CierreCajaItem(BaseModel):
    id: int
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime]
    estado: str
    total_ingresos: Decimal
    total_egresos: Decimal
    diferencia: Optional[Decimal]


class CierreFinancieroResponse(BaseModel):
    fecha_inicio: datetime
    fecha_fin: datetime
    total_ingresos: Decimal
    total_egresos: Decimal
    saldo_efectivo_teorico: Decimal
    total_efectivo: Decimal
    total_transferencias: Decimal
    total_tarjetas: Decimal
    total_nequi: Decimal
    total_daviplata: Decimal
    total_transferencia_bancaria: Decimal
    total_tarjeta_debito: Decimal
    total_tarjeta_credito: Decimal
    total_credismart: Decimal
    total_sistecredito: Decimal
    cajas: List[CierreCajaItem]


# ==================== REPORTE FINANCIERO ====================

class AnalisisIngresos(BaseModel):
    """Análisis detallado de ingresos"""
    por_metodo: List[DatoCategoria]
    comparativo_mensual: DatoComparativo
    evolucion_anual: List[DatoPunto]
    proyeccion_mes_siguiente: Optional[Decimal] = None
    
    class Config:
        from_attributes = True


class AnalisisEgresos(BaseModel):
    """Análisis detallado de egresos"""
    por_categoria: List[DatoCategoria]
    comparativo_mensual: DatoComparativo
    evolucion_anual: List[DatoPunto]
    ratio_ingreso_egreso: float
    
    class Config:
        from_attributes = True


class CuentasPorCobrar(BaseModel):
    """Análisis de cuentas por cobrar"""
    saldo_total: Decimal
    antiguedad_0_30: Decimal
    antiguedad_31_60: Decimal
    antiguedad_61_90: Decimal
    antiguedad_mas_90: Decimal
    porcentaje_vencido: float
    top_deudores: List[dict]  # {nombre, cedula, saldo, dias_vencido}
    
    class Config:
        from_attributes = True


class ReporteFinanciero(BaseModel):
    """Reporte financiero completo"""
    analisis_ingresos: AnalisisIngresos
    analisis_egresos: AnalisisEgresos
    cuentas_por_cobrar: CuentasPorCobrar
    fecha_generacion: datetime
    periodo_inicio: datetime
    periodo_fin: datetime
    
    class Config:
        from_attributes = True


# ==================== REPORTE DE ESTUDIANTES ====================

class AnalisisDemografico(BaseModel):
    """Análisis demográfico de estudiantes"""
    por_categoria: List[DatoCategoria]
    por_rango_edad: List[DatoCategoria]
    matriculas_mensuales: List[DatoPunto]
    tasa_graduacion: float
    tasa_desercion: float
    
    class Config:
        from_attributes = True


class AnalisisFinancieroEstudiantes(BaseModel):
    """Análisis financiero de estudiantes"""
    valor_promedio_curso: Decimal
    metodos_pago_preferidos: List[DatoCategoria]
    tiempo_promedio_pago_dias: float
    estudiantes_con_saldo: int
    saldo_pendiente_total: Decimal
    
    class Config:
        from_attributes = True


class ReporteEstudiantes(BaseModel):
    """Reporte de estudiantes completo"""
    analisis_demografico: AnalisisDemografico
    analisis_financiero: AnalisisFinancieroEstudiantes
    fecha_generacion: datetime
    periodo_inicio: datetime
    periodo_fin: datetime
    
    class Config:
        from_attributes = True
