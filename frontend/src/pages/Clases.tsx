import { useState } from 'react';
import { Search, Clock, User, Calendar, Download } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { estudiantesAPI, instructoresAPI, vehiculosAPI } from '../services/api';
import '../styles/Clases.css';

interface Estudiante {
  id: number;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  email: string;
  foto_url?: string;
  categoria?: string;
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
      instructor_id?: number;
      instructor_nombre?: string;
      vehiculo_id?: number;
      vehiculo_label?: string;
  }[];
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

  const getErrorMessage = (err: any, fallback: string) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) return fallback;
    return detail || fallback;
  };

  const buscar = async () => {
    if (!cedula.trim()) return;
    try {
      setLoading(true);
      setError('');
      const data = await estudiantesAPI.getByCedula(cedula.trim());
      setEstudiante(data as Estudiante);
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
    const rows: (string | number)[][] = [
      ['Estudiante', estudiante.nombre_completo],
      ['Cédula', estudiante.cedula],
      ['Email', estudiante.email],
      ['Teléfono', estudiante.telefono],
      [],
      ['Fecha', 'Tipo', 'Horas', 'Observaciones']
    ];
    historial.forEach((h) => {
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
            placeholder="Buscar por cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
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
              <p>CC: {estudiante.cedula}</p>
              <p>{estudiante.email} • {estudiante.telefono}</p>
              <p>Estado: {estudiante.estado}</p>
              {estudiante.categoria && <p>Categoría: {estudiante.categoria}</p>}
            </div>
          </div>

          <div className="clases-progreso">
            <div>
              <strong>Teóricas:</strong> {estudiante.horas_teoricas_completadas}/{estudiante.horas_teoricas_requeridas}
              <div className="progreso-bar">
                <div className="progreso-fill" style={{ width: `${estudiante.progreso_teorico}%` }}></div>
                <span className="progreso-text">{estudiante.progreso_teorico.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <strong>Prácticas:</strong> {estudiante.horas_practicas_completadas}/{estudiante.horas_practicas_requeridas}
              <div className="progreso-bar">
                <div className="progreso-fill progreso-practica" style={{ width: `${estudiante.progreso_practico}%` }}></div>
                <span className="progreso-text">{estudiante.progreso_practico.toFixed(0)}%</span>
              </div>
            </div>
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
                {estudiante.clases_historial
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
