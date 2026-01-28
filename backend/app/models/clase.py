from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class TipoClase(str, enum.Enum):
    """Tipo de clase"""
    TEORICA = "TEORICA"
    PRACTICA = "PRACTICA"


class EstadoClase(str, enum.Enum):
    """Estado de la clase"""
    PROGRAMADA = "PROGRAMADA"
    COMPLETADA = "COMPLETADA"
    CANCELADA = "CANCELADA"


class Clase(Base):
    """Modelo de Clase"""
    __tablename__ = "clases"
    
    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("instructores.id"))
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    
    # Información de la clase
    tipo = Column(SQLEnum(TipoClase), nullable=False)
    estado = Column(SQLEnum(EstadoClase), default=EstadoClase.PROGRAMADA, nullable=False)
    fecha_programada = Column(DateTime, nullable=False)
    fecha_completada = Column(DateTime)
    duracion_horas = Column(Integer, default=1, nullable=False)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    estudiante = relationship("Estudiante", back_populates="clases")
    instructor = relationship("Instructor", back_populates="clases")
    vehiculo = relationship("Vehiculo", back_populates="clases")
    
    def __repr__(self):
        return f"<Clase {self.tipo} - {self.fecha_programada}>"


class Instructor(Base):
    """Modelo de Instructor"""
    __tablename__ = "instructores"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    
    # Información específica
    licencia_numero = Column(String(50), unique=True)
    categorias_enseña = Column(String(100))  # Ej: "A2,B1,C1"
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    clases = relationship("Clase", back_populates="instructor")
    
    def __repr__(self):
        return f"<Instructor {self.licencia_numero}>"


class Vehiculo(Base):
    """Modelo de Vehículo"""
    __tablename__ = "vehiculos"
    
    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), unique=True, nullable=False)
    tipo = Column(String(50))  # MOTO, AUTO, CAMION
    marca = Column(String(50))
    modelo = Column(String(50))
    año = Column(Integer)
    is_active = Column(Integer, default=1)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    clases = relationship("Clase", back_populates="vehiculo")
    
    def __repr__(self):
        return f"<Vehiculo {self.placa} - {self.tipo}>"


class Evaluacion(Base):
    """Modelo de Evaluación"""
    __tablename__ = "evaluaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    tipo = Column(String(50))  # TEORICO, PRACTICO
    puntaje = Column(Integer)
    aprobado = Column(Integer, default=0)
    fecha = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    estudiante = relationship("Estudiante", back_populates="evaluaciones")
    
    def __repr__(self):
        return f"<Evaluacion {self.tipo} - {self.puntaje}>"
