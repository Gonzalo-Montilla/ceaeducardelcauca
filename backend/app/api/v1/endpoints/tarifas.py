from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_admin_or_gerente
from app.models.usuario import Usuario
from app.models.tarifa import Tarifa
from app.schemas.tarifa import TarifaCreate, TarifaUpdate, TarifaResponse


router = APIRouter()


@router.get("/", response_model=List[TarifaResponse])
def listar_tarifas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    return db.query(Tarifa).order_by(Tarifa.tipo_servicio.asc()).all()


@router.get("/{tarifa_id}", response_model=TarifaResponse)
def obtener_tarifa(
    tarifa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    tarifa = db.query(Tarifa).filter(Tarifa.id == tarifa_id).first()
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    return tarifa


@router.post("/", response_model=TarifaResponse, status_code=status.HTTP_201_CREATED)
def crear_tarifa(
    payload: TarifaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    existente = db.query(Tarifa).filter(Tarifa.tipo_servicio == payload.tipo_servicio).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una tarifa para ese servicio")

    tarifa = Tarifa(
        tipo_servicio=payload.tipo_servicio,
        precio_base=payload.precio_base,
        costo_practica=payload.costo_practica or 0,
        activo=payload.activo if payload.activo is not None else True
    )
    db.add(tarifa)
    db.commit()
    db.refresh(tarifa)
    return tarifa


@router.put("/{tarifa_id}", response_model=TarifaResponse)
def actualizar_tarifa(
    tarifa_id: int,
    payload: TarifaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    tarifa = db.query(Tarifa).filter(Tarifa.id == tarifa_id).first()
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tarifa, field, value)

    db.commit()
    db.refresh(tarifa)
    return tarifa


@router.delete("/{tarifa_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_tarifa(
    tarifa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_gerente)
):
    tarifa = db.query(Tarifa).filter(Tarifa.id == tarifa_id).first()
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    tarifa.activo = False
    db.commit()
    return None
