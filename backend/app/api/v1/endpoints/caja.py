from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.api.deps import get_current_active_user, get_admin_or_coordinador
from app.models.usuario import Usuario
from app.models.caja import Caja, MovimientoCaja, EstadoCaja, TipoMovimiento
from app.models.pago import Pago, DetallePago, MetodoPago, EstadoPago
from app.models.estudiante import Estudiante
from app.schemas.caja import (
    CajaApertura, CajaCierre, CajaResumen, CajaDetalle,
    MovimientoCajaCreate, MovimientoCajaResponse,
    PagoCreate, PagoResponse,
    EstudianteFinanciero, DashboardCaja
)

router = APIRouter()


# ==================== CAJA ENDPOINTS ====================

@router.post("/abrir", response_model=CajaResumen, status_code=status.HTTP_201_CREATED)
def abrir_caja(
    caja_data: CajaApertura,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador)
):
    """
    Abrir una nueva caja.
    Solo se puede tener una caja abierta a la vez por usuario.
    """
    # Verificar si ya hay una caja abierta
    caja_abierta = db.query(Caja).filter(
        Caja.estado == EstadoCaja.ABIERTA
    ).first()
    
    if caja_abierta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una caja abierta desde {caja_abierta.fecha_apertura}"
        )
    
    # Crear nueva caja
    nueva_caja = Caja(
        usuario_apertura_id=current_user.id,
        saldo_inicial=caja_data.saldo_inicial,
        observaciones_apertura=caja_data.observaciones_apertura,
        estado=EstadoCaja.ABIERTA
    )
    
    db.add(nueva_caja)
    db.commit()
    db.refresh(nueva_caja)
    
    return _build_caja_resumen(nueva_caja, db)


