from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime, date
import re


class VehiculoBase(BaseModel):
    """Schema base para Vehículo"""
    placa: str
    tipo: Optional[str] = None  # MOTO, AUTO, CAMION, etc.
    marca: Optional[str] = None
    modelo: Optional[str] = None
    año: Optional[int] = None
    color: Optional[str] = None
    cilindraje: Optional[str] = None
    vin: Optional[str] = None
    foto_url: Optional[str] = None
    kilometraje_actual: Optional[int] = None


class VehiculoCreate(VehiculoBase):
    """Schema para crear vehículo"""

    @field_validator('placa')
    @classmethod
    def validate_placa(cls, v: str) -> str:
        value = v.strip().upper()
        if not re.fullmatch(r'[A-Z0-9\-]{5,10}', value):
            raise ValueError('La placa debe tener entre 5 y 10 caracteres alfanuméricos')
        return value

    @field_validator('año')
    @classmethod
    def validate_anio(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 1980 or v > datetime.utcnow().year + 1:
            raise ValueError('El año del vehículo no es válido')
        return v

    @field_validator('kilometraje_actual')
    @classmethod
    def validate_km(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 0:
            raise ValueError('El kilometraje no puede ser negativo')
        return v


class VehiculoUpdate(BaseModel):
    """Schema para actualizar vehículo"""
    placa: Optional[str] = None
    tipo: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    año: Optional[int] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None
    cilindraje: Optional[str] = None
    vin: Optional[str] = None
    foto_url: Optional[str] = None
    kilometraje_actual: Optional[int] = None

    @field_validator('placa')
    @classmethod
    def validate_placa(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        value = v.strip().upper()
        if not re.fullmatch(r'[A-Z0-9\-]{5,10}', value):
            raise ValueError('La placa debe tener entre 5 y 10 caracteres alfanuméricos')
        return value

    @field_validator('año')
    @classmethod
    def validate_anio(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 1980 or v > datetime.utcnow().year + 1:
            raise ValueError('El año del vehículo no es válido')
        return v

    @field_validator('kilometraje_actual')
    @classmethod
    def validate_km(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 0:
            raise ValueError('El kilometraje no puede ser negativo')
        return v


class VehiculoResponse(BaseModel):
    """Schema para respuesta de vehículo"""
    id: int
    placa: str
    tipo: Optional[str]
    marca: Optional[str]
    modelo: Optional[str]
    año: Optional[int]
    color: Optional[str]
    cilindraje: Optional[str]
    vin: Optional[str]
    foto_url: Optional[str]
    kilometraje_actual: Optional[int]
    soat_vencimiento: Optional[date] = None
    rtm_vencimiento: Optional[date] = None
    tecnomecanica_vencimiento: Optional[date] = None
    seguro_vencimiento: Optional[date] = None
    soat_url: Optional[str] = None
    rtm_url: Optional[str] = None
    seguro_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VehiculosListResponse(BaseModel):
    """Schema para respuesta paginada de vehículos"""
    items: List[VehiculoResponse]
    total: int
    skip: int
    limit: int


class MantenimientoCreate(BaseModel):
    """Registrar mantenimiento o falla"""
    tipo: Optional[str] = "FALLA"
    descripcion_falla: Optional[str] = None
    diagnostico: Optional[str] = None
    reparacion_requerida: Optional[str] = None
    estado: Optional[str] = "ABIERTO"
    km_registro: Optional[int] = None
    costo_total: Optional[float] = 0
    taller: Optional[str] = None
    observaciones: Optional[str] = None


class MantenimientoUpdate(BaseModel):
    """Actualizar mantenimiento"""
    tipo: Optional[str] = None
    descripcion_falla: Optional[str] = None
    diagnostico: Optional[str] = None
    reparacion_requerida: Optional[str] = None
    estado: Optional[str] = None
    km_registro: Optional[int] = None
    costo_total: Optional[float] = None
    taller: Optional[str] = None
    observaciones: Optional[str] = None


class RepuestoCreate(BaseModel):
    """Registrar repuesto"""
    nombre: str
    cantidad: int = 1
    costo_unitario: float = 0
    proveedor: Optional[str] = None


class RepuestoResponse(BaseModel):
    id: int
    nombre: str
    cantidad: int
    costo_unitario: float
    proveedor: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AdjuntoResponse(BaseModel):
    id: int
    archivo_url: str
    nombre_archivo: Optional[str]
    mime: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MantenimientoResponse(BaseModel):
    id: int
    vehiculo_id: int
    fecha: datetime
    tipo: str
    descripcion_falla: Optional[str]
    diagnostico: Optional[str]
    reparacion_requerida: Optional[str]
    estado: str
    km_registro: Optional[int]
    costo_total: float
    taller: Optional[str]
    observaciones: Optional[str]
    created_at: datetime
    repuestos: List[RepuestoResponse] = []
    adjuntos: List[AdjuntoResponse] = []

    class Config:
        from_attributes = True


class MantenimientosListResponse(BaseModel):
    items: List[MantenimientoResponse]
    total: int
    skip: int
    limit: int


class CombustibleCreate(BaseModel):
    """Registrar consumo de combustible"""
    fecha: Optional[datetime] = None
    km_inicial: int
    km_final: Optional[int] = None
    nivel_inicial: Optional[str] = None
    nivel_final: Optional[str] = None
    litros: Optional[float] = None
    costo: Optional[float] = None
    recibo_url: Optional[str] = None
    conductor: Optional[str] = None
    observaciones: Optional[str] = None

    @model_validator(mode='after')
    def validate_km(self):
        if self.km_final is not None and self.km_final < self.km_inicial:
            raise ValueError('El km final no puede ser menor al km inicial')
        return self


class CombustibleResponse(BaseModel):
    id: int
    vehiculo_id: int
    fecha: datetime
    km_inicial: int
    km_final: Optional[int]
    nivel_inicial: Optional[str]
    nivel_final: Optional[str]
    litros: Optional[float]
    costo: Optional[float]
    recibo_url: Optional[str]
    conductor: Optional[str]
    observaciones: Optional[str]
    created_at: datetime
    adjuntos: List[AdjuntoResponse] = []

    class Config:
        from_attributes = True


class CombustiblesListResponse(BaseModel):
    items: List[CombustibleResponse]
    total: int
    skip: int
    limit: int


class ConsumoUmbralCreate(BaseModel):
    tipo: str
    km_por_galon_min: float


class ConsumoUmbralUpdate(BaseModel):
    km_por_galon_min: float


class ConsumoUmbralResponse(BaseModel):
    id: int
    tipo: str
    km_por_galon_min: float
    created_at: datetime

    class Config:
        from_attributes = True


class ConsumoResumenResponse(BaseModel):
    vehiculo_id: int
    registros: int
    total_km: float
    total_galones: float
    consumo_promedio: float
    costo_total: float
    costo_por_km: float
    faltan_km_final: int
    umbral_km_por_galon_min: Optional[float] = None
    alerta_bajo_consumo: bool = False


class ExportHojaVidaResponse(BaseModel):
    vehiculo: VehiculoResponse
    mantenimientos: List[MantenimientoResponse]
    combustibles: List[CombustibleResponse]
    resumen: ConsumoResumenResponse
