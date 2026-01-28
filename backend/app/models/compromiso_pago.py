from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class FrecuenciaPago(str, enum.Enum):
    """Frecuencia de las cuotas"""
    SEMANAL = "SEMANAL"
    QUINCENAL = "QUINCENAL"
    MENSUAL = "MENSUAL"


class EstadoCompromiso(str, enum.Enum):
    """Estado del compromiso de pago"""
    ACTIVO = "ACTIVO"
    COMPLETADO = "COMPLETADO"
    VENCIDO = "VENCIDO"
    CANCELADO = "CANCELADO"


class EstadoCuota(str, enum.Enum):
    """Estado de una cuota individual"""
    PENDIENTE = "PENDIENTE"
    PAGADA = "PAGADA"
    VENCIDA = "VENCIDA"
    PARCIAL = "PARCIAL"


class CompromisoPago(Base):
    """Compromiso de pago cuando el estudiante hace abono y debe cuotas"""
    __tablename__ = "compromisos_pago"
    
    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    
    # Información del compromiso
    monto_total = Column(Numeric(10, 2), nullable=False)  # Saldo pendiente
    monto_abonado = Column(Numeric(10, 2), default=0, nullable=False)
    saldo_pendiente = Column(Numeric(10, 2), nullable=False)
    
    # Cuotas
    numero_cuotas = Column(Integer, nullable=False)
    cuotas_pagadas = Column(Integer, default=0, nullable=False)
    valor_cuota = Column(Numeric(10, 2), nullable=False)
    frecuencia = Column(SQLEnum(FrecuenciaPago), nullable=False)
    
    # Fechas
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_primera_cuota = Column(DateTime, nullable=False)
    fecha_ultima_cuota = Column(DateTime)  # Calculada
    
    # Estado
    estado = Column(SQLEnum(EstadoCompromiso), default=EstadoCompromiso.ACTIVO, nullable=False)
    
    # Observaciones
    observaciones = Column(Text)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_user_id = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    cuotas = relationship("CuotaPago", back_populates="compromiso", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CompromisoPago {self.numero_cuotas} cuotas - ${self.monto_total}>"
    
    @property
    def progreso_pago(self) -> float:
        """Calcula el porcentaje de pago completado"""
        if self.monto_total == 0:
            return 100.0
        return (self.monto_abonado / self.monto_total) * 100


class CuotaPago(Base):
    """Cuota individual del compromiso de pago"""
    __tablename__ = "cuotas_pago"
    
    id = Column(Integer, primary_key=True, index=True)
    compromiso_id = Column(Integer, ForeignKey("compromisos_pago.id"), nullable=False)
    
    # Información de la cuota
    numero_cuota = Column(Integer, nullable=False)  # 1, 2, 3...
    monto_cuota = Column(Numeric(10, 2), nullable=False)
    monto_pagado = Column(Numeric(10, 2), default=0, nullable=False)
    saldo_cuota = Column(Numeric(10, 2), nullable=False)
    
    # Fechas
    fecha_vencimiento = Column(DateTime, nullable=False)
    fecha_pago = Column(DateTime)
    
    # Estado
    estado = Column(SQLEnum(EstadoCuota), default=EstadoCuota.PENDIENTE, nullable=False)
    
    # Relación con pago (si se pagó)
    pago_id = Column(Integer, ForeignKey("pagos.id"))
    
    # Recordatorio
    recordatorio_enviado = Column(Boolean, default=False)
    fecha_recordatorio = Column(DateTime)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    compromiso = relationship("CompromisoPago", back_populates="cuotas")
    
    def __repr__(self):
        return f"<CuotaPago {self.numero_cuota} - ${self.monto_cuota} - {self.estado}>"
    
    @property
    def esta_vencida(self) -> bool:
        """Verifica si la cuota está vencida"""
        if self.estado == EstadoCuota.PAGADA:
            return False
        return datetime.utcnow() > self.fecha_vencimiento
