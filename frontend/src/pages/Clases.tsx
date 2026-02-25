import { useState } from 'react';
import { Search, Clock, User, Calendar, Download } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { estudiantesAPI, instructoresAPI, vehiculosAPI } from '../services/api';
import '../styles/Clases.css';

interface Estudiante {
  id: number;
  nombre_completo: string;
  cedula: string;
  tipo_documento?: string;
  telefono: string;
  email: string;
  foto_url?: string;
  categoria?: string;
  tipo_servicio?: string;
  estado: string;
  horas_teoricas_completadas: number;
  horas_teoricas_requeridas: number;
  horas_practicas_completadas: number;
  horas_practicas_requeridas: number;
  progreso_teorico: number;
  progreso_practico: number;
  clases_historial?: {
    fecha: string;
    tipo: string;
    horas: number;
    observaciones?: string;
    usuario_id?: number;
    servicio_id?: number | null;
    instructor_id?: number;
    instructor_nombre?: string;
    vehiculo_id?: number;
    vehiculo_label?: string;
  }[];
  servicios?: {
    id: number;
    tipo_servicio?: string;
    estado?: string;
    horas_teoricas_completadas?: number;
    horas_practicas_completadas?: number;
    horas_teoricas_requeridas?: number;
    horas_practicas_requeridas?: number;
  }[];
  servicio_activo_id?: number | null;
}

