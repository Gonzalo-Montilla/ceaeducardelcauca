from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.caja import EstadoCaja, TipoMovimiento, ConceptoEgreso
from app.models.pago import MetodoPago


# ==================== CAJA SCHEMAS ====================

class CajaApertura(BaseModel):
    """Schema para abrir una caja"""
    saldo_inicial: Decimal
    observaciones_apertura: Optional[str] = None


class CajaCierre(BaseModel):
    """Schema para cerrar una caja (arqueo)"""
    efectivo_fisico: Decimal
    observaciones_cierre: Optional[str] = None
    
    @field_validator('efectivo_fisico')
    @classmethod
    def validate_efectivo(cls, v):
        if v < 0:
            raise ValueError('El efectivo físico no puede ser negativo')
        return v


class CajaResumen(BaseModel):
    """Schema para resumen de caja"""
    id: int
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime]
    estado: EstadoCaja
    
    # Usuario
    usuario_apertura: str  # Nombre del usuario
    usuario_cierre: Optional[str]
    
    # Montos principales
    saldo_inicial: Decimal
    total_ingresos: Decimal  # Suma de todos los métodos
    total_egresos: Decimal   # Suma de todos los métodos
    saldo_efectivo_caja: Decimal  # Solo efectivo (lo que hay en caja)
    saldo_final_teorico: Decimal  # Saldo teórico de efectivo
    
    # Detalle por método de pago
    total_ingresos_efectivo: Decimal
    total_ingresos_transferencia: Decimal
    total_ingresos_tarjeta: Decimal
    total_egresos_efectivo: Decimal
    total_egresos_transferencia: Decimal
    total_egresos_tarjeta: Decimal
    
    # Transferencias separadas
    total_nequi: Decimal = Decimal('0')
    total_daviplata: Decimal = Decimal('0')
    total_transferencia_bancaria: Decimal = Decimal('0')
    
    # Tarjetas separadas
    total_tarjeta_debito: Decimal = Decimal('0')
    total_tarjeta_credito: Decimal = Decimal('0')
    
    # Créditos - NO cuentan en caja (pagos diferidos de financieras)
    total_credismart: Decimal = Decimal('0')
    total_sistecredito: Decimal = Decimal('0')
    
    # Arqueo (solo si está cerrada)
    efectivo_teorico: Optional[Decimal]
    efectivo_fisico: Optional[Decimal]
    diferencia: Optional[Decimal]
    
    # Contadores
    num_pagos: int = 0
    num_egresos: int = 0
    
    class Config:
        from_attributes = True


class CajaDetalle(CajaResumen):
    """Schema para detalle completo de caja con observaciones"""
    observaciones_apertura: Optional[str]
    observaciones_cierre: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ==================== MOVIMIENTO CAJA SCHEMAS ====================

