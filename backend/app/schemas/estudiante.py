from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.models.estudiante import CategoriaLicencia, EstadoEstudiante, OrigenCliente, TipoServicio


class EstudianteBase(BaseModel):
    """Schema base para Estudiante"""
    fecha_nacimiento: date
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    barrio: Optional[str] = None
    tipo_sangre: Optional[str] = None
    eps: Optional[str] = None
    ocupacion: Optional[str] = None
    estado_civil: Optional[str] = None
    nivel_educativo: Optional[str] = None
    estrato: Optional[int] = None
    nivel_sisben: Optional[str] = None
    necesidades_especiales: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None


class EstudianteCreate(EstudianteBase):
    """Schema para crear un estudiante (solo datos personales)"""
    email: EmailStr
    password: str
    nombre_completo: str
    cedula: str
    telefono: str
    foto_base64: str  # Foto en base64


class EstudianteUpdate(BaseModel):
    """Schema para actualizar un estudiante"""
    fecha_nacimiento: Optional[date] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    barrio: Optional[str] = None
    tipo_sangre: Optional[str] = None
    eps: Optional[str] = None
    ocupacion: Optional[str] = None
    estado_civil: Optional[str] = None
    nivel_educativo: Optional[str] = None
    estrato: Optional[int] = None
    nivel_sisben: Optional[str] = None
    necesidades_especiales: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    estado: Optional[EstadoEstudiante] = None
    horas_teoricas_completadas: Optional[int] = None
    horas_practicas_completadas: Optional[int] = None
    saldo_pendiente: Optional[Decimal] = None


class EstudianteResponse(BaseModel):
    """Schema para respuesta de estudiante"""
    id: int
    usuario_id: int
    matricula_numero: Optional[str]
    fecha_nacimiento: date
    direccion: Optional[str]
    ciudad: Optional[str]
    barrio: Optional[str]
    tipo_sangre: Optional[str]
    eps: Optional[str]
    ocupacion: Optional[str]
    estado_civil: Optional[str]
    nivel_educativo: Optional[str]
    estrato: Optional[int]
    nivel_sisben: Optional[str]
    necesidades_especiales: Optional[str]
    contacto_emergencia_nombre: Optional[str]
    contacto_emergencia_telefono: Optional[str]
    foto_url: Optional[str]
    categoria: Optional[CategoriaLicencia]  # Opcional hasta definir servicio
    estado: EstadoEstudiante
    fecha_inscripcion: datetime
    fecha_graduacion: Optional[datetime]
    no_certificado: Optional[str]
    horas_teoricas_completadas: int = 0
    horas_practicas_completadas: int = 0
    horas_teoricas_requeridas: int = 0
    horas_practicas_requeridas: int = 0
    valor_total_curso: Optional[Decimal] = None  # Opcional hasta definir servicio
    saldo_pendiente: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime]
    nombre_completo: str
    cedula: str
    email: str
    telefono: str
    progreso_teorico: float = 0.0
    progreso_practico: float = 0.0
    esta_listo_para_examen: bool = False

    class Config:
        from_attributes = True


class EstudianteListItem(BaseModel):
    """Schema para lista de estudiantes"""
    id: int
    usuario_id: int
    nombre_completo: str
    cedula: str
    email: str
    telefono: str
    foto_url: Optional[str] = None
    matricula_numero: Optional[str] = None
    categoria: Optional[CategoriaLicencia] = None
    estado: EstadoEstudiante
    fecha_inscripcion: datetime
    progreso_teorico: float = 0.0
    progreso_practico: float = 0.0
    saldo_pendiente: Optional[Decimal] = None
    
    class Config:
        from_attributes = True
