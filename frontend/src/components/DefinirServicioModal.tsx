import { useState, useEffect, FormEvent } from 'react';
import { X, DollarSign, FileText, Save } from 'lucide-react';
import { estudiantesAPI, tarifasAPI } from '../services/api';
import '../styles/DefinirServicioModal.css';

interface DefinirServicioModalProps {
  estudiante: {
    id: number;
    nombre_completo: string;
    cedula: string;
    tipo_documento?: string;
    matricula_numero?: string;
    foto_url?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const DefinirServicioModal = ({ estudiante, onClose, onSuccess }: DefinirServicioModalProps) => {
  const [modoServicio, setModoServicio] = useState<'PRIMERA_VEZ' | 'RECATEGORIZACION'>('PRIMERA_VEZ');
  const [categoriaActual, setCategoriaActual] = useState('');
  const [categoriaNueva, setCategoriaNueva] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [origenCliente, setOrigenCliente] = useState('DIRECTO');
  const [valorTotal, setValorTotal] = useState('');
  const [referidoPor, setReferidoPor] = useState('');
  const [telefonoReferidor, setTelefonoReferidor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tarifas, setTarifas] = useState<any[]>([]);

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

  useEffect(() => {
    const cargarTarifas = async () => {
      try {
        const data = await tarifasAPI.getAll();
        setTarifas(data || []);
      } catch (err) {
        console.error('Error al cargar tarifas:', err);
      }
    };
    cargarTarifas();
  }, []);

  useEffect(() => {
    if (origenCliente === 'DIRECTO' && tipoServicio) {
      const minimo = calcularPrecioMinimo(tipoServicio);
      if (minimo && !valorTotal) {
        setValorTotal(minimo.toString());
      }
    }
  }, [tarifas, origenCliente, tipoServicio, valorTotal]);

  const calcularPrecioMinimo = (tipo: string) => {
    const tarifa = tarifas.find((t) => t.tipo_servicio === tipo && t.activo);
    if (!tarifa) return 0;
    const base = Number(tarifa.precio_base || 0);
    const practica = Number(tarifa.costo_practica || 0);
    const esCertificado = ['CERTIFICADO_B1', 'CERTIFICADO_C1'].includes(tipo);
    return esCertificado ? base + practica : base;
  };

  const categoriasLicencia = [
    { value: 'A2', label: 'A2' },
    { value: 'B1', label: 'B1' },
    { value: 'C1', label: 'C1' }
  ];

  const tiposServicio = [
    { value: 'LICENCIA_A2', label: 'Licencia A2 (Moto)', categoria: 'A2' },
    { value: 'LICENCIA_B1', label: 'Licencia B1 (Automóvil)', categoria: 'B1' },
    { value: 'LICENCIA_C1', label: 'Licencia C1 (Camioneta)', categoria: 'C1' },
    { value: 'COMBO_A2_B1', label: 'Combo A2 + B1', categoria: 'A2,B1' },
    { value: 'COMBO_A2_C1', label: 'Combo A2 + C1', categoria: 'A2,C1' },
    { value: 'CERTIFICADO_MOTO', label: 'Certificado Moto', categoria: 'A2' },
    { value: 'CERTIFICADO_B1', label: 'Certificado B1', categoria: 'B1' },
    { value: 'CERTIFICADO_C1', label: 'Certificado C1', categoria: 'C1' },
    { value: 'CERTIFICADO_B1_SIN_PRACTICA', label: 'Certificado B1 sin práctica', categoria: 'B1' },
    { value: 'CERTIFICADO_C1_SIN_PRACTICA', label: 'Certificado C1 sin práctica', categoria: 'C1' },
    { value: 'CERTIFICADO_A2_B1_SIN_PRACTICA', label: 'Certificado A2 + B1 sin práctica', categoria: 'A2,B1' },
    { value: 'CERTIFICADO_A2_C1_SIN_PRACTICA', label: 'Certificado A2 + C1 sin práctica', categoria: 'A2,C1' },
    { value: 'CERTIFICADO_A2_B1_CON_PRACTICA', label: 'Certificado A2 + B1 con práctica', categoria: 'A2,B1' },
    { value: 'CERTIFICADO_A2_C1_CON_PRACTICA', label: 'Certificado A2 + C1 con práctica', categoria: 'A2,C1' },
  ];

  const categoriaToTipo = (categoriaValue: string) => {
    const mapa: Record<string, string> = {
      A2: 'LICENCIA_A2',
      B1: 'LICENCIA_B1',
      C1: 'LICENCIA_C1'
    };
    return mapa[categoriaValue] || '';
  };

  const setTipoYPrecio = (tipo: string, categoriaSeleccionada: string) => {
    setTipoServicio(tipo);
    setCategoria(categoriaSeleccionada);
    if (origenCliente === 'DIRECTO') {
      const minimo = calcularPrecioMinimo(tipo);
      setValorTotal(minimo ? minimo.toString() : '');
    } else {
      setValorTotal('');
    }
  };

  const handleTipoServicioChange = (tipo: string) => {
    const servicioSeleccionado = tiposServicio.find(s => s.value === tipo);
    if (!servicioSeleccionado) {
      setTipoServicio('');
      setCategoria('');
      return;
    }
    setTipoYPrecio(tipo, servicioSeleccionado.categoria);
  };

  const handleModoServicioChange = (modo: 'PRIMERA_VEZ' | 'RECATEGORIZACION') => {
    setModoServicio(modo);
    setCategoriaActual('');
    setCategoriaNueva('');
    setTipoServicio('');
    setCategoria('');
    setValorTotal('');
  };

  const handleCategoriaNuevaChange = (value: string) => {
    setCategoriaNueva(value);
    const tipo = categoriaToTipo(value);
    if (tipo) {
      setTipoYPrecio(tipo, value);
    } else {
      setTipoServicio('');
      setCategoria('');
      setValorTotal('');
    }
  };

  const handleOrigenChange = (origen: string) => {
    setOrigenCliente(origen);
    
    // Si cambia a DIRECTO y hay un tipo de servicio seleccionado, establecer precio base
    if (origen === 'DIRECTO' && tipoServicio) {
      const minimo = calcularPrecioMinimo(tipoServicio);
      setValorTotal(minimo ? minimo.toString() : '');
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
    if (modoServicio === 'RECATEGORIZACION') {
      if (!categoriaActual || !categoriaNueva) {
        setError('Debe seleccionar la categoría actual y la nueva');
        return;
      }
      if (categoriaActual === categoriaNueva) {
        setError('La nueva categoría debe ser diferente a la actual');
        return;
      }
    }

    const minimo = calcularPrecioMinimo(tipoServicio);
    if (origenCliente === 'DIRECTO' && minimo <= 0) {
      setError('No hay tarifa definida para este servicio');
      return;
    }
    if (origenCliente === 'REFERIDO' && minimo > 0 && parseInt(valorTotal) < minimo) {
      setError(`El valor no puede ser menor a ${formatearMoneda(minimo.toString())}`);
      return;
    }

    // Validar campos de referidor si es cliente referido
    if (origenCliente === 'REFERIDO' && !referidoPor.trim()) {
      setError('Por favor ingrese el nombre de quien refirió al cliente');
      return;
    }

    setIsLoading(true);

    try {
      // Llamar al endpoint para definir el servicio
      await estudiantesAPI.definirServicio(estudiante.id, {
        tipo_servicio: tipoServicio,
        es_recategorizacion: modoServicio === 'RECATEGORIZACION',
        categoria_actual: modoServicio === 'RECATEGORIZACION' ? categoriaActual : null,
        categoria_nueva: modoServicio === 'RECATEGORIZACION' ? categoriaNueva : null,
        origen_cliente: origenCliente,
        valor_total_curso: origenCliente === 'REFERIDO' ? parseInt(valorTotal) : null,
        referido_por: origenCliente === 'REFERIDO' ? referidoPor : null,
        telefono_referidor: origenCliente === 'REFERIDO' ? telefonoReferidor : null,
        observaciones: observaciones || null
      });

      alert('Servicio definido exitosamente');
      if (window.confirm('¿Desea abrir el contrato en PDF?')) {
        const pdfBlob = await estudiantesAPI.getContratoPdf(estudiante.id);
        const fileUrl = URL.createObjectURL(pdfBlob);
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
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
      <div className="modal-overlay">
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
            <p>{getTipoDocumentoLabel(estudiante.tipo_documento)}: {estudiante.cedula}</p>
            {estudiante.matricula_numero && (
              <p className="matricula-badge">Mat: {estudiante.matricula_numero}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Tipo de Solicitud *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="PRIMERA_VEZ"
                  checked={modoServicio === 'PRIMERA_VEZ'}
                  onChange={() => handleModoServicioChange('PRIMERA_VEZ')}
                />
                <span>Primera Vez</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="RECATEGORIZACION"
                  checked={modoServicio === 'RECATEGORIZACION'}
                  onChange={() => handleModoServicioChange('RECATEGORIZACION')}
                />
                <span>Recategorización</span>
              </label>
            </div>
          </div>

          {modoServicio === 'RECATEGORIZACION' ? (
            <div className="form-group">
              <label>Categoría Actual *</label>
              <select
                value={categoriaActual}
                onChange={(e) => setCategoriaActual(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Seleccione la categoría actual</option>
                {categoriasLicencia.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <label style={{ marginTop: '12px' }}>Nueva Categoría *</label>
              <select
                value={categoriaNueva}
                onChange={(e) => handleCategoriaNuevaChange(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Seleccione la nueva categoría</option>
                {categoriasLicencia.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
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
          )}

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

          {/* Campos de referidor - solo visible si es REFERIDO */}
          {origenCliente === 'REFERIDO' && (
            <div className="referidor-fields">
              <div className="form-group">
                <label>Referido por *</label>
                <input
                  type="text"
                  value={referidoPor}
                  onChange={(e) => setReferidoPor(e.target.value.toUpperCase())}
                  className="form-input"
                  placeholder="NOMBRE DE QUIEN REFIRIÓ"
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono del Referidor</label>
                <input
                  type="tel"
                  value={telefonoReferidor}
                  onChange={(e) => setTelefonoReferidor(e.target.value)}
                  className="form-input"
                  placeholder="Número de contacto (opcional)"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Valor Total del Curso *</label>
            {origenCliente === 'REFERIDO' && (
              <small className="help-text">
                Mínimo permitido: {formatearMoneda(calcularPrecioMinimo(tipoServicio).toString())}
              </small>
            )}
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
