import { useState, FormEvent } from 'react';
import { X, DollarSign, FileText, Save } from 'lucide-react';
import { estudiantesAPI } from '../services/api';
import '../styles/DefinirServicioModal.css';

interface DefinirServicioModalProps {
  estudiante: {
    id: number;
    nombre_completo: string;
    cedula: string;
    matricula_numero?: string;
    foto_url?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const DefinirServicioModal = ({ estudiante, onClose, onSuccess }: DefinirServicioModalProps) => {
  const [tipoServicio, setTipoServicio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [origenCliente, setOrigenCliente] = useState('DIRECTO');
  const [valorTotal, setValorTotal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Precios base para clientes directos
  const preciosBase: { [key: string]: number } = {
    'LICENCIA_A2': 950000,
    'LICENCIA_B1': 1200000,
    'LICENCIA_C1': 1300000,
    'RECATEGORIZACION_C1': 1300000,
    'COMBO_A2_B1': 2000000,
    'COMBO_A2_C1': 2200000,
    'CERTIFICADO_MOTO': 480000,
    'CERTIFICADO_B1': 650000,
    'CERTIFICADO_B1_PRACTICAS': 750000,
    'CERTIFICADO_C1': 750000,
    'CERTIFICADO_C1_PRACTICAS': 850000,
  };

  const tiposServicio = [
    { value: 'LICENCIA_A2', label: 'Licencia A2 (Moto)', categoria: 'A2' },
    { value: 'LICENCIA_B1', label: 'Licencia B1 (Automóvil)', categoria: 'B1' },
    { value: 'LICENCIA_C1', label: 'Licencia C1 (Camioneta)', categoria: 'C1' },
    { value: 'RECATEGORIZACION_C1', label: 'Recategorización C1', categoria: 'C1' },
    { value: 'COMBO_A2_B1', label: 'Combo A2 + B1', categoria: 'A2,B1' },
    { value: 'COMBO_A2_C1', label: 'Combo A2 + C1', categoria: 'A2,C1' },
    { value: 'CERTIFICADO_MOTO', label: 'Certificado Moto', categoria: 'A2' },
    { value: 'CERTIFICADO_B1', label: 'Certificado B1', categoria: 'B1' },
    { value: 'CERTIFICADO_B1_PRACTICAS', label: 'Certificado B1 + Prácticas', categoria: 'B1' },
    { value: 'CERTIFICADO_C1', label: 'Certificado C1', categoria: 'C1' },
    { value: 'CERTIFICADO_C1_PRACTICAS', label: 'Certificado C1 + Prácticas', categoria: 'C1' },
  ];

  const handleTipoServicioChange = (tipo: string) => {
    setTipoServicio(tipo);
    const servicioSeleccionado = tiposServicio.find(s => s.value === tipo);
    if (servicioSeleccionado) {
      setCategoria(servicioSeleccionado.categoria);
      
      // Si es cliente directo, establecer precio base
      if (origenCliente === 'DIRECTO') {
        setValorTotal(preciosBase[tipo]?.toString() || '');
      } else {
        // Si es referido, dejar en blanco para ingreso manual
        setValorTotal('');
      }
    }
  };

  const handleOrigenChange = (origen: string) => {
    setOrigenCliente(origen);
    
    // Si cambia a DIRECTO y hay un tipo de servicio seleccionado, establecer precio base
    if (origen === 'DIRECTO' && tipoServicio) {
      setValorTotal(preciosBase[tipoServicio]?.toString() || '');
    } else {
      // Si es REFERIDO, limpiar para ingreso manual
      setValorTotal('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tipoServicio || !categoria || !valorTotal) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    setIsLoading(true);

    try {
      // Llamar al endpoint para definir el servicio
      await estudiantesAPI.definirServicio(estudiante.id, {
        tipo_servicio: tipoServicio,
        origen_cliente: origenCliente,
        valor_total_curso: origenCliente === 'REFERIDO' ? parseInt(valorTotal) : null,
        observaciones: observaciones || null
      });

      alert('Servicio definido exitosamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al definir servicio:', err);
      setError(err.response?.data?.detail || 'Error al definir el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const formatearMoneda = (valor: string) => {
    if (!valor) return '';
    const numero = parseInt(valor.replace(/\D/g, ''));
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numero);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Definir Servicio</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="estudiante-info-header">
          {estudiante.foto_url && (
            <img src={estudiante.foto_url} alt={estudiante.nombre_completo} className="estudiante-avatar" />
          )}
          <div>
            <h3>{estudiante.nombre_completo}</h3>
            <p>CC: {estudiante.cedula}</p>
            {estudiante.matricula_numero && (
              <p className="matricula-badge">Mat: {estudiante.matricula_numero}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Tipo de Servicio *</label>
            <select
              value={tipoServicio}
              onChange={(e) => handleTipoServicioChange(e.target.value)}
              required
              className="form-select"
            >
              <option value="">Seleccione un servicio</option>
              {tiposServicio.map(servicio => (
                <option key={servicio.value} value={servicio.value}>
                  {servicio.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Origen del Cliente *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="DIRECTO"
                  checked={origenCliente === 'DIRECTO'}
                  onChange={(e) => handleOrigenChange(e.target.value)}
                />
                <span>Cliente Directo (Precio fijo)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="REFERIDO"
                  checked={origenCliente === 'REFERIDO'}
                  onChange={(e) => handleOrigenChange(e.target.value)}
                />
                <span>Cliente Referido (Precio manual)</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Categoría de Licencia</label>
            <input
              type="text"
              value={categoria}
              readOnly
              className="form-input readonly"
              placeholder="Se asigna automáticamente"
            />
          </div>

          <div className="form-group">
            <label>Valor Total del Curso *</label>
            <div className="input-with-icon">
              <DollarSign size={20} className="input-icon" />
              <input
                type="text"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value.replace(/\D/g, ''))}
                readOnly={origenCliente === 'DIRECTO'}
                required
                className={`form-input ${origenCliente === 'DIRECTO' ? 'readonly' : ''}`}
                placeholder="Ingrese el valor"
              />
            </div>
            {valorTotal && (
              <p className="valor-formateado">{formatearMoneda(valorTotal)}</p>
            )}
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value.toUpperCase())}
              className="form-textarea"
              rows={3}
              placeholder="OBSERVACIONES ADICIONALES (OPCIONAL)"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <Save size={20} />
              {isLoading ? 'Guardando...' : 'Guardar y Generar Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
