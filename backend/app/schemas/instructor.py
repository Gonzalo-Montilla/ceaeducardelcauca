from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


# ==================== SCHEMAS BASE ====================

class InstructorBase(BaseModel):
    """Schema base de Instructor"""
    licencia_numero: str = Field(..., min_length=5, max_length=50)
    categorias_enseña: str = Field(..., description="Categorías separadas por coma. Ej: 'A2,B1,C1'")
    especialidad: Optional[str] = Field(None, max_length=200)
    estado: str = Field(default="ACTIVO")
    fecha_contratacion: Optional[date] = None
    certificaciones: Optional[str] = None
    tipo_contrato: Optional[str] = Field(None, max_length=50)
    foto_url: Optional[str] = None
    
    # Vigencias de documentos
    licencia_vigencia_desde: Optional[date] = None
    licencia_vigencia_hasta: Optional[date] = None
    certificado_vigencia_desde: Optional[date] = None
    certificado_vigencia_hasta: Optional[date] = None
    examen_medico_fecha: Optional[date] = None
    
    # URLs de documentos PDF
    cedula_pdf_url: Optional[str] = None
    licencia_pdf_url: Optional[str] = None
    certificado_pdf_url: Optional[str] = None
    
    # Información adicional
    numero_runt: Optional[str] = Field(None, max_length=50)
    estado_documentacion: Optional[str] = Field(default="INCOMPLETO")
    
    @validator('categorias_enseña')
    def validar_categorias(cls, v):
        """Validar que las categorías sean válidas"""
        categorias_validas = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']
        categorias = [c.strip().upper() for c in v.split(',')]
        
        for cat in categorias:
            if cat not in categorias_validas:
                raise ValueError(f"Categoría inválida: {cat}. Válidas: {', '.join(categorias_validas)}")
        
        return ','.join(categorias)
    
    @validator('estado')
    def validar_estado(cls, v):
        """Validar que el estado sea válido"""
        estados_validos = ['ACTIVO', 'LICENCIA_MEDICA', 'VACACIONES', 'INACTIVO']
        if v.upper() not in estados_validos:
            raise ValueError(f"Estado inválido. Válidos: {', '.join(estados_validos)}")
        return v.upper()


class InstructorCreate(InstructorBase):
    """Schema para crear instructor"""
    usuario_id: int = Field(..., description="ID del usuario asociado")


class InstructorUpdate(BaseModel):
    """Schema para actualizar instructor (todos los campos opcionales)"""
    licencia_numero: Optional[str] = Field(None, min_length=5, max_length=50)
    categorias_enseña: Optional[str] = None
    especialidad: Optional[str] = Field(None, max_length=200)
    estado: Optional[str] = None
    fecha_contratacion: Optional[date] = None
    certificaciones: Optional[str] = None
    tipo_contrato: Optional[str] = Field(None, max_length=50)
    foto_url: Optional[str] = None
    
    # Vigencias de documentos
    licencia_vigencia_desde: Optional[date] = None
    licencia_vigencia_hasta: Optional[date] = None
    certificado_vigencia_desde: Optional[date] = None
    certificado_vigencia_hasta: Optional[date] = None
    examen_medico_fecha: Optional[date] = None
    
    # URLs de documentos PDF
    cedula_pdf_url: Optional[str] = None
    licencia_pdf_url: Optional[str] = None
    certificado_pdf_url: Optional[str] = None
    
    # Información adicional
    numero_runt: Optional[str] = Field(None, max_length=50)
    estado_documentacion: Optional[str] = None
    
    @validator('categorias_enseña')
    def validar_categorias(cls, v):
        if v is None:
            return v
        categorias_validas = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']
        categorias = [c.strip().upper() for c in v.split(',')]
        for cat in categorias:
            if cat not in categorias_validas:
                raise ValueError(f"Categoría inválida: {cat}")
        return ','.join(categorias)
    
    @validator('estado')
    def validar_estado(cls, v):
        if v is None:
            return v
        estados_validos = ['ACTIVO', 'LICENCIA_MEDICA', 'VACACIONES', 'INACTIVO']
        if v.upper() not in estados_validos:
            raise ValueError(f"Estado inválido")
        return v.upper()


# ==================== SCHEMAS DE RESPUESTA ====================

class InstructorResponse(InstructorBase):
    """Schema de respuesta de instructor con datos del usuario"""
    id: int
    usuario_id: int
    nombre_completo: str
    cedula: str
    email: str
    telefono: str
    calificacion_promedio: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else 0.0
        }


class InstructorList(BaseModel):
    """Schema para lista de instructores (más ligero)"""
    id: int
    usuario_id: int
    nombre_completo: str
    cedula: str
    telefono: str
    foto_url: Optional[str] = None
    licencia_numero: str
    categorias_enseña: str
    especialidad: Optional[str] = None
    estado: str
    calificacion_promedio: Decimal
    estado_documentacion: Optional[str] = None
    licencia_vigencia_hasta: Optional[date] = None  # Para mostrar alertas
    certificado_vigencia_hasta: Optional[date] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else 0.0
        }


class InstructorEstadisticas(BaseModel):
    """Estadísticas del instructor"""
    total_clases: int
    clases_teoricas: int
    clases_practicas: int
    horas_impartidas: int
    estudiantes_atendidos: int
    clases_mes_actual: int
    promedio_calificacion: Decimal
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else 0.0
        }


class InstructorDetalle(InstructorResponse):
    """Detalle completo del instructor con estadísticas"""
    estadisticas: InstructorEstadisticas
    
    class Config:
        from_attributes = True


# ==================== RESPUESTAS PAGINADAS ====================

class InstructoresListResponse(BaseModel):
    """Respuesta paginada de lista de instructores"""
    items: List[InstructorList]
    total: int
    skip: int
    limit: int