class MovimientoCajaCreate(BaseModel):
    """Schema para crear un movimiento (egreso)"""
    concepto: str
    categoria: Optional[ConceptoEgreso] = ConceptoEgreso.OTROS
    monto: Decimal
    metodo_pago: MetodoPago
    numero_factura: Optional[str] = None
    observaciones: Optional[str] = None
    
    @field_validator('monto')
    @classmethod
    def validate_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a cero')
        return v
    
    @field_validator('concepto')
    @classmethod
    def validate_concepto(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('El concepto debe tener al menos 3 caracteres')
        return v.strip().upper()


class MovimientoCajaResponse(BaseModel):
    """Schema para respuesta de movimiento"""
    id: int
    caja_id: int
    tipo: TipoMovimiento
    concepto: str
    categoria: Optional[ConceptoEgreso]
    monto: Decimal
    metodo_pago: MetodoPago
    numero_factura: Optional[str]
    comprobante_url: Optional[str]
    fecha: datetime
    observaciones: Optional[str]
    usuario_nombre: str  # Nombre del usuario que registró
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== PAGO SCHEMAS (actualizados) ====================

class DetallePagoCreate(BaseModel):
    """Schema para un detalle de pago mixto"""
    metodo_pago: MetodoPago
    monto: Decimal
    referencia: Optional[str] = None
    
    @field_validator('monto')
    @classmethod
    def validate_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a cero')
        return v


class DetallePagoResponse(BaseModel):
    """Schema para respuesta de detalle de pago"""
    id: int
    metodo_pago: MetodoPago
    monto: Decimal
    referencia: Optional[str]
    
    class Config:
        from_attributes = True


class PagoCreate(BaseModel):
    """Schema para registrar un pago de estudiante"""
    estudiante_id: int
    monto: Decimal
    metodo_pago: Optional[MetodoPago] = None  # Para pagos simples
    concepto: Optional[str] = "Abono al curso"
    referencia_pago: Optional[str] = None
    observaciones: Optional[str] = None
    
    # Pago mixto (opcional)
    es_pago_mixto: bool = False
    detalles_pago: Optional[list[DetallePagoCreate]] = None
    
    @field_validator('monto')
    @classmethod
    def validate_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a cero')
        return v
    
    @model_validator(mode='after')
    def validate_pago(self):
        """Validación completa del pago"""
        # Si es pago mixto, debe tener detalles
        if self.es_pago_mixto:
            if not self.detalles_pago or len(self.detalles_pago) < 2:
                raise ValueError('Pago mixto debe tener al menos 2 métodos de pago')
            
            # Validar que la suma de detalles = monto total
            suma_detalles = sum(d.monto for d in self.detalles_pago)
            if suma_detalles != self.monto:
                raise ValueError(f'La suma de detalles ({suma_detalles}) no coincide con el monto total ({self.monto})')
        else:
            # Si no es mixto, debe tener metodo_pago
            if not self.metodo_pago:
                raise ValueError('Debe especificar metodo_pago para pagos simples')
        
        return self


class PagoResponse(BaseModel):
    """Schema para respuesta de pago"""
    id: int
    estudiante_id: int
    caja_id: Optional[int]
    concepto: str
    monto: Decimal
    metodo_pago: Optional[MetodoPago]  # None si es pago mixto
    estado: str
    referencia_pago: Optional[str]
    fecha_pago: datetime
    observaciones: Optional[str]
    
    # Pago mixto
    es_pago_mixto: bool = False
    detalles_pago: list[DetallePagoResponse] = []
    
    # Datos del estudiante
    estudiante_nombre: str
    estudiante_matricula: str
    
    # Usuario que registró
    usuario_nombre: Optional[str]
    
    class Config:
        from_attributes = True


# ==================== ESTUDIANTE FINANCIERO ====================

class EstudianteFinanciero(BaseModel):
    """Schema para información financiera del estudiante"""
    id: int
    nombre_completo: str
    cedula: str
    matricula_numero: str
    foto_url: Optional[str]
    
    # Servicio
    tipo_servicio: Optional[str]
    categoria: Optional[str]
    estado: str
    
    # Financiero
    valor_total_curso: Optional[Decimal]
    saldo_pendiente: Optional[Decimal]
    total_pagado: Decimal = Decimal('0')
    
    # Fechas y plazos
    fecha_inscripcion: datetime
    fecha_primer_pago: Optional[datetime]
    fecha_limite_pago: Optional[datetime]
    dias_restantes: Optional[int]
    estado_financiero: str  # "AL_DIA", "PROXIMO_VENCER", "VENCIDO"
    
    # Historial
    num_pagos: int = 0
    ultimo_pago_fecha: Optional[datetime]
    ultimo_pago_monto: Optional[Decimal]
    historial_pagos: list[PagoResponse] = []  # Lista completa de pagos
    
    class Config:
        from_attributes = True


# ==================== REPORTES ====================

class ReporteCaja(BaseModel):
    """Schema para reporte de caja por período"""
    fecha_inicio: datetime
    fecha_fin: datetime
    
    # Totales
    total_ingresos: Decimal
    total_egresos: Decimal
    saldo_neto: Decimal
    
    # Por método
    ingresos_efectivo: Decimal
    ingresos_transferencia: Decimal
    ingresos_tarjeta: Decimal
    egresos_efectivo: Decimal
    egresos_transferencia: Decimal
    egresos_tarjeta: Decimal
    
    # Contadores
    num_cajas: int
    num_pagos: int
    num_egresos: int
    
    # Egresos por categoría (top 5)
    egresos_por_categoria: dict = {}


class DashboardCaja(BaseModel):
    """Schema para dashboard de caja actual"""
    caja_actual: Optional[CajaResumen]
    hay_caja_abierta: bool
    
    # Resumen del día
    total_ingresos_hoy: Decimal = Decimal('0')
    total_egresos_hoy: Decimal = Decimal('0')
    num_pagos_hoy: int = 0
    
    # Créditos (NO cuentan en caja, solo tracking)
    total_credismart_hoy: Decimal = Decimal('0')
    total_sistecredito_hoy: Decimal = Decimal('0')
    
    # Alertas
    estudiantes_proximos_vencer: int = 0  # < 7 días
    estudiantes_vencidos: int = 0  # > 90 días sin pagar
    
    # Últimos movimientos
    ultimos_pagos: list = []
    ultimos_egresos: list = []
