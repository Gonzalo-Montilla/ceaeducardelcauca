from sqlalchemy import Column, Integer, DateTime, Numeric, Boolean, Enum as SQLEnum
from datetime import datetime
from app.core.database import Base
from app.models.estudiante import TipoServicio


class Tarifa(Base):
    """Tarifas por tipo de servicio"""
    __tablename__ = "tarifas"

    id = Column(Integer, primary_key=True, index=True)
    tipo_servicio = Column(SQLEnum(TipoServicio, native_enum=False), unique=True, nullable=False)
    precio_base = Column(Numeric(10, 2), nullable=False)
    costo_practica = Column(Numeric(10, 2), default=0, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Tarifa {self.tipo_servicio} - ${self.precio_base}>"
