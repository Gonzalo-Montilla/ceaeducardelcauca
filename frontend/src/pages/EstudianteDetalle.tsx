import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { estudiantesAPI } from '../services/api';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  DollarSign,
  Edit,
  Download,
  BookOpen,
  Car as CarIcon,
  AlertCircle
} from 'lucide-react';
import '../styles/EstudianteDetalle.css';

interface DetallePagoItem {
  id: number;
  metodo_pago: string;
  monto: number;
  referencia?: string;
}

interface PagoHistorial {
  id: number;
  monto: number;
  metodo_pago?: string;
  fecha_pago: string;
  concepto: string;
  es_pago_mixto: boolean;
  detalles_pago: DetallePagoItem[];
}

interface Estudiante {
  id: number;
  usuario_id: number;
  nombre_completo: string;
  cedula: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  direccion?: string;
  ciudad?: string;
  barrio?: string;
  tipo_sangre?: string;
  eps?: string;
  ocupacion?: string;
  estado_civil?: string;
  nivel_educativo?: string;
  estrato?: number;
  nivel_sisben?: string;
  necesidades_especiales?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  foto_url?: string;
  matricula_numero?: string;
  categoria?: string;
  tipo_servicio?: string;
  origen_cliente?: string;
  referido_por?: string;
  telefono_referidor?: string;
  estado: string;
  fecha_inscripcion: string;
  valor_total_curso?: number;
  saldo_pendiente?: number;
  progreso_teorico: number;
  progreso_practico: number;
  horas_teoricas_completadas: number;
  horas_teoricas_requeridas: number;
  horas_practicas_completadas: number;
  horas_practicas_requeridas: number;
  historial_pagos?: PagoHistorial[];
}

