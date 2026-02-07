import { useState } from 'react';
import { Search, Clock, User } from 'lucide-react';
import { estudiantesAPI } from '../services/api';
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
  }[];
}

export const Clases = () => {
  const [cedula, setCedula] = useState('');
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [tipo, setTipo] = useState('TEORICA');
  const [horas, setHoras] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscar = async () => {
    if (!cedula.trim()) return;
    try {
      setLoading(true);
      setError('');
      const data = await estudiantesAPI.getByCedula(cedula.trim());
      setEstudiante(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se encontró el estudiante');
      setEstudiante(null);
    } finally {
      setLoading(false);
    }
  };

  const acreditar = async () => {
    if (!estudiante) return;
    if (!horas || parseInt(horas) <= 0) {
      setError('Las horas deben ser mayores a 0');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await estudiantesAPI.acreditarHoras(estudiante.id, {
        tipo,
        horas: parseInt(horas),
        observaciones: observaciones.trim() || null
      });
      const actualizado = await estudiantesAPI.getByCedula(estudiante.cedula);
      setEstudiante(actualizado as any);
      setObservaciones('');
      setHoras('1');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al acreditar horas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clases-container">
      <h1>Clases</h1>

      <div className="clases-busqueda">
        <input
          type="text"
          placeholder="Buscar por cédula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
        />
        <button className="btn-primary" onClick={buscar} disabled={loading}>
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
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="TEORICA">Teórica</option>
                <option value="PRACTICA">Práctica</option>
              </select>
            </div>
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