export const Clases = () => {
  const [cedula, setCedula] = useState('');
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [tipo, setTipo] = useState('TEORICA');
  const [horas, setHoras] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [instructores, setInstructores] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<number | 'TODOS'>('TODOS');

  const sinPractica = new Set([
    'CERTIFICADO_MOTO',
    'CERTIFICADO_B1',
    'CERTIFICADO_C1',
    'CERTIFICADO_B1_SIN_PRACTICA',
    'CERTIFICADO_C1_SIN_PRACTICA',
    'CERTIFICADO_A2_B1_SIN_PRACTICA',
    'CERTIFICADO_A2_C1_SIN_PRACTICA'
  ]);

  const getServicioSeleccionado = () => {
    if (!estudiante) return null;
    const servicios = estudiante.servicios || [];
    const id = servicioSeleccionado === 'TODOS'
      ? estudiante.servicio_activo_id
      : servicioSeleccionado;
    if (!id) return null;
    return servicios.find((s) => s.id === id) || null;
  };

  const getTipoServicioSeleccionado = () => {
    const servicio = getServicioSeleccionado();
    return servicio?.tipo_servicio || estudiante?.tipo_servicio || null;
  };

  const resolverValor = (valorServicio?: number, fallback?: number) => {
    if (valorServicio === undefined || valorServicio === null) return fallback || 0;
    if (valorServicio === 0 && (fallback || 0) > 0) return fallback || 0;
    return valorServicio;
  };

  const getProgreso = (completadas?: number, requeridas?: number) => {
    if (!requeridas) return 0;
    return Math.min(100, (Number(completadas || 0) / Number(requeridas)) * 100);
  };

  const formatDocumentoBusqueda = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
  };
  const getTipoDocumentoLabel = (tipo?: string) => {
    switch (tipo) {
      case 'TARJETA_IDENTIDAD':
        return 'TI';
      case 'PASAPORTE':
        return 'PAS';
      case 'CEDULA_EXTRANJERIA':
        return 'CE';
      default:
        return 'CC';
    }
  };

  const getErrorMessage = (err: any, fallback: string) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) return fallback;
    return detail || fallback;
  };

  const buscar = async () => {
    const documento = formatDocumentoBusqueda(cedula.trim());
    if (!documento) return;
    try {
      setLoading(true);
      setError('');
      const data = await estudiantesAPI.getByCedula(documento);
      setEstudiante(data as Estudiante);
      setServicioSeleccionado((data as Estudiante).servicio_activo_id ?? 'TODOS');
      await cargarListas();
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se encontró el estudiante'));
      setEstudiante(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarListas = async () => {
    try {
      const [inst, veh] = await Promise.all([
        instructoresAPI.getAll({ estado: 'ACTIVO', limit: 100 }),
        vehiculosAPI.getAll({ activo: true, limit: 100 })
      ]);
      setInstructores(inst.items || []);
      setVehiculos(veh.items || []);
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron cargar instructores o vehículos'));
    }
  };

  const acreditar = async () => {
    if (!estudiante) return;
    const tipoServicio = getTipoServicioSeleccionado();
    if (tipoServicio && sinPractica.has(tipoServicio)) {
      setError('Este servicio no requiere horas de clase');
      return;
    }
    if (!horas || parseInt(horas) <= 0) {
      setError('Las horas deben ser mayores a 0');
      return;
    }
    if (!instructorId) {
      setError('Selecciona instructor');
      return;
    }
    if (tipo === 'PRACTICA' && !vehiculoId) {
      setError('Selecciona vehículo');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await estudiantesAPI.acreditarHoras(estudiante.id, {
        tipo,
        horas: parseInt(horas),
        observaciones: observaciones.trim() || null,
        instructor_id: Number(instructorId),
        vehiculo_id: tipo === 'PRACTICA' ? Number(vehiculoId) : null
      });
      const actualizado = await estudiantesAPI.getByCedula(estudiante.cedula);
      setEstudiante(actualizado as Estudiante);
      setServicioSeleccionado((actualizado as Estudiante).servicio_activo_id ?? 'TODOS');
      setObservaciones('');
      setHoras('1');
      setInstructorId('');
      setVehiculoId('');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al acreditar horas'));
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const escape = (value: string | number) => {
      const str = String(value ?? '');
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportClasesCSV = () => {
    if (!estudiante) return;
    const historial = estudiante.clases_historial || [];
    const filtrado = servicioSeleccionado === 'TODOS'
      ? historial
      : historial.filter((h) => h.servicio_id === servicioSeleccionado);
    const rows: (string | number)[][] = [
      ['Estudiante', estudiante.nombre_completo],
      ['Documento', estudiante.cedula],
      ['Email', estudiante.email],
      ['Teléfono', estudiante.telefono],
      ['Servicio', servicioSeleccionado === 'TODOS' ? 'TODOS' : `Servicio ${servicioSeleccionado}`],
      [],
      ['Fecha', 'Tipo', 'Horas', 'Observaciones']
    ];
    filtrado.forEach((h) => {
      rows.push([
        new Date(h.fecha).toLocaleString('es-CO'),
        h.tipo,
        h.horas,
        h.observaciones || ''
      ]);
    });
    downloadCSV(`clases_${estudiante.cedula}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="clases-container">
      <PageHeader
        title="Clases"
        subtitle="Programación y acreditación de horas"
        icon={<Calendar size={20} />}
        actions={
          <button
            className="btn-nuevo"
            onClick={exportClasesCSV}
            disabled={!estudiante || !(estudiante.clases_historial || []).length}
          >
            <Download size={16} /> Exportar CSV
          </button>
        }
      />

      <div className="search-section clases-busqueda">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por documento"
            value={cedula}
            onChange={(e) => setCedula(formatDocumentoBusqueda(e.target.value))}
            className="search-input"
          />
        </div>
        <button className="btn-nuevo btn-search" onClick={buscar} disabled={loading}>
          <Search size={16} /> Buscar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {estudiante && (
        <div className="clases-card">
          <div className="clases-header">
            <div className="clases-foto">
              {estudiante.foto_url ? (
                <img src={estudiante.foto_url} alt={estudiante.nombre_completo} />
              ) : (
                <div className="clases-foto-placeholder"><User size={28} /></div>
              )}
            </div>
            <div className="clases-info">
              <h3>{estudiante.nombre_completo}</h3>
              <p>{getTipoDocumentoLabel(estudiante.tipo_documento)}: {estudiante.cedula}</p>
              <p>{estudiante.email} • {estudiante.telefono}</p>
              <p>Estado: {estudiante.estado}</p>
              {estudiante.categoria && <p>Categoría: {estudiante.categoria}</p>}
            </div>
          </div>

          <div className="clases-progreso">
            {(() => {
              const servicio = getServicioSeleccionado();
              const teoricasCompletadas = resolverValor(
                servicio?.horas_teoricas_completadas,
                estudiante.horas_teoricas_completadas
              );
              const teoricasRequeridas = resolverValor(
                servicio?.horas_teoricas_requeridas,
                estudiante.horas_teoricas_requeridas
              );
              const practicasCompletadas = resolverValor(
                servicio?.horas_practicas_completadas,
                estudiante.horas_practicas_completadas
              );
              const practicasRequeridas = resolverValor(
                servicio?.horas_practicas_requeridas,
                estudiante.horas_practicas_requeridas
              );
              const progresoTeorico = getProgreso(teoricasCompletadas, teoricasRequeridas);
              const progresoPractico = getProgreso(practicasCompletadas, practicasRequeridas);
              return (
                <>
                  <div>
                    <strong>Teóricas:</strong> {teoricasCompletadas}/{teoricasRequeridas}
                    <div className="progreso-bar">
                      <div className="progreso-fill" style={{ width: `${progresoTeorico}%` }}></div>
                      <span className="progreso-text">{progresoTeorico.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <strong>Prácticas:</strong> {practicasCompletadas}/{practicasRequeridas}
                    <div className="progreso-bar">
                      <div className="progreso-fill progreso-practica" style={{ width: `${progresoPractico}%` }}></div>
                      <span className="progreso-text">{progresoPractico.toFixed(0)}%</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="form-group">
            <label>Servicio</label>
            <select
              value={servicioSeleccionado}
              onChange={(e) => {
                const value = e.target.value;
                setServicioSeleccionado(value === 'TODOS' ? 'TODOS' : Number(value));
              }}
            >
              <option value="TODOS">Todos los servicios</option>
              {estudiante.servicios && estudiante.servicios.length > 0 && estudiante.servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  Servicio {s.id} {s.estado ? `(${s.estado})` : ''}
                </option>
              ))}
              {(!estudiante.servicios || estudiante.servicios.length === 0) && estudiante.servicio_activo_id && (
                <option value={estudiante.servicio_activo_id}>Servicio {estudiante.servicio_activo_id}</option>
              )}
            </select>
          </div>

          <div className="clases-form">
            <div className="form-group">
              <label>Tipo de clase</label>
              <select
                value={tipo}
                onChange={(e) => {
                  const next = e.target.value;
                  setTipo(next);
                  if (next !== 'PRACTICA') setVehiculoId('');
                }}
              >
                <option value="TEORICA">Teórica</option>
                <option value="PRACTICA">Práctica</option>
              </select>
            </div>
            <div className="form-group">
              <label>Instructor</label>
              <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                <option value="">Selecciona instructor</option>
                {instructores.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
            {tipo === 'PRACTICA' && (
              <div className="form-group">
                <label>Vehículo</label>
                <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                  <option value="">Selecciona vehículo</option>
                  {vehiculos.map((veh) => (
                    <option key={veh.id} value={veh.id}>
                      {veh.placa} - {veh.marca} {veh.modelo}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Horas a acreditar</label>
              <input type="number" min="1" value={horas} onChange={(e) => setHoras(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={acreditar} disabled={loading}>
              <Clock size={16} /> Acreditar horas
            </button>
          </div>

          <div className="clases-historial">
            <h4>Historial de clases acreditadas</h4>
            {estudiante.clases_historial && estudiante.clases_historial.length > 0 ? (
              <div className="historial-list">
                {(servicioSeleccionado === 'TODOS'
                  ? estudiante.clases_historial
                  : estudiante.clases_historial.filter((h) => h.servicio_id === servicioSeleccionado))
                  .slice()
                  .reverse()
                  .map((h, idx) => (
                    <div key={`${h.fecha}-${idx}`} className="historial-item">
                      <div>
                        <strong>{h.tipo}</strong> • {h.horas}h
                      </div>
                      <div className="historial-fecha">
                        {new Date(h.fecha).toLocaleString('es-CO')}
                      </div>
                      <div className="historial-obs">
                        {h.instructor_nombre && <span>Instructor: {h.instructor_nombre}</span>}
                        {h.vehiculo_label && <span> • Vehículo: {h.vehiculo_label}</span>}
                      </div>
                      {h.observaciones && <div className="historial-obs">Obs: {h.observaciones}</div>}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="historial-empty">Sin registros aún.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
