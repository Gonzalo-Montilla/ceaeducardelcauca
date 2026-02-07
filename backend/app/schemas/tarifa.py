from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.estudiante import TipoServicio


class TarifaBase(BaseModel):
    tipo_servicio: TipoServicio
    precio_base: Decimal
    costo_practica: Optional[Decimal] = Decimal("0")
    activo: Optional[bool] = True

    @field_validator("precio_base")
    @classmethod
    def validar_precio_base(cls, v: Decimal) -> Decimal:
        if v is None or v < 0:
            raise ValueError("El precio base no puede ser negativo")
        return v

    @field_validator("costo_practica")
    @classmethod
    def validar_costo_practica(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("El costo de práctica no puede ser negativo")
        return v


class TarifaCreate(TarifaBase):
    pass


class TarifaUpdate(BaseModel):
    precio_base: Optional[Decimal] = None
    costo_practica: Optional[Decimal] = None
    activo: Optional[bool] = None

    @field_validator("precio_base")
    @classmethod
    def validar_precio_base(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("El precio base no puede ser negativo")
        return v

    @field_validator("costo_practica")
    @classmethod
    def validar_costo_practica(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("El costo de práctica no puede ser negativo")
        return v


class TarifaResponse(BaseModel):
    id: int
    tipo_servicio: TipoServicio
    precio_base: Decimal
    costo_practica: Decimal
    activo: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
