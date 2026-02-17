from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_password_hash
from app.api.deps import get_admin_or_gerente
from app.models.usuario import Usuario, RolUsuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioPasswordUpdate, UsuarioResponse


router = APIRouter()


@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    query = db.query(Usuario).filter(Usuario.rol != RolUsuario.ESTUDIANTE)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Usuario.nombre_completo.ilike(term),
                Usuario.email.ilike(term),
                Usuario.cedula.ilike(term)
            )
        )
    return query.order_by(Usuario.created_at.desc()).all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    payload: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    existing_user = db.query(Usuario).filter(
        or_(Usuario.email == payload.email, Usuario.cedula == payload.cedula)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email o cédula ya existe")

    nuevo = Usuario(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        nombre_completo=payload.nombre_completo,
        cedula=payload.cedula,
        tipo_documento=payload.tipo_documento or "CEDULA",
        telefono=payload.telefono,
        rol=payload.rol,
        is_active=payload.is_active if payload.is_active is not None else True,
        is_verified=False,
        permisos_modulos=payload.permisos_modulos
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    payload: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if payload.email and payload.email != usuario.email:
        existe = db.query(Usuario).filter(Usuario.email == payload.email).first()
        if existe:
            raise HTTPException(status_code=400, detail="El email ya está registrado")

    if payload.cedula and payload.cedula != usuario.cedula:
        existe = db.query(Usuario).filter(Usuario.cedula == payload.cedula).first()
        if existe:
            raise HTTPException(status_code=400, detail="La cédula ya está registrada")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.put("/{usuario_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(
    usuario_id: int,
    payload: UsuarioPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return None