@router.get("/actual", response_model=Optional[CajaResumen])
def get_caja_actual(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener la caja actualmente abierta"""
    caja = db.query(Caja).filter(Caja.estado == EstadoCaja.ABIERTA).first()
    
    if not caja:
        return None
    
    return _build_caja_resumen(caja, db)


@router.put("/{caja_id}/cerrar", response_model=CajaDetalle)
def cerrar_caja(
    caja_id: int,
    cierre_data: CajaCierre,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador)
):
    """
    Cerrar la caja realizando el arqueo.
    Calcula la diferencia entre efectivo teórico y físico.
    """
    caja = db.query(Caja).filter(Caja.id == caja_id).first()
    
    if not caja:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caja no encontrada"
        )
    
    if caja.estado == EstadoCaja.CERRADA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La caja ya está cerrada"
        )
    
    # Calcular efectivo teórico
    efectivo_teorico = caja.saldo_final_teorico
    
    # Registrar arqueo
    caja.fecha_cierre = datetime.utcnow()
    caja.usuario_cierre_id = current_user.id
    caja.efectivo_teorico = Decimal(str(efectivo_teorico))
    caja.efectivo_fisico = cierre_data.efectivo_fisico
    caja.diferencia = cierre_data.efectivo_fisico - Decimal(str(efectivo_teorico))
    caja.observaciones_cierre = cierre_data.observaciones_cierre
    caja.estado = EstadoCaja.CERRADA
    
    db.commit()
    db.refresh(caja)
    
    return _build_caja_detalle(caja, db)


@router.get("/dashboard", response_model=DashboardCaja)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Dashboard de caja con resumen y alertas
    """
    # Caja actual
    caja_actual = db.query(Caja).filter(Caja.estado == EstadoCaja.ABIERTA).first()
    
    dashboard = DashboardCaja(
        caja_actual=_build_caja_resumen(caja_actual, db) if caja_actual else None,
        hay_caja_abierta=caja_actual is not None
    )
    
    if caja_actual:
        # Resumen del día
        dashboard.total_ingresos_hoy = Decimal(str(caja_actual.total_ingresos))
        dashboard.total_egresos_hoy = Decimal(str(caja_actual.total_egresos))
        dashboard.num_pagos_hoy = db.query(Pago).filter(
            Pago.caja_id == caja_actual.id
        ).count()
        
        # Créditos (NO cuentan en caja)
        dashboard.total_credismart_hoy = Decimal(str(caja_actual.total_credismart))
        dashboard.total_sistecredito_hoy = Decimal(str(caja_actual.total_sistecredito))
        
        # Últimos 5 pagos
        ultimos_pagos = db.query(Pago).filter(
            Pago.caja_id == caja_actual.id
        ).order_by(Pago.fecha_pago.desc()).limit(5).all()
        
        dashboard.ultimos_pagos = [_build_pago_response(p) for p in ultimos_pagos]
        
        # Últimos 5 egresos
        ultimos_egresos = db.query(MovimientoCaja).filter(
            and_(
                MovimientoCaja.caja_id == caja_actual.id,
                MovimientoCaja.tipo == TipoMovimiento.EGRESO
            )
        ).order_by(MovimientoCaja.fecha.desc()).limit(5).all()
        
        dashboard.ultimos_egresos = [_build_movimiento_response(m) for m in ultimos_egresos]
    
    # Alertas: Estudiantes próximos a vencer (90 días)
    hoy = datetime.now()
    fecha_limite = hoy - timedelta(days=83)  # 90 - 7 = 83 (faltan 7 días)
    
    # Contar estudiantes con saldo pendiente y próximos a vencer
    dashboard.estudiantes_proximos_vencer = db.query(Estudiante).join(Pago).filter(
        and_(
            Estudiante.saldo_pendiente > 0,
            Pago.fecha_pago >= fecha_limite,
            Pago.fecha_pago < hoy - timedelta(days=90)
        )
    ).distinct().count()
    
    # Estudiantes vencidos (más de 90 días sin pagar completo)
    fecha_vencida = hoy - timedelta(days=90)
    dashboard.estudiantes_vencidos = db.query(Estudiante).join(Pago).filter(
        and_(
            Estudiante.saldo_pendiente > 0,
            Pago.fecha_pago < fecha_vencida
        )
    ).distinct().count()
    
    return dashboard


@router.get("/historial", response_model=List[CajaResumen])
def get_historial_cajas(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener historial de cajas con filtros"""
    query = db.query(Caja).order_by(Caja.fecha_apertura.desc())
    
    if fecha_inicio:
        query = query.filter(Caja.fecha_apertura >= fecha_inicio)
    
    if fecha_fin:
        query = query.filter(Caja.fecha_apertura <= fecha_fin)
    
    cajas = query.offset(skip).limit(limit).all()
    
    return [_build_caja_resumen(c, db) for c in cajas]


# ==================== PAGOS ENDPOINTS ====================

@router.post("/pagos", response_model=PagoResponse, status_code=status.HTTP_201_CREATED)
def registrar_pago(
    pago_data: PagoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador)
):
    """
    Registrar un pago de estudiante.
    El pago se asocia a la caja abierta y actualiza el saldo del estudiante.
    """
    # Verificar que hay una caja abierta
    caja_abierta = db.query(Caja).filter(Caja.estado == EstadoCaja.ABIERTA).first()
    
    if not caja_abierta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay una caja abierta. Debe abrir caja primero."
        )
    
    # Verificar que el estudiante existe
    estudiante = db.query(Estudiante).filter(Estudiante.id == pago_data.estudiante_id).first()
    
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    # Verificar que el monto no exceda el saldo pendiente
    if estudiante.saldo_pendiente and pago_data.monto > estudiante.saldo_pendiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El monto excede el saldo pendiente (${estudiante.saldo_pendiente})"
        )
    
    try:
        # Crear el pago
        nuevo_pago = Pago(
            estudiante_id=pago_data.estudiante_id,
            caja_id=caja_abierta.id,
            concepto=pago_data.concepto,
            monto=pago_data.monto,
            metodo_pago=pago_data.metodo_pago,  # None si es mixto
            es_pago_mixto=1 if pago_data.es_pago_mixto else 0,
            estado=EstadoPago.COMPLETADO,
            referencia_pago=pago_data.referencia_pago,
            observaciones=pago_data.observaciones,
            fecha_pago=datetime.utcnow(),
            created_by_user_id=current_user.id
        )
        
        db.add(nuevo_pago)
        db.flush()  # Para obtener el ID del pago
        
        # Si es pago mixto, crear detalles y actualizar caja por cada método
        if pago_data.es_pago_mixto:
            for detalle in pago_data.detalles_pago:
                # Crear detalle
                nuevo_detalle = DetallePago(
                    pago_id=nuevo_pago.id,
                    metodo_pago=detalle.metodo_pago,
                    monto=detalle.monto,
                    referencia=detalle.referencia
                )
                db.add(nuevo_detalle)
                
                # Actualizar totales de caja según método
                _actualizar_caja_por_metodo(caja_abierta, detalle.metodo_pago, detalle.monto)
        else:
            # Pago simple - actualizar caja según método único
            _actualizar_caja_por_metodo(caja_abierta, pago_data.metodo_pago, pago_data.monto)
        
        # Actualizar saldo del estudiante
        if estudiante.saldo_pendiente:
            estudiante.saldo_pendiente -= pago_data.monto
        
        db.commit()
        db.refresh(nuevo_pago)
        
        # Cargar explícitamente las relaciones necesarias
        db.refresh(nuevo_pago, ['detalles_pago', 'estudiante', 'usuario'])
        
        return _build_pago_response(nuevo_pago)
        
    except Exception as e:
        db.rollback()
        import traceback
        print(f"ERROR en registrar_pago: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar pago: {str(e)}"
        )


@router.get("/estudiante/{cedula}", response_model=EstudianteFinanciero)
def buscar_estudiante_financiero(
    cedula: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Buscar estudiante por cédula y obtener su información financiera
    """
    estudiante = db.query(Estudiante).join(Usuario).filter(
        Usuario.cedula == cedula
    ).first()
    
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    return _build_estudiante_financiero(estudiante, db)


# ==================== EGRESOS ENDPOINTS ====================

@router.post("/egresos", response_model=MovimientoCajaResponse, status_code=status.HTTP_201_CREATED)
def registrar_egreso(
    egreso_data: MovimientoCajaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador)
):
    """
    Registrar un egreso (gasto) en la caja abierta
    """
    # Verificar que hay una caja abierta
    caja_abierta = db.query(Caja).filter(Caja.estado == EstadoCaja.ABIERTA).first()
    
    if not caja_abierta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay una caja abierta. Debe abrir caja primero."
        )
    
    try:
        # Crear el movimiento
        nuevo_egreso = MovimientoCaja(
            caja_id=caja_abierta.id,
            tipo=TipoMovimiento.EGRESO,
            concepto=egreso_data.concepto,
            categoria=egreso_data.categoria,
            monto=egreso_data.monto,
            metodo_pago=egreso_data.metodo_pago,
            numero_factura=egreso_data.numero_factura,
            observaciones=egreso_data.observaciones,
            usuario_id=current_user.id,
            fecha=datetime.utcnow()
        )
        
        db.add(nuevo_egreso)
        
        # Actualizar totales de la caja según método de pago
        if egreso_data.metodo_pago == MetodoPago.EFECTIVO:
            caja_abierta.total_egresos_efectivo += egreso_data.monto
        elif egreso_data.metodo_pago in [MetodoPago.TRANSFERENCIA_BANCARIA, MetodoPago.NEQUI, MetodoPago.DAVIPLATA]:
            caja_abierta.total_egresos_transferencia += egreso_data.monto
        elif egreso_data.metodo_pago in [MetodoPago.TARJETA_DEBITO, MetodoPago.TARJETA_CREDITO]:
            caja_abierta.total_egresos_tarjeta += egreso_data.monto
        
        db.commit()
        db.refresh(nuevo_egreso)
        
        return _build_movimiento_response(nuevo_egreso)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar egreso: {str(e)}"
        )


