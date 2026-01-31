import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructoresAPI } from '../services/api';
import { 
  UserCheck, Search, Plus, Eye, Star, Phone, Award, 
  AlertCircle, Filter, X, AlertTriangle, Clock
} from 'lucide-react';
import { InstructorForm } from '../components/InstructorForm';
import '../styles/Instructores.css';
import '../styles/InstructorForm.css';

interface Instructor {
  id: number;
  usuario_id: number;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  foto_url?: string;
  licencia_numero: string;
  categorias_enseña: string;
  especialidad?: string;
  estado: string;
  calificacion_promedio: number;
  estado_documentacion?: string;
  licencia_vigencia_hasta?: string;
  certificado_vigencia_hasta?: string;
}

export const Instructores = () => {
  const navigate = useNavigate();
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [instructorEditar, setInstructorEditar] = useState<Instructor | null>(null);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalInstructores, setTotalInstructores] = useState(0);
  const instructoresPorPagina = 12;

  useEffect(() => {
    cargarInstructores();
  }, [paginaActual, estadoFiltro]);

  const cargarInstructores = async () => {
    try {
      setIsLoading(true);
      const skip = (paginaActual - 1) * instructoresPorPagina;
      const response = await instructoresAPI.getAll({ 
        skip, 
        limit: instructoresPorPagina,
        estado: estadoFiltro || undefined,
        busqueda: busqueda || undefined
      });
      
      setInstructores(response.items || []);
      setTotalInstructores(response.total || 0);
    } catch (err) {
      console.error('Error al cargar instructores:', err);
      setError('Error al cargar la lista de instructores');
      setInstructores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuscar = () => {
    setPaginaActual(1);
    cargarInstructores();
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setEstadoFiltro('');
    setPaginaActual(1);
  };

  const handleNuevoInstructor = () => {
    setInstructorEditar(null);
    setMostrarFormulario(true);
  };

  const handleFormularioClose = () => {
    setMostrarFormulario(false);
    setInstructorEditar(null);
  };

  const handleFormularioSuccess = () => {
    cargarInstructores();
    handleFormularioClose();
  };

  const getEstadoBadgeClass = (estado: string) => {
    const estados: { [key: string]: string } = {
      'ACTIVO': 'badge-activo',
      'LICENCIA_MEDICA': 'badge-licencia',
      'VACACIONES': 'badge-vacaciones',
      'INACTIVO': 'badge-inactivo'
    };
    return estados[estado] || 'badge-secondary';
  };

  const getEstadoTexto = (estado: string) => {
    const textos: { [key: string]: string } = {
      'ACTIVO': 'Activo',
      'LICENCIA_MEDICA': 'Licencia Médica',
      'VACACIONES': 'Vacaciones',
      'INACTIVO': 'Inactivo'
    };
    return textos[estado] || estado;
  };

  const renderEstrellas = (calificacion: number) => {
    const estrellas = [];
    const cal = Math.round(calificacion * 2) / 2; // Redondear a 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (i <= cal) {
        estrellas.push(<Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />);
      } else if (i - 0.5 === cal) {
        estrellas.push(<Star key={i} size={14} fill="#f59e0b" color="#f59e0b" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
      } else {
        estrellas.push(<Star key={i} size={14} color="#d1d5db" />);
      }
    }
    
    return estrellas;
  };

  const totalPaginas = Math.ceil(totalInstructores / instructoresPorPagina);

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="instructores-container">
      {/* Header */}
      <div className="instructores-header">
        <h1>Instructores</h1>
        <button className="btn-primary" onClick={handleNuevoInstructor}>
          <Plus size={20} />
          Nuevo Instructor
        </button>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="instructores-filtros">
        <div className="filtros-row">
          <div className="form-group">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nombre, cédula o licencia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="ACTIVO">Activos</option>
              <option value="LICENCIA_MEDICA">Licencia Médica</option>
              <option value="VACACIONES">Vacaciones</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>

          <div className="form-group">
            <label>&nbsp;</label>
            <button onClick={handleBuscar} className="btn-primary" style={{width: '100%'}}>
              <Search size={16} />
              Buscar
            </button>
          </div>

          {(busqueda || estadoFiltro) && (
            <div className="form-group">
              <label>&nbsp;</label>
              <button onClick={handleLimpiarFiltros} className="btn-limpiar">
                <X size={16} />
                Limpiar
              </button>
            </div>
          )}

          <div className="form-group">
            <label>&nbsp;</label>
            <div style={{ padding: '0.625rem 0', color: '#666', fontSize: '0.9rem' }}>
              {totalInstructores} instructor{totalInstructores !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Grid de Instructores */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando instructores...</p>
        </div>
      ) : (
        <>
          {instructores.length === 0 ? (
            <div className="no-instructores">
              <UserCheck size={64} />
              <h3>No se encontraron instructores</h3>
              {busqueda || estadoFiltro ? (
                <p>Intenta ajustar los filtros de búsqueda</p>
              ) : (
                <p>Comienza agregando tu primer instructor</p>
              )}
            </div>
          ) : (
            <>
              <div className="instructores-grid">
                {instructores.map((instructor) => (
                  <div 
                    key={instructor.id} 
                    className="instructor-card"
                    onClick={() => navigate(`/instructores/${instructor.id}`)}
                  >
                    {/* Foto y Estado */}
                    <div className="instructor-card-header">
                      {instructor.foto_url ? (
                        <img 
                          src={instructor.foto_url} 
                          alt={instructor.nombre_completo}
                          className="instructor-foto"
                        />
                      ) : (
                        <div className="instructor-foto-placeholder">
                          <UserCheck size={40} />
                        </div>
                      )}
                      <span className={`estado-badge ${instructor.estado.toLowerCase()}`}>
                        {getEstadoTexto(instructor.estado)}
                      </span>
                      {/* Indicador de documentación */}
                      {instructor.estado_documentacion && instructor.estado_documentacion !== 'COMPLETO' && (
                        <span className="doc-alert-badge" title={instructor.estado_documentacion}>
                          {instructor.estado_documentacion === 'VENCIDO' ? (
                            <AlertCircle size={20} />
                          ) : instructor.estado_documentacion === 'PROXIMO_VENCER' ? (
                            <AlertTriangle size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Información */}
                    <div className="instructor-card-body">
                      <h3 className="instructor-nombre">{instructor.nombre_completo}</h3>
                      <div className="instructor-licencia">
                        <Award size={16} />
                        {instructor.licencia_numero}
                      </div>
                      
                      <div className="instructor-info-grid">
                        {/* Teléfono */}
                        <div className="info-item">
                          <Phone size={16} />
                          <span>{instructor.telefono}</span>
                        </div>

                        {/* Categorías que enseña */}
                        <div className="info-item">
                          <div className="categorias-tags">
                            {instructor.categorias_enseña?.split(',').map((cat, idx) => (
                              <span key={idx} className="categoria-tag">{cat.trim()}</span>
                            ))}
                          </div>
                        </div>

                        {/* Calificación */}
                        <div className="info-item">
                          <div className="rating-display">
                            <div className="stars">
                              {renderEstrellas(Number(instructor.calificacion_promedio) || 0)}
                            </div>
                            <span className="rating-number">
                              {Number(instructor.calificacion_promedio || 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="pagination-btn"
                  >
                    Anterior
                  </button>
                  <span className="pagination-info">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="pagination-btn"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal de Formulario */}
      {mostrarFormulario && (
        <InstructorForm
          instructor={instructorEditar}
          onClose={handleFormularioClose}
          onSuccess={handleFormularioSuccess}
        />
      )}
    </div>
  );
};
