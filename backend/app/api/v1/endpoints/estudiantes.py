from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.precios import calcular_precio, obtener_categoria_licencia
from app.models.usuario import Usuario, RolUsuario
from app.models.estudiante import Estudiante, EstadoEstudiante, CategoriaLicencia, OrigenCliente, TipoServicio
from app.models.pago import Pago, MetodoPago, EstadoPago
from app.models.compromiso_pago import CompromisoPago, CuotaPago, FrecuenciaPago, EstadoCuota
from app.schemas.estudiante import EstudianteCreate, EstudianteUpdate, EstudianteResponse, EstudianteListItem, EstudiantesListResponse, DefinirServicioRequest
from app.api.deps import get_current_active_user, get_admin_or_coordinador_or_cajero

router = APIRouter()


@router.post("", response_model=EstudianteResponse, status_code=status.HTTP_201_CREATED)
def create_estudiante(
    estudiante_data: EstudianteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador_or_cajero)
):
    """
    Crear un nuevo estudiante (solo datos personales):
    - Crea usuario
    - Crea estudiante con datos básicos
    - Guarda foto en base64
    - NO asigna servicio (se hace después en "Definir Servicio")
    """
    # Verificar si ya existe un usuario con esa cédula o email
    existing_user = db.query(Usuario).filter(
        or_(Usuario.cedula == estudiante_data.cedula, Usuario.email == estudiante_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con esa cédula o email"
        )
    
    try:
        # 1. Crear Usuario
        nuevo_usuario = Usuario(
            email=estudiante_data.email,
            password_hash=get_password_hash(estudiante_data.password),
            nombre_completo=estudiante_data.nombre_completo,
            cedula=estudiante_data.cedula,
            telefono=estudiante_data.telefono,
            rol=RolUsuario.ESTUDIANTE,
            is_active=True,
            is_verified=False
        )
        db.add(nuevo_usuario)
        db.flush()
        
        # 2. Generar número de matrícula (correlativo)
        ultimo_estudiante = db.query(Estudiante).order_by(Estudiante.id.desc()).first()
        nuevo_numero = 1 if not ultimo_estudiante else ultimo_estudiante.id + 1
        matricula_numero = f"CEA-{datetime.now().year}-{nuevo_numero:05d}"
        
        # 3. Crear Estudiante (solo datos personales)
        nuevo_estudiante = Estudiante(
            usuario_id=nuevo_usuario.id,
            matricula_numero=matricula_numero,
            fecha_nacimiento=estudiante_data.fecha_nacimiento,
            direccion=estudiante_data.direccion,
            ciudad=estudiante_data.ciudad,
            barrio=estudiante_data.barrio,
            tipo_sangre=estudiante_data.tipo_sangre,
            eps=estudiante_data.eps,
            ocupacion=estudiante_data.ocupacion,
            estado_civil=estudiante_data.estado_civil,
            nivel_educativo=estudiante_data.nivel_educativo,
            estrato=estudiante_data.estrato,
            nivel_sisben=estudiante_data.nivel_sisben,
            necesidades_especiales=estudiante_data.necesidades_especiales,
            contacto_emergencia_nombre=estudiante_data.contacto_emergencia_nombre,
            contacto_emergencia_telefono=estudiante_data.contacto_emergencia_telefono,
            foto_url=estudiante_data.foto_base64,  # Guardar base64 temporalmente
            estado=EstadoEstudiante.PROSPECTO  # Prospecto hasta que se defina servicio
        )
        db.add(nuevo_estudiante)
        db.flush()
        
        db.commit()
        db.refresh(nuevo_estudiante)
        
        return _build_estudiante_response(nuevo_estudiante, db)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear estudiante: {str(e)}"
        )


