from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.usuario import RolUsuario


class UserLogin(BaseModel):
    """Schema para login de usuario"""
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    """Schema para registro de usuario"""
    email: EmailStr
    password: str
    nombre_completo: str
    cedula: str
    telefono: str
    rol: RolUsuario


class Token(BaseModel):
    """Schema para respuesta de tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema para datos del token decodificado"""
    user_id: int


class UserResponse(BaseModel):
    """Schema para respuesta de usuario"""
    id: int
    email: str
    nombre_completo: str
    cedula: str
    telefono: Optional[str]
    rol: RolUsuario
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True