export const EstudianteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarEstudiante();
  }, [id]);

  const cargarEstudiante = async () => {
    try {
      setIsLoading(true);
      const data = await estudiantesAPI.getById(Number(id));
      setEstudiante(data);
    } catch (err) {
      console.error('Error al cargar estudiante:', err);
      setError('Error al cargar los datos del estudiante');
    } finally {
      setIsLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearMoneda = (valor?: number) => {
    if (!valor) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const getEstadoBadgeClass = (estado: string) => {
    const estados: { [key: string]: string } = {
      'PROSPECTO': 'badge-warning',
      'INSCRITO': 'badge-info',
      'EN_FORMACION': 'badge-primary',
      'LISTO_EXAMEN': 'badge-success',
      'GRADUADO': 'badge-success',
      'DESERTOR': 'badge-danger',
      'RETIRADO': 'badge-danger'
    };
    return estados[estado] || 'badge-secondary';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Cargando información del estudiante...</p>
      </div>
    );
  }

  if (error || !estudiante) {
    return (
      <div className="error-container">
        <AlertCircle size={48} color="#ef4444" />
        <p>{error || 'Estudiante no encontrado'}</p>
        <button className="btn-primary" onClick={() => navigate('/estudiantes')}>
          Volver a Estudiantes
        </button>
      </div>
    );
  }

  return (
    <div className="estudiante-detalle-container">
      {/* Header */}
      <div className="detalle-header">
        <button className="btn-back" onClick={() => navigate('/estudiantes')}>
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="header-actions">
          <button className="btn-action">
            <Edit size={18} /> Editar
          </button>
          <button className="btn-action">
            <Download size={18} /> Descargar Contrato
          </button>
        </div>
      </div>

      {/* Información Principal */}
      <div className="info-principal">
        <div className="foto-grande">
          {estudiante.foto_url ? (
            <img src={estudiante.foto_url} alt={estudiante.nombre_completo} />
          ) : (
            <div className="foto-placeholder-grande">
              <User size={80} />
            </div>
          )}
        </div>
        
        <div className="info-basica">
          <h1>{estudiante.nombre_completo}</h1>
          <p className="cedula">CC: {estudiante.cedula}</p>
          {estudiante.matricula_numero && (
            <p className="matricula">Matrícula: {estudiante.matricula_numero}</p>
          )}
          
          {/* Badge de origen del cliente */}
          {estudiante.origen_cliente && (
            <div className="origen-badge-container">
              {estudiante.origen_cliente === 'DIRECTO' ? (
                <span className="badge badge-directo">
                  Cliente Directo
                </span>
              ) : (
                <span className="badge badge-referido">
                  Referido por: {estudiante.referido_por || 'N/A'}
                  {estudiante.telefono_referidor && (
                    <span className="telefono-ref"> • {estudiante.telefono_referidor}</span>
                  )}
                </span>
              )}
            </div>
          )}
          
          <span className={`badge ${getEstadoBadgeClass(estudiante.estado)}`}>
            {estudiante.estado.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="detalle-grid">
        {/* Datos Personales */}
        <div className="detalle-card">
          <h2><User size={20} /> Datos Personales</h2>
          <div className="info-rows">
            <div className="info-row">
              <span className="label">Fecha de Nacimiento:</span>
              <span className="value">{formatearFecha(estudiante.fecha_nacimiento)}</span>
            </div>
            <div className="info-row">
              <span className="label"><Mail size={16} /> Email:</span>
              <span className="value">{estudiante.email}</span>
            </div>
            <div className="info-row">
              <span className="label"><Phone size={16} /> Teléfono:</span>
              <span className="value">{estudiante.telefono}</span>
            </div>
            {estudiante.direccion && (
              <div className="info-row">
                <span className="label"><MapPin size={16} /> Dirección:</span>
                <span className="value">{estudiante.direccion}</span>
              </div>
            )}
            {estudiante.ciudad && (
              <div className="info-row">
                <span className="label">Ciudad:</span>
                <span className="value">{estudiante.ciudad}</span>
              </div>
            )}
            {estudiante.barrio && (
              <div className="info-row">
                <span className="label">Barrio:</span>
                <span className="value">{estudiante.barrio}</span>
              </div>
            )}
            {estudiante.tipo_sangre && (
              <div className="info-row">
                <span className="label">Tipo de Sangre:</span>
                <span className="value">{estudiante.tipo_sangre}</span>
              </div>
            )}
            {estudiante.eps && (
              <div className="info-row">
                <span className="label">EPS:</span>
                <span className="value">{estudiante.eps}</span>
              </div>
            )}
          </div>
        </div>

        {/* Información Académica */}
        {estudiante.categoria && (
          <div className="detalle-card">
            <h2><FileText size={20} /> Información Académica</h2>
            <div className="info-rows">
              <div className="info-row">
                <span className="label">Categoría de Licencia:</span>
                <span className="value badge-categoria">{estudiante.categoria}</span>
              </div>
              <div className="info-row">
                <span className="label">Fecha de Inscripción:</span>
                <span className="value">{formatearFecha(estudiante.fecha_inscripcion)}</span>
              </div>
              <div className="info-row">
                <span className="label">Horas Teóricas:</span>
                <span className="value">{estudiante.horas_teoricas_completadas} / {estudiante.horas_teoricas_requeridas}</span>
              </div>
              <div className="progreso-bar">
                <div className="progreso-fill" style={{ width: `${estudiante.progreso_teorico}%` }}></div>
                <span className="progreso-text">{estudiante.progreso_teorico.toFixed(0)}%</span>
              </div>
              <div className="info-row">
                <span className="label">Horas Prácticas:</span>
                <span className="value">{estudiante.horas_practicas_completadas} / {estudiante.horas_practicas_requeridas}</span>
              </div>
              <div className="progreso-bar">
                <div className="progreso-fill progreso-practica" style={{ width: `${estudiante.progreso_practico}%` }}></div>
                <span className="progreso-text">{estudiante.progreso_practico.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Información Financiera */}
        {estudiante.valor_total_curso && (
          <div className="detalle-card">
            <h2><DollarSign size={20} /> Información Financiera</h2>
            <div className="info-rows">
              <div className="info-row">
                <span className="label">Valor Total del Curso:</span>
                <span className="value">{formatearMoneda(estudiante.valor_total_curso)}</span>
              </div>
              <div className="info-row">
                <span className="label">Saldo Pendiente:</span>
                <span className="value saldo-pendiente">{formatearMoneda(estudiante.saldo_pendiente)}</span>
              </div>
              <div className="info-row">
                <span className="label">Pagado:</span>
                <span className="value">{formatearMoneda((estudiante.valor_total_curso || 0) - (estudiante.saldo_pendiente || 0))}</span>
              </div>
            </div>
            
            {/* Historial de Pagos */}
            {estudiante.historial_pagos && estudiante.historial_pagos.length > 0 && (
              <div className="historial-pagos-section">
                <h3 className="historial-title">Historial de Pagos</h3>
                <div className="historial-lista">
                  {estudiante.historial_pagos.map((pago) => (
                    <div key={pago.id} className="pago-item">
                      <div className="pago-header">
                        <span className="pago-fecha">
                          <Calendar size={14} />
                          {new Date(pago.fecha_pago).toLocaleDateString('es-CO', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className="pago-monto">{formatearMoneda(pago.monto)}</span>
                      </div>
                      
                      {!pago.es_pago_mixto ? (
                        // Pago Simple
                        <div className="pago-metodo-simple">
                          <span className="badge-metodo">{pago.metodo_pago}</span>
                        </div>
                      ) : (
                        // Pago Mixto
                        <div className="pago-mixto-desglose">
                          <span className="mixto-label">Pago Mixto:</span>
                          {pago.detalles_pago.map((detalle, idx) => (
                            <div key={idx} className="detalle-item">
                              <span className="detalle-metodo">{detalle.metodo_pago}</span>
                              <span className="detalle-monto">{formatearMoneda(detalle.monto)}</span>
                              {detalle.referencia && (
                                <span className="detalle-ref">Ref: {detalle.referencia}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button className="btn-pago">
              <DollarSign size={18} /> Registrar Pago
            </button>
          </div>
        )}

        {/* Contacto de Emergencia */}
        {estudiante.contacto_emergencia_nombre && (
          <div className="detalle-card">
            <h2><AlertCircle size={20} /> Contacto de Emergencia</h2>
            <div className="info-rows">
              <div className="info-row">
                <span className="label">Nombre:</span>
                <span className="value">{estudiante.contacto_emergencia_nombre}</span>
              </div>
              <div className="info-row">
                <span className="label">Teléfono:</span>
                <span className="value">{estudiante.contacto_emergencia_telefono}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