@router.get("", response_model=EstudiantesListResponse)
def list_estudiantes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    categoria: Optional[CategoriaLicencia] = None,
    estado: Optional[EstadoEstudiante] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar estudiantes con filtros y búsqueda
    """
    query = db.query(Estudiante).join(Usuario)
    
    # Filtro de búsqueda (nombre, cédula, email)
    if search:
        query = query.filter(
            or_(
                Usuario.nombre_completo.ilike(f"%{search}%"),
                Usuario.cedula.ilike(f"%{search}%"),
                Usuario.email.ilike(f"%{search}%")
            )
        )
    
    # Filtro por categoría
    if categoria:
        query = query.filter(Estudiante.categoria == categoria)
    
    # Filtro por estado
    if estado:
        query = query.filter(Estudiante.estado == estado)
    
    # Ordenar por fecha de inscripción descendente (más reciente primero)
    query = query.order_by(Estudiante.fecha_inscripcion.desc())
    
    # Obtener total de registros (antes de aplicar paginación)
    total = query.count()
    
    estudiantes = query.offset(skip).limit(limit).all()
    
    # Construir respuesta con datos del usuario
    items = []
    for est in estudiantes:
        items.append(EstudianteListItem(
            id=est.id,
            usuario_id=est.usuario_id,
            nombre_completo=est.usuario.nombre_completo,
            cedula=est.usuario.cedula,
            email=est.usuario.email,
            telefono=est.usuario.telefono,
            foto_url=est.foto_url,
            matricula_numero=est.matricula_numero,
            categoria=est.categoria,
            estado=est.estado,
            fecha_inscripcion=est.fecha_inscripcion,
            progreso_teorico=est.progreso_teorico,
            progreso_practico=est.progreso_practico,
            saldo_pendiente=est.saldo_pendiente
        ))
    
    return EstudiantesListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{estudiante_id}", response_model=EstudianteResponse)
def get_estudiante(
    estudiante_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener detalles de un estudiante por ID
    """
    estudiante = db.query(Estudiante).filter(Estudiante.id == estudiante_id).first()
    
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    return _build_estudiante_response(estudiante, db)


@router.put("/{estudiante_id}", response_model=EstudianteResponse)
def update_estudiante(
    estudiante_id: int,
    estudiante_data: EstudianteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador_or_cajero)
):
    """
    Actualizar información de un estudiante
    """
    estudiante = db.query(Estudiante).filter(Estudiante.id == estudiante_id).first()
    
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = estudiante_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(estudiante, field, value)
    
    db.commit()
    db.refresh(estudiante)
    
    return _build_estudiante_response(estudiante, db)


@router.delete("/{estudiante_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_estudiante(
    estudiante_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador_or_cajero)
):
    """
    Eliminar un estudiante (soft delete - marca como inactivo)
    """
    estudiante = db.query(Estudiante).filter(Estudiante.id == estudiante_id).first()
    
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    # Soft delete: marcar usuario como inactivo
    estudiante.usuario.is_active = False
    estudiante.estado = EstadoEstudiante.RETIRADO
    
    db.commit()
    
    return None


@router.put("/{estudiante_id}/definir-servicio", response_model=EstudianteResponse)
def definir_servicio(
    estudiante_id: int,
    servicio_data: DefinirServicioRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_or_coordinador_or_cajero)
):
    """
    Definir el servicio para un estudiante PROSPECTO:
    - Asigna tipo de servicio y categoría
    - Define origen del cliente (directo o referido)
    - Calcula o asigna el valor total del curso
    - Asigna horas teóricas y prácticas requeridas
    - Cambia estado de PROSPECTO a ACTIVO
    """
    estudiante = db.query(Estudiante).filter(Estudiante.id == estudiante_id).first()
    
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    # Validar que sea un prospecto
    if estudiante.estado != EstadoEstudiante.PROSPECTO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede definir servicio a estudiantes en estado PROSPECTO"
        )
    
    try:
        # 1. Asignar tipo de servicio
        estudiante.tipo_servicio = servicio_data.tipo_servicio
        
        # 2. Determinar la categoría basada en el tipo de servicio
        estudiante.categoria = obtener_categoria_licencia(servicio_data.tipo_servicio)
        
        # 3. Asignar origen del cliente
        estudiante.origen_cliente = servicio_data.origen_cliente
        
        # 3.1 Si es referido, guardar datos del referidor
        if servicio_data.origen_cliente == OrigenCliente.REFERIDO:
            estudiante.referido_por = servicio_data.referido_por
            estudiante.telefono_referidor = servicio_data.telefono_referidor
        
        # 4. Calcular o asignar valor total
        precio_minimo = calcular_precio(servicio_data.tipo_servicio, db=db)
        if servicio_data.origen_cliente == OrigenCliente.DIRECTO:
            # Cliente directo: usar precio fijo del sistema
            estudiante.valor_total_curso = precio_minimo
        else:
            # Cliente referido: valor manual, pero no menor al mínimo
            if servicio_data.valor_total_curso is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El valor total es obligatorio para clientes referidos"
                )
            if servicio_data.valor_total_curso < precio_minimo:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El valor total no puede ser menor a {precio_minimo}"
                )
            estudiante.valor_total_curso = servicio_data.valor_total_curso
        
        # 5. Asignar horas teóricas y prácticas según la categoría
        horas_map = {
            CategoriaLicencia.A2: {"teoricas": 20, "practicas": 16},
            CategoriaLicencia.B1: {"teoricas": 40, "practicas": 30},
            CategoriaLicencia.C1: {"teoricas": 40, "practicas": 30},
        }
        
        if estudiante.categoria in horas_map:
            estudiante.horas_teoricas_requeridas = horas_map[estudiante.categoria]["teoricas"]
            estudiante.horas_practicas_requeridas = horas_map[estudiante.categoria]["practicas"]
        else:
            # Para certificados y combos, usar valores por defecto
            estudiante.horas_teoricas_requeridas = 0
            estudiante.horas_practicas_requeridas = 0
        
        # 6. Inicializar saldo pendiente (igual al valor total)
        estudiante.saldo_pendiente = estudiante.valor_total_curso
        
        # 7. Guardar observaciones si las hay
        if servicio_data.observaciones:
            if not estudiante.datos_adicionales:
                estudiante.datos_adicionales = {}
            estudiante.datos_adicionales["observaciones"] = servicio_data.observaciones
        
        # 8. Cambiar estado a EN_FORMACION
        estudiante.estado = EstadoEstudiante.EN_FORMACION
        
        db.commit()
        db.refresh(estudiante)
        
        return _build_estudiante_response(estudiante, db)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al definir servicio: {str(e)}"
        )


