from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract, cast, Date
from typing import Optional
from datetime import datetime, timedelta, date
from decimal import Decimal

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.usuario import Usuario
from app.models.caja import Caja, MovimientoCaja, EstadoCaja, ConceptoEgreso
from app.models.pago import Pago, DetallePago, MetodoPago, EstadoPago
from app.models.compromiso_pago import CuotaPago, EstadoCuota
from app.models.estudiante import Estudiante, EstadoEstudiante
from app.models.clase import MantenimientoVehiculo
from app.schemas.reportes import (
    DashboardEjecutivo, KPIDashboard, KPIMetrica,
    GraficoEvolucionIngresos, GraficoMetodosPago,
    GraficoEstudiantesCategorias, GraficoEgresos,
    DatoPunto, DatoCategoria,
    EstudianteRegistrado, EstudiantePago, ReferidoRanking,
    AlertasOperativas
)

router = APIRouter()


# ==================== DASHBOARD EJECUTIVO ====================

@router.get("/dashboard", response_model=DashboardEjecutivo)
def get_dashboard_ejecutivo(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    comparar_periodo_anterior: bool = False,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Dashboard ejecutivo con KPIs y gráficos principales
    """
    # Si no se especifican fechas, usar mes actual
    if not fecha_fin:
        fecha_fin = datetime.now()
    if not fecha_inicio:
        fecha_inicio = fecha_fin.replace(day=1)
    
    # Convertir a fechas locales (sin hora) para comparar
    fecha_inicio_date = fecha_inicio.date()
    fecha_fin_date = fecha_fin.date()
    
    print(f"\n📅 REPORTES - Período (fecha local): {fecha_inicio_date} hasta {fecha_fin_date}")
    
    # Calcular KPIs
    kpis = _calcular_kpis(db, fecha_inicio_date, fecha_fin_date, comparar_periodo_anterior)
    
    # Gráfico de evolución de ingresos (período seleccionado)
    grafico_ingresos = _grafico_evolucion_ingresos(db, fecha_inicio_date, fecha_fin_date)
    
    # Gráfico de métodos de pago (período actual)
    grafico_metodos = _grafico_metodos_pago(db, fecha_inicio_date, fecha_fin_date)
    
    # Gráfico de estudiantes por categoría
    grafico_estudiantes = _grafico_estudiantes_categorias(db)
    
    # Gráfico de egresos por categoría (período actual)
    grafico_egresos = _grafico_egresos_categoria(db, fecha_inicio_date, fecha_fin_date)
    
    # Ranking de referidos
    ranking_referidos = _ranking_referidos(db, fecha_inicio_date, fecha_fin_date)
    
    # Listas de estudiantes
    lista_registrados = _lista_estudiantes_registrados(db, fecha_inicio_date, fecha_fin_date)
    lista_pagos = _lista_estudiantes_pagos(db, fecha_inicio_date, fecha_fin_date)
    
    return DashboardEjecutivo(
        kpis=kpis,
        grafico_ingresos=grafico_ingresos,
        grafico_metodos_pago=grafico_metodos,
        grafico_estudiantes=grafico_estudiantes,
        grafico_egresos=grafico_egresos,
        ranking_referidos=ranking_referidos,
        lista_estudiantes_registrados=lista_registrados,
        lista_estudiantes_pagos=lista_pagos,
        fecha_generacion=datetime.now(),
        periodo_inicio=fecha_inicio,
        periodo_fin=fecha_fin
    )


@router.get("/alertas-operativas", response_model=AlertasOperativas)
def get_alertas_operativas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    ahora = datetime.utcnow()

    caja = db.query(Caja).filter(Caja.estado == EstadoCaja.ABIERTA).order_by(Caja.fecha_apertura.desc()).first()
    caja_abierta = bool(caja)
    caja_abierta_horas = None
    if caja and caja.fecha_apertura:
        caja_abierta_horas = round((ahora - caja.fecha_apertura).total_seconds() / 3600, 1)

    pagos_vencidos_query = db.query(Pago).filter(
        Pago.estado == EstadoPago.PENDIENTE,
        Pago.fecha_vencimiento.isnot(None),
        Pago.fecha_vencimiento < ahora
    )
    pagos_vencidos_cantidad = pagos_vencidos_query.count()
    pagos_vencidos_total = pagos_vencidos_query.with_entities(func.sum(Pago.monto)).scalar() or Decimal('0')

    ventana_fin = ahora + timedelta(days=7)
    compromisos_query = db.query(CuotaPago).filter(
        CuotaPago.estado.in_([EstadoCuota.PENDIENTE, EstadoCuota.PARCIAL]),
        CuotaPago.fecha_vencimiento >= ahora,
        CuotaPago.fecha_vencimiento <= ventana_fin
    )
    compromisos_por_vencer_cantidad = compromisos_query.count()
    compromisos_por_vencer_total = compromisos_query.with_entities(func.sum(CuotaPago.saldo_cuota)).scalar() or Decimal('0')

    pin_por_vencer_cantidad = 0
    pin_limite = ahora + timedelta(days=90)
    estudiantes_pin = db.query(Estudiante).filter(Estudiante.sicov_pin.isnot(None)).all()
    for est in estudiantes_pin:
        fecha_pin = _parse_pin_vencimiento(est)
        if fecha_pin and ahora <= fecha_pin <= pin_limite:
            pin_por_vencer_cantidad += 1

    fallas_abiertas_cantidad = db.query(MantenimientoVehiculo).filter(
        MantenimientoVehiculo.tipo == "FALLA",
        MantenimientoVehiculo.estado.in_(["ABIERTO", "EN_PROCESO"])
    ).count()

    estudiantes_listos_examen_cantidad = db.query(Estudiante).filter(
        Estudiante.horas_teoricas_completadas >= Estudiante.horas_teoricas_requeridas,
        Estudiante.horas_practicas_completadas >= Estudiante.horas_practicas_requeridas,
        ~Estudiante.estado.in_([EstadoEstudiante.GRADUADO, EstadoEstudiante.DESERTOR, EstadoEstudiante.RETIRADO])
    ).count()

    return AlertasOperativas(
        caja_abierta=caja_abierta,
        caja_id=caja.id if caja else None,
        caja_abierta_horas=caja_abierta_horas,
        pagos_vencidos_cantidad=pagos_vencidos_cantidad,
        pagos_vencidos_total=pagos_vencidos_total,
        compromisos_por_vencer_cantidad=compromisos_por_vencer_cantidad,
        compromisos_por_vencer_total=compromisos_por_vencer_total,
        pin_por_vencer_cantidad=pin_por_vencer_cantidad,
        fallas_abiertas_cantidad=fallas_abiertas_cantidad,
        estudiantes_listos_examen_cantidad=estudiantes_listos_examen_cantidad
    )


# ==================== FUNCIONES AUXILIARES ====================

def _calcular_kpis(
    db: Session,
    fecha_inicio: date,
    fecha_fin: date,
    comparar: bool
) -> KPIDashboard:
    """Calcula todos los KPIs del dashboard"""
    
    # Calcular período anterior si se solicita comparación
    if comparar:
        dias_periodo = (fecha_fin - fecha_inicio).days
        fecha_inicio_anterior = fecha_inicio - timedelta(days=dias_periodo)
        fecha_fin_anterior = fecha_inicio
    
    # INGRESOS TOTALES (de cajas por fecha de apertura, incluye abiertas y cerradas)
    # Usar CAST a DATE para comparar solo fechas, ignorando horas
    cajas_periodo = db.query(Caja).filter(
        and_(
            cast(Caja.fecha_apertura, Date) >= fecha_inicio,
            cast(Caja.fecha_apertura, Date) <= fecha_fin
        )
    ).all()
    
    print(f"💼 Cajas encontradas en el período: {len(cajas_periodo)}")
    ingresos_actual = Decimal('0')
    for caja in cajas_periodo:
        total_caja = (
            (caja.total_ingresos_efectivo or Decimal('0')) +
            (caja.total_ingresos_transferencia or Decimal('0')) +
            (caja.total_ingresos_tarjeta or Decimal('0'))
        )
        ingresos_actual += total_caja
        print(f"  - Caja ID {caja.id} ({caja.fecha_apertura.date()}): Efectivo=${caja.total_ingresos_efectivo}, Transf=${caja.total_ingresos_transferencia}, Tarj=${caja.total_ingresos_tarjeta}, Total=${total_caja}")
    
    print(f"💵 Total ingresos del período: ${ingresos_actual}")
    
    ingresos_anterior = None
    cambio_ingresos = None
    tendencia_ingresos = "neutral"
    
    if comparar:
        cajas_anterior = db.query(Caja).filter(
            and_(
                cast(Caja.fecha_apertura, Date) >= fecha_inicio_anterior,
                cast(Caja.fecha_apertura, Date) < fecha_fin_anterior
            )
        ).all()
        
        ingresos_anterior = Decimal('0')
        for caja in cajas_anterior:
            ingresos_anterior += (
                (caja.total_ingresos_efectivo or Decimal('0')) +
                (caja.total_ingresos_transferencia or Decimal('0')) +
                (caja.total_ingresos_tarjeta or Decimal('0'))
            )
        
        if ingresos_anterior > 0:
            cambio_ingresos = float(((ingresos_actual - ingresos_anterior) / ingresos_anterior) * 100)
            tendencia_ingresos = "up" if cambio_ingresos > 0 else "down" if cambio_ingresos < 0 else "neutral"
    
    # EGRESOS TOTALES (de cajas por fecha de apertura)
    egresos_actual = Decimal('0')
    for caja in cajas_periodo:
        egresos_actual += (
            (caja.total_egresos_efectivo or Decimal('0')) +
            (caja.total_egresos_transferencia or Decimal('0')) +
            (caja.total_egresos_tarjeta or Decimal('0'))
        )
    
    egresos_anterior = None
    cambio_egresos = None
    tendencia_egresos = "neutral"
    
    if comparar:
        egresos_anterior = Decimal('0')
        for caja in cajas_anterior:
            egresos_anterior += (
                (caja.total_egresos_efectivo or Decimal('0')) +
                (caja.total_egresos_transferencia or Decimal('0')) +
                (caja.total_egresos_tarjeta or Decimal('0'))
            )
        
        if egresos_anterior > 0:
            cambio_egresos = float(((egresos_actual - egresos_anterior) / egresos_anterior) * 100)
            tendencia_egresos = "down" if cambio_egresos > 0 else "up" if cambio_egresos < 0 else "neutral"
    
    # SALDO PENDIENTE TOTAL
    saldo_pendiente = db.query(func.sum(Estudiante.saldo_pendiente)).filter(
        Estudiante.saldo_pendiente > 0
    ).scalar() or Decimal('0')
    
    # MARGEN OPERATIVO
    margen_operativo = 0.0
    if ingresos_actual > 0:
        margen_operativo = float(((ingresos_actual - egresos_actual) / ingresos_actual) * 100)
    
    # ESTUDIANTES ACTIVOS (en proceso) E INACTIVOS (finalizados o abandonaron)
    # Activos: INSCRITO, EN_FORMACION, LISTO_EXAMEN
    total_activos = db.query(Estudiante).filter(
        Estudiante.estado.in_([EstadoEstudiante.INSCRITO, EstadoEstudiante.EN_FORMACION, EstadoEstudiante.LISTO_EXAMEN])
    ).count()
    
    # Inactivos: GRADUADO, DESERTOR, RETIRADO
    total_inactivos = db.query(Estudiante).filter(
        Estudiante.estado.in_([EstadoEstudiante.GRADUADO, EstadoEstudiante.DESERTOR, EstadoEstudiante.RETIRADO])
    ).count()
    
    # NUEVAS MATRÍCULAS DEL MES
    nuevas_matriculas = db.query(Estudiante).filter(
        and_(
            Estudiante.fecha_inscripcion >= fecha_inicio,
            Estudiante.fecha_inscripcion <= fecha_fin
        )
    ).count()
    
    # TASA DE DESERCIÓN (simplificada)
    total_estudiantes = total_activos + total_inactivos
    tasa_desercion = 0.0
    if total_estudiantes > 0:
        tasa_desercion = (total_inactivos / total_estudiantes) * 100
    
    # TICKET PROMEDIO
    ticket_promedio = Decimal('0')
    if total_activos > 0:
        ticket_promedio = ingresos_actual / total_activos
    
    # DÍAS PROMEDIO DE PAGO (simplificado - calcular de pagos)
    pagos_periodo = db.query(Pago).filter(
        and_(
            Pago.fecha_pago >= fecha_inicio,
            Pago.fecha_pago <= fecha_fin
        )
    ).all()
    
    total_dias = 0
    count_pagos = 0
    for pago in pagos_periodo:
        estudiante = pago.estudiante
        if estudiante and estudiante.fecha_inscripcion:
            dias = (pago.fecha_pago - estudiante.fecha_inscripcion).days
            total_dias += dias
            count_pagos += 1
    
    dias_promedio_pago = 0.0
    if count_pagos > 0:
        dias_promedio_pago = total_dias / count_pagos
    
    # TASA DE COBRANZA
    total_valor_cursos = db.query(func.sum(Estudiante.valor_total_curso)).scalar() or Decimal('0')
    total_pagado = total_valor_cursos - saldo_pendiente
    tasa_cobranza = 0.0
    if total_valor_cursos > 0:
        tasa_cobranza = float((total_pagado / total_valor_cursos) * 100)
    
    return KPIDashboard(
        ingresos_totales=KPIMetrica(
            valor_actual=ingresos_actual,
            valor_anterior=ingresos_anterior,
            cambio_porcentual=cambio_ingresos,
            tendencia=tendencia_ingresos
        ),
        egresos_totales=KPIMetrica(
            valor_actual=egresos_actual,
            valor_anterior=egresos_anterior,
            cambio_porcentual=cambio_egresos,
            tendencia=tendencia_egresos
        ),
        saldo_pendiente=saldo_pendiente,
        margen_operativo=margen_operativo,
        total_estudiantes_activos=total_activos,
        total_estudiantes_inactivos=total_inactivos,
        nuevas_matriculas_mes=nuevas_matriculas,
        tasa_desercion=tasa_desercion,
        ticket_promedio=ticket_promedio,
        dias_promedio_pago=dias_promedio_pago,
        tasa_cobranza=tasa_cobranza
    )


def _grafico_evolucion_ingresos(db: Session, fecha_inicio: date, fecha_fin: date) -> GraficoEvolucionIngresos:
    """Gráfico de evolución de ingresos del período seleccionado"""
    
    # Determinar la granularidad según el rango de fechas
    dias_diferencia = (fecha_fin - fecha_inicio).days
    
    if dias_diferencia <= 1:
        # Para un día: agrupar por hora
        formato_agrupacion = 'HH24:00'
        label_agrupacion = 'hora'
    elif dias_diferencia <= 31:
        # Para hasta un mes: agrupar por día
        formato_agrupacion = 'YYYY-MM-DD'
        label_agrupacion = 'dia'
    elif dias_diferencia <= 180:
        # Para hasta 6 meses: agrupar por semana
        formato_agrupacion = 'IYYY-IW'
        label_agrupacion = 'semana'
    else:
        # Para más de 6 meses: agrupar por mes
        formato_agrupacion = 'YYYY-MM'
        label_agrupacion = 'mes'
    
    # Agrupar ingresos desde tabla Caja por fecha de apertura (usando CAST a DATE)
    resultado = db.query(
        func.to_char(Caja.fecha_apertura, formato_agrupacion).label(label_agrupacion),
        func.sum(
            Caja.total_ingresos_efectivo +
            Caja.total_ingresos_transferencia +
            Caja.total_ingresos_tarjeta
        ).label('total')
    ).filter(
        and_(
            cast(Caja.fecha_apertura, Date) >= fecha_inicio,
            cast(Caja.fecha_apertura, Date) <= fecha_fin
        )
    ).group_by(label_agrupacion).order_by(label_agrupacion).all()
    
    datos = [
        DatoPunto(fecha=getattr(r, label_agrupacion), valor=r.total or Decimal('0'))
        for r in resultado
    ]
    
    total_periodo = sum(d.valor for d in datos)
    promedio_por_periodo = total_periodo / len(datos) if datos else Decimal('0')
    
    return GraficoEvolucionIngresos(
        datos=datos,
        total_periodo=total_periodo,
        promedio_mensual=promedio_por_periodo
    )


def _parse_pin_vencimiento(estudiante: Estudiante) -> Optional[datetime]:
    datos_adicionales = estudiante.datos_adicionales or {}
    posibles_keys = [
        "pin_vencimiento",
        "pin_fecha_vencimiento",
        "sicov_pin_vencimiento",
        "sicov_pin_fecha_vencimiento",
        "pin_expiracion",
        "pin_expira",
        "fecha_vencimiento_pin"
    ]
    for key in posibles_keys:
        value = datos_adicionales.get(key)
        fecha = _parse_fecha(value)
        if fecha:
            return fecha
    if estudiante.fecha_inscripcion:
        return estudiante.fecha_inscripcion + timedelta(days=90)
    return None


def _parse_fecha(value) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return None


def _grafico_metodos_pago(db: Session, fecha_inicio: date, fecha_fin: date) -> GraficoMetodosPago:
    """Gráfico de ingresos por método de pago (desde Cajas)"""
    cajas = db.query(Caja).filter(
        and_(
            cast(Caja.fecha_apertura, Date) >= fecha_inicio,
            cast(Caja.fecha_apertura, Date) <= fecha_fin
        )
    ).all()
    
    # Sumar todos los métodos
    totales = {
        'Efectivo': Decimal('0'),
        'Nequi': Decimal('0'),
        'Daviplata': Decimal('0'),
        'Transferencia Bancaria': Decimal('0'),
        'Tarjeta Débito': Decimal('0'),
        'Tarjeta Crédito': Decimal('0'),
        'CrediSmart': Decimal('0'),
        'Sistecredito': Decimal('0')
    }
    
    for caja in cajas:
        totales['Efectivo'] += caja.total_ingresos_efectivo or Decimal('0')
        totales['Nequi'] += caja.total_nequi or Decimal('0')
        totales['Daviplata'] += caja.total_daviplata or Decimal('0')
        totales['Transferencia Bancaria'] += caja.total_transferencia_bancaria or Decimal('0')
        totales['Tarjeta Débito'] += caja.total_tarjeta_debito or Decimal('0')
        totales['Tarjeta Crédito'] += caja.total_tarjeta_credito or Decimal('0')
        totales['CrediSmart'] += caja.total_credismart or Decimal('0')
        totales['Sistecredito'] += caja.total_sistecredito or Decimal('0')
    
    total_general = sum(totales.values())
    
    datos = [
        DatoCategoria(
            nombre=nombre,
            valor=valor,
            porcentaje=float((valor / total_general) * 100) if total_general > 0 else 0.0
        )
        for nombre, valor in totales.items()
        if valor > 0
    ]
    
    # Ordenar por valor descendente
    datos.sort(key=lambda x: x.valor, reverse=True)
    
    metodo_preferido = datos[0].nombre if datos else "N/A"
    
    return GraficoMetodosPago(
        datos=datos,
        metodo_preferido=metodo_preferido
    )


def _grafico_estudiantes_categorias(db: Session) -> GraficoEstudiantesCategorias:
    """Gráfico de estudiantes por categoría de licencia (solo activos)"""
    resultado = db.query(
        Estudiante.categoria,
        func.count(Estudiante.id).label('total')
    ).filter(
        Estudiante.estado.in_([EstadoEstudiante.INSCRITO, EstadoEstudiante.EN_FORMACION, EstadoEstudiante.LISTO_EXAMEN])
    ).group_by(Estudiante.categoria).all()
    
    total = sum(r.total for r in resultado)
    
    colores = {
        'A1': '#ef4444',  # rojo
        'A2': '#f87171',  # rojo claro
        'B1': '#f59e0b',  # naranja
        'B2': '#fbbf24',  # amarillo
        'B3': '#fde047',  # amarillo claro
        'C1': '#10b981',  # verde
        'C2': '#34d399',  # verde claro
        'C3': '#6ee7b7',  # verde muy claro
    }
    
    datos = [
        DatoCategoria(
            nombre=f"Categoría {r.categoria.value}" if r.categoria else "Sin categoría",
            valor=Decimal(str(r.total)),
            porcentaje=float((r.total / total) * 100) if total > 0 else 0.0,
            color=colores.get(r.categoria.value if r.categoria else None, '#6b7280')
        )
        for r in resultado
    ]
    
    return GraficoEstudiantesCategorias(
        datos=datos,
        total=total
    )


def _grafico_egresos_categoria(db: Session, fecha_inicio: date, fecha_fin: date) -> GraficoEgresos:
    """Gráfico de egresos por categoría"""
    resultado = db.query(
        MovimientoCaja.categoria,
        func.sum(MovimientoCaja.monto).label('total')
    ).filter(
        and_(
            cast(MovimientoCaja.fecha, Date) >= fecha_inicio,
            cast(MovimientoCaja.fecha, Date) <= fecha_fin
        )
    ).group_by(MovimientoCaja.categoria).all()
    
    total = sum(r.total for r in resultado if r.total)
    
    datos = [
        DatoCategoria(
            nombre=r.categoria.value if r.categoria else "OTROS",
            valor=r.total or Decimal('0'),
            porcentaje=float((r.total / total) * 100) if total > 0 and r.total else 0.0
        )
        for r in resultado
        if r.total and r.total > 0
    ]
    
    # Ordenar por valor descendente y tomar top 5
    datos.sort(key=lambda x: x.valor, reverse=True)
    datos = datos[:5]
    
    categoria_mayor = datos[0].nombre if datos else "N/A"
    
    return GraficoEgresos(
        datos=datos,
        total=total,
        categoria_mayor=categoria_mayor
    )


def _lista_estudiantes_registrados(db: Session, fecha_inicio: date, fecha_fin: date) -> list:
    """Lista de estudiantes registrados en el período"""
    estudiantes = db.query(Estudiante).filter(
        and_(
            cast(Estudiante.fecha_inscripcion, Date) >= fecha_inicio,
            cast(Estudiante.fecha_inscripcion, Date) <= fecha_fin
        )
    ).order_by(Estudiante.fecha_inscripcion.desc()).all()
    
    lista = []
    for est in estudiantes:
        lista.append(EstudianteRegistrado(
            id=est.id,
            nombre_completo=est.usuario.nombre_completo if est.usuario else "N/A",
            documento=est.usuario.cedula if est.usuario else "N/A",
            categoria=est.categoria.value if est.categoria else None,
            fecha_inscripcion=est.fecha_inscripcion,
            origen_cliente=est.origen_cliente.value if est.origen_cliente else None,
            referido_por=est.referido_por,
            valor_total_curso=est.valor_total_curso,
            estado=est.estado.value
        ))
    
    return lista


def _lista_estudiantes_pagos(db: Session, fecha_inicio: date, fecha_fin: date) -> list:
    """Lista de estudiantes que realizaron pagos en el período"""
    pagos = db.query(Pago).filter(
        and_(
            cast(Pago.fecha_pago, Date) >= fecha_inicio,
            cast(Pago.fecha_pago, Date) <= fecha_fin
        )
    ).order_by(Pago.fecha_pago.desc()).all()
    
    lista = []
    for pago in pagos:
        est = pago.estudiante
        if not est or not est.usuario:
            continue
            
        lista.append(EstudiantePago(
            estudiante_id=est.id,
            nombre_completo=est.usuario.nombre_completo,
            documento=est.usuario.cedula,
            categoria=est.categoria.value if est.categoria else None,
            fecha_pago=pago.fecha_pago,
            concepto=pago.concepto,
            monto=pago.monto,
            metodo_pago=pago.metodo_pago.value if pago.metodo_pago else None,
            es_pago_mixto=bool(pago.es_pago_mixto),
            saldo_pendiente=est.saldo_pendiente
        ))
    
    return lista


def _ranking_referidos(db: Session, fecha_inicio: date, fecha_fin: date) -> list:
    """Ranking de referidos que más estudiantes envían"""
    from app.models.estudiante import OrigenCliente
    
    # Obtener todos los estudiantes referidos en el período (o todos si se requiere vista completa)
    estudiantes_referidos = db.query(Estudiante).filter(
        Estudiante.origen_cliente == OrigenCliente.REFERIDO,
        Estudiante.referido_por.isnot(None)
    ).all()
    
    # Agrupar por referido
    referidos_dict = {}
    for est in estudiantes_referidos:
        nombre_ref = est.referido_por.strip().upper()
        if not nombre_ref:
            continue
            
        if nombre_ref not in referidos_dict:
            referidos_dict[nombre_ref] = {
                'nombre': est.referido_por,
                'telefono': est.telefono_referidor,
                'estudiantes': [],
                'total_ingresos': Decimal('0'),
                'activos': 0,
                'graduados': 0,
                'ultima_fecha': None
            }
        
        ref_data = referidos_dict[nombre_ref]
        ref_data['estudiantes'].append(est)
        ref_data['total_ingresos'] += est.valor_total_curso or Decimal('0')
        
        if est.estado in [EstadoEstudiante.INSCRITO, EstadoEstudiante.EN_FORMACION, EstadoEstudiante.LISTO_EXAMEN]:
            ref_data['activos'] += 1
        elif est.estado == EstadoEstudiante.GRADUADO:
            ref_data['graduados'] += 1
            
        if not ref_data['ultima_fecha'] or est.fecha_inscripcion > ref_data['ultima_fecha']:
            ref_data['ultima_fecha'] = est.fecha_inscripcion
    
    # Convertir a lista y ordenar por total de estudiantes
    ranking = [
        ReferidoRanking(
            referido_nombre=data['nombre'],
            telefono=data['telefono'],
            total_estudiantes_referidos=len(data['estudiantes']),
            total_ingresos_generados=data['total_ingresos'],
            estudiantes_activos=data['activos'],
            estudiantes_graduados=data['graduados'],
            ultima_referencia_fecha=data['ultima_fecha']
        )
        for nombre_ref, data in referidos_dict.items()
    ]
    
    # Ordenar por total de estudiantes referidos (descendente) y tomar top 10
    ranking.sort(key=lambda x: x.total_estudiantes_referidos, reverse=True)
    return ranking[:10]
