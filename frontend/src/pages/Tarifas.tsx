import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { tarifasAPI } from '../services/api';
import '../styles/Tarifas.css';

interface Tarifa {
  id: number;
  tipo_servicio: string;
  precio_base: number;
  costo_practica: number;
  activo: boolean;
}

const tiposServicio = [
  { value: 'LICENCIA_A2', label: 'Licencia A2 (Moto)' },
  { value: 'LICENCIA_B1', label: 'Licencia B1 (Automóvil)' },
  { value: 'LICENCIA_C1', label: 'Licencia C1 (Camioneta)' },
  { value: 'RECATEGORIZACION_C1', label: 'Recategorización C1' },
  { value: 'COMBO_A2_B1', label: 'Combo A2 + B1' },
  { value: 'COMBO_A2_C1', label: 'Combo A2 + C1' },
  { value: 'CERTIFICADO_MOTO', label: 'Certificado Moto' },
  { value: 'CERTIFICADO_B1', label: 'Certificado B1' },
  { value: 'CERTIFICADO_C1', label: 'Certificado C1' }
];

export const Tarifas = () => {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Tarifa | null>(null);
  const [tipoServicio, setTipoServicio] = useState('');
  const [precioBase, setPrecioBase] = useState('');
  const [costoPractica, setCostoPractica] = useState('');
  const [activo, setActivo] = useState(true);

  const cargarTarifas = async () => {
    try {
      setLoading(true);
      const data = await tarifasAPI.getAll();
      setTarifas(data || []);
    } catch (err) {
      console.error('Error al cargar tarifas:', err);
      setError('No se pudieron cargar las tarifas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTarifas();
  }, []);

  const abrirNueva = () => {
    setEditando(null);
    setTipoServicio('');
    setPrecioBase('');
    setCostoPractica('');
    setActivo(true);
    setShowModal(true);
  };

  const abrirEditar = (t: Tarifa) => {
    setEditando(t);
    setTipoServicio(t.tipo_servicio);
    setPrecioBase(String(t.precio_base));
    setCostoPractica(String(t.costo_practica || 0));
    setActivo(t.activo);
    setShowModal(true);
  };

  const guardar = async () => {
    if (!tipoServicio || !precioBase) {
      setError('Tipo de servicio y precio base son obligatorios');
      return;
    }
    try {
      const payload = {
        tipo_servicio: tipoServicio,
        precio_base: parseFloat(precioBase),
        costo_practica: costoPractica ? parseFloat(costoPractica) : 0,
        activo
      };
      if (editando) {
        await tarifasAPI.update(editando.id, payload);
      } else {
        await tarifasAPI.create(payload);
      }
      setShowModal(false);
      await cargarTarifas();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar la tarifa');
    }
  };

  const desactivar = async (t: Tarifa) => {
    const ok = window.confirm(`¿Desactivar tarifa ${t.tipo_servicio}?`);
    if (!ok) return;
    try {
      await tarifasAPI.delete(t.id);
      await cargarTarifas();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al desactivar la tarifa');
    }
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  return (
    <div className="tarifas-container">
      <PageHeader
        title="Tarifas"
        subtitle="Administración de precios por servicio"
        icon={<GraduationCap size={20} />}
        actions={
          <button className="btn-nuevo" onClick={abrirNueva}>
            <Plus size={16} /> Nueva Tarifa
          </button>
        }
      />

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">Cargando tarifas...</div>
      ) : (
        <div className="tarifas-table">
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Precio base</th>
                <th>Costo práctica</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tarifas.map((t) => (
                <tr key={t.id}>
                  <td>{t.tipo_servicio}</td>
                  <td>{formatearMoneda(Number(t.precio_base))}</td>
                  <td>{formatearMoneda(Number(t.costo_practica || 0))}</td>
                  <td>{t.activo ? 'Activa' : 'Inactiva'}</td>
                  <td>
                    <button className="btn-icon" onClick={() => abrirEditar(t)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn-icon danger" onClick={() => desactivar(t)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {tarifas.length === 0 && (
                <tr>
                  <td colSpan={5}>No hay tarifas registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editando ? 'Editar Tarifa' : 'Nueva Tarifa'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tipo de servicio</label>
                <select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} disabled={!!editando}>
                  <option value="">Seleccione</option>
                  {tiposServicio.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Precio base</label>
                <input type="number" value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Costo práctica</label>
                <input type="number" value={costoPractica} onChange={(e) => setCostoPractica(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={activo ? '1' : '0'} onChange={(e) => setActivo(e.target.value === '1')}>
                  <option value="1">Activa</option>
                  <option value="0">Inactiva</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
