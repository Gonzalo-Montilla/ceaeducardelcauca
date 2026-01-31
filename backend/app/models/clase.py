from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Date, Text, Numeric
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


class EstadoInstructor(str, enum.Enum):
    """Estado del instructor"""
    ACTIVO = "ACTIVO"
    LICENCIA_MEDICA = "LICENCIA_MEDICA"
    VACACIONES = "VACACIONES"
    INACTIVO = "INACTIVO"


class EstadoDocumentacion(str, enum.Enum):
    """Estado de la documentación del instructor"""
    COMPLETO = "COMPLETO"
    INCOMPLETO = "INCOMPLETO"
    VENCIDO = "VENCIDO"
    PROXIMO_VENCER = "PROXIMO_VENCER"  # 30 días o menos


class Instructor(Base):
    """Modelo de Instructor"""
    __tablename__ = "instructores"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    
    # Información específica
    licencia_numero = Column(String(50), unique=True)
    categorias_enseña = Column(String(100))  # Ej: "A2,B1,C1"
    foto_url = Column(Text)
    especialidad = Column(String(200))  # Ej: "Experto en motos", "Clases nocturnas"
    estado = Column(SQLEnum(EstadoInstructor), default=EstadoInstructor.ACTIVO, nullable=False)
    fecha_contratacion = Column(Date)
    certificaciones = Column(Text)  # Certificados SENA, etc.
    tipo_contrato = Column(String(50))  # POR_HORAS, FIJO, INDEPENDIENTE
    calificacion_promedio = Column(Numeric(3, 2), default=0.0)  # 0.00 a 5.00
    
    # Vigencias de documentos
    licencia_vigencia_desde = Column(Date)
    licencia_vigencia_hasta = Column(Date)
    certificado_vigencia_desde = Column(Date)
    certificado_vigencia_hasta = Column(Date)
    examen_medico_fecha = Column(Date)  # Último examen médico
    
    # Documentos en PDF
    cedula_pdf_url = Column(Text)
    licencia_pdf_url = Column(Text)
    certificado_pdf_url = Column(Text)
    
    # Información adicional
    numero_runt = Column(String(50))  # RUNT - Registro Único Nacional de Tránsito
    estado_documentacion = Column(SQLEnum(EstadoDocumentacion), default=EstadoDocumentacion.INCOMPLETO)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    usuario = relationship("Usuario", backref="instructor")
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