# ==================== HELPER FUNCTIONS ====================

def _actualizar_caja_por_metodo(caja: Caja, metodo: MetodoPago, monto: Decimal) -> None:
    """Actualizar totales de caja según método de pago"""
    if metodo == MetodoPago.EFECTIVO:
        caja.total_ingresos_efectivo += monto
    # Transferencias - cada una por separado
    elif metodo == MetodoPago.NEQUI:
        caja.total_nequi += monto
        caja.total_ingresos_transferencia += monto  # Legacy
    elif metodo == MetodoPago.DAVIPLATA:
        caja.total_daviplata += monto
        caja.total_ingresos_transferencia += monto  # Legacy
    elif metodo == MetodoPago.TRANSFERENCIA_BANCARIA:
        caja.total_transferencia_bancaria += monto
        caja.total_ingresos_transferencia += monto  # Legacy
    # Tarjetas - cada una por separado
    elif metodo == MetodoPago.TARJETA_DEBITO:
        caja.total_tarjeta_debito += monto
        caja.total_ingresos_tarjeta += monto  # Legacy
    elif metodo == MetodoPago.TARJETA_CREDITO:
        caja.total_tarjeta_credito += monto
        caja.total_ingresos_tarjeta += monto  # Legacy
    # Créditos - se trackean pero NO entran a caja (plata diferida de financieras)
    elif metodo == MetodoPago.CREDISMART:
        caja.total_credismart += monto
    elif metodo == MetodoPago.SISTECREDITO:
        caja.total_sistecredito += monto