def _build_estudiante_response(estudiante: Estudiante, db: Session = None) -> EstudianteResponse:
    """Helper para construir la respuesta con datos del usuario"""
    # Obtener historial de pagos si hay DB session
    historial_pagos = []
    if db:
        from app.models.pago import Pago, EstadoPago
        from app.api.v1.endpoints.caja import _build_pago_response
        from sqlalchemy import and_
        
        pagos = db.query(Pago).filter(
            and_(
                Pago.estudiante_id == estudiante.id,
                Pago.estado == EstadoPago.COMPLETADO
            )
        ).order_by(Pago.fecha_pago.desc()).all()
        
        historial_pagos = [_build_pago_response(p) for p in pagos]
    
    return EstudianteResponse(
        id=estudiante.id,
        usuario_id=estudiante.usuario_id,
        matricula_numero=estudiante.matricula_numero,
        fecha_nacimiento=estudiante.fecha_nacimiento,
        direccion=estudiante.direccion,
        ciudad=estudiante.ciudad,
        barrio=estudiante.barrio,
        tipo_sangre=estudiante.tipo_sangre,
        eps=estudiante.eps,
        ocupacion=estudiante.ocupacion,
        estado_civil=estudiante.estado_civil,
        nivel_educativo=estudiante.nivel_educativo,
        estrato=estudiante.estrato,
        nivel_sisben=estudiante.nivel_sisben,
        necesidades_especiales=estudiante.necesidades_especiales,
        contacto_emergencia_nombre=estudiante.contacto_emergencia_nombre,
        contacto_emergencia_telefono=estudiante.contacto_emergencia_telefono,
        foto_url=estudiante.foto_url,
        categoria=estudiante.categoria,
        origen_cliente=estudiante.origen_cliente,
        referido_por=estudiante.referido_por,
        telefono_referidor=estudiante.telefono_referidor,
        estado=estudiante.estado,
        fecha_inscripcion=estudiante.fecha_inscripcion,
        fecha_graduacion=estudiante.fecha_graduacion,
        no_certificado=estudiante.no_certificado,
        horas_teoricas_completadas=estudiante.horas_teoricas_completadas or 0,
        horas_practicas_completadas=estudiante.horas_practicas_completadas or 0,
        horas_teoricas_requeridas=estudiante.horas_teoricas_requeridas or 0,
        horas_practicas_requeridas=estudiante.horas_practicas_requeridas or 0,
        valor_total_curso=estudiante.valor_total_curso,
        saldo_pendiente=estudiante.saldo_pendiente,
        created_at=estudiante.created_at,
        updated_at=estudiante.updated_at,
        nombre_completo=estudiante.usuario.nombre_completo,
        cedula=estudiante.usuario.cedula,
        email=estudiante.usuario.email,
        telefono=estudiante.usuario.telefono,
        progreso_teorico=estudiante.progreso_teorico,
        progreso_practico=estudiante.progreso_practico,
        esta_listo_para_examen=estudiante.esta_listo_para_examen,
        historial_pagos=historial_pagos
    )
