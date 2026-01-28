import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estudiantesAPI } from '../services/api';
import { Search, UserPlus, Eye, Settings } from 'lucide-react';
import { DefinirServicioModal } from '../components/DefinirServicioModal';
import '../styles/Estudiantes.css';

interface Estudiante {
  id: number;
  usuario_id: number;
  nombre_completo: string;
  cedula: string;
  email: string;
  telefono: string;
  foto_url?: string;
  matricula_numero?: string;
  categoria?: string;
  estado: string;
  fecha_inscripcion: string;
  saldo_pendiente?: number;
}

export const Estudiantes = () => {
  const navigate = useNavigate();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState<Estudiante[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  useEffect(() => {
    filtrarEstudiantes();
  }, [busqueda, estudiantes]);

  const cargarEstudiantes = async () => {
    try {
      setIsLoading(true);
      const data = await estudiantesAPI.getAll();
      setEstudiantes(data);
      setEstudiantesFiltrados(data);
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      setError('Error al cargar la lista de estudiantes');
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarEstudiantes = () => {
    if (!busqueda.trim()) {
      setEstudiantesFiltrados(estudiantes);
      return;
    }

    const busquedaLower = busqueda.toLowerCase();
    const filtrados = estudiantes.filter(est => 
      est.cedula.includes(busqueda) ||
      est.nombre_completo.toLowerCase().includes(busquedaLower) ||
      est.email.toLowerCase().includes(busquedaLower) ||
      est.matricula_numero?.toLowerCase().includes(busquedaLower)
    );
    setEstudiantesFiltrados(filtrados);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
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

  const handleDefinirServicio = (estudiante: Estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setMostrarModal(true);
  };

  const handleModalClose = () => {
    setMostrarModal(false);
    setEstudianteSeleccionado(null);
  };

  const handleModalSuccess = () => {
    cargarEstudiantes(); // Recargar la lista
  };

  return (
    <div className="estudiantes-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Estudiantes</h1>
          <button 
            className="btn-nuevo"
            onClick={() => navigate('/nuevo-estudiante')}
          >
            <UserPlus size={20} />
            Nuevo Estudiante
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre, email o matrícula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="search-results">
          {busqueda && (
            <span className="results-count">
              {estudiantesFiltrados.length} resultado(s) encontrado(s)
            </span>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading-container">
          <p>Cargando estudiantes...</p>
        </div>
      ) : (
        <div className="estudiantes-grid">
          {estudiantesFiltrados.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron estudiantes</p>
              {busqueda && (
                <button 
                  className="btn-clear"
                  onClick={() => setBusqueda('')}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            estudiantesFiltrados.map((estudiante) => (
              <div key={estudiante.id} className="estudiante-card">
                <div className="card-header">
                  <div className="estudiante-foto">
                    {estudiante.foto_url ? (
                      <img src={estudiante.foto_url} alt={estudiante.nombre_completo} />
                    ) : (
                      <div className="foto-placeholder">
                        <span>{estudiante.nombre_completo.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="estudiante-info">
                    <h3>{estudiante.nombre_completo}</h3>
                    <p className="cedula">CC: {estudiante.cedula}</p>
                    {estudiante.matricula_numero && (
                      <p className="matricula">Mat: {estudiante.matricula_numero}</p>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{estudiante.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Teléfono:</span>
                    <span className="value">{estudiante.telefono}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Inscripción:</span>
                    <span className="value">{formatearFecha(estudiante.fecha_inscripcion)}</span>
                  </div>
                  {estudiante.categoria && (
                    <div className="info-row">
                      <span className="label">Licencia:</span>
                      <span className="value">{estudiante.categoria}</span>
                    </div>
                  )}
                  {estudiante.saldo_pendiente !== undefined && (
                    <div className="info-row">
                      <span className="label">Saldo:</span>
                      <span className="value saldo">{formatearMoneda(estudiante.saldo_pendiente)}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <span className={`badge ${getEstadoBadgeClass(estudiante.estado)}`}>
                    {estudiante.estado.replace('_', ' ')}
                  </span>
                  <div className="card-actions">
                    {estudiante.estado === 'PROSPECTO' && (
                      <button 
                        className="btn-definir"
                        onClick={() => handleDefinirServicio(estudiante)}
                        title="Definir Servicio"
                      >
                        <Settings size={18} />
                        Definir Servicio
                      </button>
                    )}
                    <button 
                      className="btn-ver"
                      onClick={() => navigate(`/estudiantes/${estudiante.id}`)}
                    >
                      <Eye size={18} />
                      Ver Detalle
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Definir Servicio */}
      {mostrarModal && estudianteSeleccionado && (
        <DefinirServicioModal
          estudiante={estudianteSeleccionado}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};