def _build_caja_resumen(caja: Caja, db: Session) -> CajaResumen:
    """Construir resumen de caja"""
    num_pagos = db.query(Pago).filter(Pago.caja_id == caja.id).count()
    num_egresos = db.query(MovimientoCaja).filter(
        and_(
            MovimientoCaja.caja_id == caja.id,
            MovimientoCaja.tipo == TipoMovimiento.EGRESO
        )
    ).count()
    
    return CajaResumen(
        id=caja.id,
        fecha_apertura=caja.fecha_apertura,
        fecha_cierre=caja.fecha_cierre,
        estado=caja.estado,
        usuario_apertura=caja.usuario_apertura.nombre_completo,
        usuario_cierre=caja.usuario_cierre.nombre_completo if caja.usuario_cierre else None,
        saldo_inicial=caja.saldo_inicial,
        total_ingresos=caja.total_ingresos,
        total_egresos=caja.total_egresos,
        saldo_efectivo_caja=caja.saldo_efectivo_caja,
        total_ingresos_efectivo=caja.total_ingresos_efectivo,
        total_ingresos_transferencia=caja.total_ingresos_transferencia,
        total_ingresos_tarjeta=caja.total_ingresos_tarjeta,
        total_egresos_efectivo=caja.total_egresos_efectivo,
        total_egresos_transferencia=caja.total_egresos_transferencia,
        total_egresos_tarjeta=caja.total_egresos_tarjeta,
        # Transferencias separadas
        total_nequi=caja.total_nequi or Decimal('0'),
        total_daviplata=caja.total_daviplata or Decimal('0'),
        total_transferencia_bancaria=caja.total_transferencia_bancaria or Decimal('0'),
        # Tarjetas separadas
        total_tarjeta_debito=caja.total_tarjeta_debito or Decimal('0'),
        total_tarjeta_credito=caja.total_tarjeta_credito or Decimal('0'),
        # Créditos
        total_credismart=caja.total_credismart,
        total_sistecredito=caja.total_sistecredito,
        efectivo_teorico=caja.efectivo_teorico,
        efectivo_fisico=caja.efectivo_fisico,
        diferencia=caja.diferencia,
        num_pagos=num_pagos,
        num_egresos=num_egresos
    )


def _build_caja_detalle(caja: Caja, db: Session) -> CajaDetalle:
    """Construir detalle completo de caja"""
    resumen = _build_caja_resumen(caja, db)
    return CajaDetalle(
        **resumen.model_dump(),
        observaciones_apertura=caja.observaciones_apertura,
        observaciones_cierre=caja.observaciones_cierre,
        created_at=caja.created_at,
        updated_at=caja.updated_at
    )


