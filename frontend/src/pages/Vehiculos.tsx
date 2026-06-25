import { useEffect, useRef, useState } from 'react';
import { Car, Plus, Search, X, Pencil, Trash2, Eye, ChevronDown } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useUIFeedback } from '../contexts/UIFeedbackContext';
import { instructoresAPI, uploadsAPI, vehiculosAPI } from '../services/api';
import '../styles/Vehiculos.css';
import { useNavigate } from 'react-router-dom';

interface Vehiculo {
  id: number;
  placa: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  año?: number;
  color?: string;
  cilindraje?: string;
  vin?: string;
  numero_motor?: string;
  numero_chasis?: string;
  foto_url?: string;
  kilometraje_actual?: number;
  responsable_instructor_id?: number | null;
  responsable_nombre?: string | null;
  is_active: boolean;
}

const tiposVehiculo = ['MOTO', 'AUTO', 'CAMION', 'BUS', 'OTRO'];

export const Vehiculos = () => {
  const { confirm, showToast } = useUIFeedback();
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const vehiculosPorPagina = 12;
  const prevBusquedaRef = useRef('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [vehiculoEditar, setVehiculoEditar] = useState<Vehiculo | null>(null);

  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [activo, setActivo] = useState(true);
  const [color, setColor] = useState('');
  const [cilindraje, setCilindraje] = useState('');
  const [vin, setVin] = useState('');
  const [numeroMotor, setNumeroMotor] = useState('');
  const [numeroChasis, setNumeroChasis] = useState('');
  const [kilometrajeActual, setKilometrajeActual] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [instructores, setInstructores] = useState<any[]>([]);
  const [tarjetasExpandidas, setTarjetasExpandidas] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handler = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [busqueda]);

  useEffect(() => {
    if (prevBusquedaRef.current !== busquedaDebounced) {
      prevBusquedaRef.current = busquedaDebounced;
      if (paginaActual !== 1) {
        setPaginaActual(1);
        return;
      }
    }
    cargarVehiculos();
  }, [paginaActual, busquedaDebounced, filtroActivo]);

  useEffect(() => {
    const cargarInstructores = async () => {
      try {
        const data = await instructoresAPI.getAll({ estado: 'ACTIVO', limit: 100 });
        setInstructores(data.items || []);
      } catch (err) {
        console.error('Error al cargar instructores:', err);
      }
    };
    cargarInstructores();
  }, []);

  const cargarVehiculos = async () => {
    try {
      setLoading(true);
      const skip = (paginaActual - 1) * vehiculosPorPagina;
      const response = await vehiculosAPI.getAll({
        skip,
        limit: vehiculosPorPagina,
        search: busquedaDebounced || undefined,
        activo: filtroActivo === 'todos' ? undefined : filtroActivo === 'activos'
      });
      setVehiculos(response.items || []);
      setTotalVehiculos(response.total || 0);
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
      setError('Error al cargar la lista de vehículos');
      setVehiculos([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setVehiculoEditar(null);
    setPlaca('');
    setTipo('');
    setMarca('');
    setModelo('');
    setAnio('');
    setActivo(true);
    setColor('');
    setCilindraje('');
    setVin('');
    setNumeroMotor('');
    setNumeroChasis('');
    setKilometrajeActual('');
    setFotoUrl('');
    setResponsableId('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (vehiculo: Vehiculo) => {
    setVehiculoEditar(vehiculo);
    setPlaca(vehiculo.placa);
    setTipo(vehiculo.tipo || '');
    setMarca(vehiculo.marca || '');
    setModelo(vehiculo.modelo || '');
    setAnio(vehiculo.año ? String(vehiculo.año) : '');
    setActivo(Boolean(vehiculo.is_active));
    setColor(vehiculo.color || '');
    setCilindraje(vehiculo.cilindraje || '');
    setVin(vehiculo.vin || '');
    setNumeroMotor((vehiculo as any).numero_motor || '');
    setNumeroChasis((vehiculo as any).numero_chasis || '');
    setKilometrajeActual(vehiculo.kilometraje_actual ? String(vehiculo.kilometraje_actual) : '');
    setFotoUrl(vehiculo.foto_url || '');
    setResponsableId(vehiculo.responsable_instructor_id ? String(vehiculo.responsable_instructor_id) : '');
    setMostrarModal(true);
  };

  const handleFotoSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const res = await uploadsAPI.uploadVehiculoFoto(base64);
        setFotoUrl(res.foto_url);
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
        showToast(msg || 'Error al subir foto', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const guardarVehiculo = async () => {
    if (!placa.trim()) {
      showToast('La placa es obligatoria', 'error');
      return;
    }
    const payload = {
      placa: placa.trim().toUpperCase(),
      tipo: tipo || null,
      marca: marca ? marca.toUpperCase() : null,
      modelo: modelo ? modelo.toUpperCase() : null,
      año: anio ? parseInt(anio) : null,
      is_active: activo,
      color: color ? color.toUpperCase() : null,
      cilindraje: cilindraje || null,
      vin: vin || null,
      numero_motor: numeroMotor || null,
      numero_chasis: numeroChasis || null,
      kilometraje_actual: kilometrajeActual ? parseInt(kilometrajeActual) : null,
      foto_url: fotoUrl || null,
      responsable_instructor_id: responsableId ? parseInt(responsableId, 10) : null
    };
    try {
      if (vehiculoEditar) {
        await vehiculosAPI.update(vehiculoEditar.id, payload);
        showToast('Vehículo actualizado correctamente', 'success');
      } else {
        await vehiculosAPI.create(payload);
        showToast('Vehículo creado correctamente', 'success');
      }
      setMostrarModal(false);
      await cargarVehiculos();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al guardar el vehículo', 'error');
    }
  };

  const eliminarVehiculo = async (vehiculo: Vehiculo) => {
    const confirmacion = await confirm({
      title: 'Desactivar vehículo',
      message: `¿Deseas desactivar el vehículo ${vehiculo.placa}?`,
      confirmText: 'Desactivar',
      danger: true,
    });
    if (!confirmacion) return;
    try {
      await vehiculosAPI.delete(vehiculo.id);
      await cargarVehiculos();
      showToast('Vehículo desactivado correctamente', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al desactivar el vehículo', 'error');
    }
  };

  const totalPaginas = Math.ceil(totalVehiculos / vehiculosPorPagina);

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatKilometraje = (km?: number) => {
    if (typeof km !== 'number') return '-';
    return `${km.toLocaleString('es-CO')} km`;
  };

  const toggleTarjeta = (vehiculoId: number) => {
    setTarjetasExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(vehiculoId)) {
        next.delete(vehiculoId);
      } else {
        next.add(vehiculoId);
      }
      return next;
    });
  };

  return (
    <div className="vehiculos-container">
      <PageHeader
        title="Vehículos"
        subtitle="Gestión del parque automotor"
        icon={<Car size={20} />}
        actions={
          <button className="btn-nuevo" onClick={abrirModalNuevo}>
            <Plus size={18} />
            Nuevo Vehículo
          </button>
        }
      />

      <div className="vehiculos-filtros">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value as any)}>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="todos">Todos</option>
        </select>
        <div className="total-label">
          {totalVehiculos} vehículo{totalVehiculos !== 1 ? 's' : ''}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <p>Cargando vehículos...</p>
        </div>
      ) : (
        <div className="vehiculos-results">
          {vehiculos.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron vehículos</p>
            </div>
          ) : (
            <div className="vehiculos-grid">
              {vehiculos.map((vehiculo) => {
                const isExpanded = tarjetasExpandidas.has(vehiculo.id);

                return (
                <article
                  key={vehiculo.id}
                  className={`vehiculo-card ${isExpanded ? 'expanded' : 'collapsed'} ${vehiculo.is_active ? '' : 'vehiculo-card-inactivo'}`}
                >
                  <div className="card-header clickeable" onClick={() => toggleTarjeta(vehiculo.id)}>
                    {vehiculo.foto_url ? (
                      <div className="estudiante-foto">
                        <img
                          src={vehiculo.foto_url}
                          alt={`Foto de ${vehiculo.placa}`}
                          className={`vehiculo-foto-thumb ${vehiculo.is_active ? '' : 'vehiculo-foto-thumb-inactivo'}`}
                        />
                      </div>
                    ) : (
                      <div className="estudiante-foto" aria-hidden="true">
                        <div className="foto-placeholder">{vehiculo.placa.slice(0, 2)}</div>
                      </div>
                    )}
                    <div className="estudiante-info">
                      <h3>{vehiculo.placa}</h3>
                      <p className="cedula">{vehiculo.tipo || 'TIPO SIN DEFINIR'}</p>
                      <p className="matricula">{[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'SIN MARCA / MODELO'}</p>
                    </div>
                    <ChevronDown size={22} className={`chevron-toggle ${isExpanded ? '' : 'rotated'}`} />
                  </div>

                  {isExpanded && (
                    <>
                    <div className="card-body">
                      <div className="info-row">
                        <span className="label">Tipo</span>
                        <span className="value">{vehiculo.tipo || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Año</span>
                        <span className="value">{vehiculo.año || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Responsable</span>
                        <span className="value">{vehiculo.responsable_nombre || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Kilometraje</span>
                        <span className="value">{formatKilometraje(vehiculo.kilometraje_actual)}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className={`badge ${vehiculo.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {vehiculo.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="card-actions">
                        <button className="btn-ver" onClick={() => navigate(`/vehiculos/${vehiculo.id}`)} title="Hoja de vida" aria-label={`Ver hoja de vida de ${vehiculo.placa}`}>
                          <Eye size={16} />
                          Ver Detalle
                        </button>
                        <button className="btn-ver btn-editar" onClick={() => abrirModalEditar(vehiculo)} aria-label={`Editar vehículo ${vehiculo.placa}`} title="Editar vehículo">
                          <Pencil size={16} />
                          Editar
                        </button>
                        {vehiculo.is_active && (
                          <button className="btn-desactivar" onClick={() => eliminarVehiculo(vehiculo)} aria-label={`Desactivar vehículo ${vehiculo.placa}`} title="Desactivar vehículo">
                            <Trash2 size={16} />
                            Desactivar
                          </button>
                        )}
                      </div>
                    </div>
                    </>
                  )}
                </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="pagination">
          <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>
            Anterior
          </button>
          <span>Página {paginaActual} de {totalPaginas}</span>
          <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>
            Siguiente
          </button>
        </div>
      )}

      {mostrarModal && (
      <div className="modal-overlay">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{vehiculoEditar ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
              <button className="btn-icon" onClick={() => setMostrarModal(false)} aria-label="Cerrar modal de vehículo" title="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Placa *</label>
                <input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label>Foto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFotoSelect(file);
                    }
                  }}
                />
                {fotoUrl && <small>Foto cargada</small>}
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Seleccione</option>
                  {tiposVehiculo.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <input value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label>Cilindraje</label>
                <input value={cilindraje} onChange={(e) => setCilindraje(e.target.value)} placeholder="Ej: 1600cc" />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input value={marca} onChange={(e) => setMarca(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label>Modelo</label>
                <input value={modelo} onChange={(e) => setModelo(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label>Responsable</label>
                <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
                  <option value="">Sin responsable</option>
                  {instructores.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Año</label>
                <input
                  type="number"
                  min="1980"
                  max={new Date().getFullYear() + 1}
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>VIN</label>
                <input value={vin} onChange={(e) => setVin(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Número de Motor</label>
                <input value={numeroMotor} onChange={(e) => setNumeroMotor(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label>Número de Chasis</label>
                <input value={numeroChasis} onChange={(e) => setNumeroChasis(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label>Kilometraje Actual</label>
                <input
                  type="number"
                  min="0"
                  value={kilometrajeActual}
                  onChange={(e) => setKilometrajeActual(e.target.value)}
                />
              </div>
              {vehiculoEditar && (
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                    />
                    Activo
                  </label>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={guardarVehiculo}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