def _build_pago_response(pago: Pago) -> PagoResponse:
    """Construir respuesta de pago"""
    # Importar dentro de la función para evitar imports circulares
    from app.schemas.caja import DetallePagoResponse
    
    # Construir detalles si es pago mixto
    detalles = []
    if pago.es_pago_mixto:
        detalles = [
            DetallePagoResponse(
                id=d.id,
                metodo_pago=d.metodo_pago,
                monto=d.monto,
                referencia=d.referencia
            )
            for d in pago.detalles_pago
        ]
    
    return PagoResponse(
        id=pago.id,
        estudiante_id=pago.estudiante_id,
        caja_id=pago.caja_id,
        concepto=pago.concepto,
        monto=pago.monto,
        metodo_pago=pago.metodo_pago if pago.metodo_pago else None,
        estado=pago.estado.value,
        referencia_pago=pago.referencia_pago,
        fecha_pago=pago.fecha_pago,
        observaciones=pago.observaciones,
        es_pago_mixto=bool(pago.es_pago_mixto),
        detalles_pago=detalles,
        estudiante_nombre=pago.estudiante.usuario.nombre_completo,
        estudiante_matricula=pago.estudiante.matricula_numero,
        usuario_nombre=pago.usuario.nombre_completo if pago.usuario else None
    )


def _build_movimiento_response(movimiento: MovimientoCaja) -> MovimientoCajaResponse:
    """Construir respuesta de movimiento"""
    return MovimientoCajaResponse(
        id=movimiento.id,
        caja_id=movimiento.caja_id,
        tipo=movimiento.tipo,
        concepto=movimiento.concepto,
        categoria=movimiento.categoria,
        monto=movimiento.monto,
        metodo_pago=movimiento.metodo_pago,
        numero_factura=movimiento.numero_factura,
        comprobante_url=movimiento.comprobante_url,
        fecha=movimiento.fecha,
        observaciones=movimiento.observaciones,
        usuario_nombre=movimiento.usuario.nombre_completo,
        created_at=movimiento.created_at
    )


def _build_estudiante_financiero(estudiante: Estudiante, db: Session) -> EstudianteFinanciero:
    """Construir información financiera del estudiante"""
    # Obtener historial de pagos
    pagos = db.query(Pago).filter(
        and_(
            Pago.estudiante_id == estudiante.id,
            Pago.estado == EstadoPago.COMPLETADO
        )
    ).order_by(Pago.fecha_pago.desc()).all()
    
    total_pagado = sum([p.monto for p in pagos], Decimal('0'))
    num_pagos = len(pagos)
    
    # Primer pago y fecha límite
    primer_pago = pagos[-1] if pagos else None
    fecha_primer_pago = primer_pago.fecha_pago if primer_pago else None
    fecha_limite_pago = fecha_primer_pago + timedelta(days=90) if fecha_primer_pago else None
    
    # Calcular días restantes
    dias_restantes = None
    estado_financiero = "SIN_SERVICIO"
    
    if fecha_limite_pago:
        dias_restantes = (fecha_limite_pago - datetime.now()).days
        
        if estudiante.saldo_pendiente and estudiante.saldo_pendiente > 0:
            if dias_restantes < 0:
                estado_financiero = "VENCIDO"
            elif dias_restantes <= 7:
                estado_financiero = "PROXIMO_VENCER"
            else:
                estado_financiero = "AL_DIA"
        else:
            estado_financiero = "PAGADO_COMPLETO"
    
    # Último pago
    ultimo_pago = pagos[0] if pagos else None
    
    # Construir historial de pagos con detalles
    historial_pagos = [_build_pago_response(p) for p in pagos]
    
    return EstudianteFinanciero(
        id=estudiante.id,
        nombre_completo=estudiante.usuario.nombre_completo,
        cedula=estudiante.usuario.cedula,
        matricula_numero=estudiante.matricula_numero,
        foto_url=estudiante.foto_url,
        tipo_servicio=estudiante.tipo_servicio.value if estudiante.tipo_servicio else None,
        categoria=estudiante.categoria.value if estudiante.categoria else None,
        estado=estudiante.estado.value,
        valor_total_curso=estudiante.valor_total_curso,
        saldo_pendiente=estudiante.saldo_pendiente,
        total_pagado=total_pagado,
        fecha_inscripcion=estudiante.fecha_inscripcion,
        fecha_primer_pago=fecha_primer_pago,
        fecha_limite_pago=fecha_limite_pago,
        dias_restantes=dias_restantes,
        estado_financiero=estado_financiero,
        num_pagos=num_pagos,
        ultimo_pago_fecha=ultimo_pago.fecha_pago if ultimo_pago else None,
        ultimo_pago_monto=ultimo_pago.monto if ultimo_pago else None,
        historial_pagos=historial_pagos
    )
