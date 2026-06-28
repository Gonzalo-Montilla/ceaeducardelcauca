import { useState, useEffect, FormEvent, useMemo } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { estudiantesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUIFeedback } from '../contexts/UIFeedbackContext';
import { RolUsuario } from '../types';
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
  const { user } = useAuth();
  const { confirm, showToast } = useUIFeedback();
  const [modoServicio, setModoServicio] = useState<'PRIMERA_VEZ' | 'RECATEGORIZACION'>('PRIMERA_VEZ');
  const [categoriaActual, setCategoriaActual] = useState('');
  const [categoriaNueva, setCategoriaNueva] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [origenCliente, setOrigenCliente] = useState('DIRECTO');
  const [valorTotal, setValorTotal] = useState('');
  const [aplicarDescuento, setAplicarDescuento] = useState(false);
  const [referidoPor, setReferidoPor] = useState('');
  const [telefonoReferidor, setTelefonoReferidor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [catalogoServicios, setCatalogoServicios] = useState<any[]>([]);
  const puedeAplicarDescuento = user?.rol === RolUsuario.ADMIN || user?.rol === RolUsuario.GERENTE;

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
    const cargarCatalogo = async () => {
      try {
        const data = await estudiantesAPI.getCatalogoServicios({ solo_activos: true });
        setCatalogoServicios(data || []);
      } catch (err) {
        console.error('Error al cargar catálogo de servicios:', err);
      }
    };
    cargarCatalogo();
  }, []);

  useEffect(() => {
    if (origenCliente === 'DIRECTO' && tipoServicio) {
      const minimo = calcularPrecioMinimo(tipoServicio);
      if (minimo && (!valorTotal || !aplicarDescuento)) {
        setValorTotal(minimo.toString());
      }
    }
  }, [catalogoServicios, origenCliente, tipoServicio, valorTotal, aplicarDescuento]);

  const calcularPrecioMinimo = (tipo: string) => {
    const servicio = catalogoServicios.find((s) => s.tipo_servicio === tipo && s.activo);
    if (!servicio) return 0;
    const base = Number(servicio.precio_base || 0);
    const practica = Number(servicio.costo_practica || 0);
    const esCertificado = ['CERTIFICADO_B1', 'CERTIFICADO_C1'].includes(tipo);
    return esCertificado ? base + practica : base;
  };

  const categoriasLicencia = [
    { value: 'A2', label: 'A2' },
    { value: 'B1', label: 'B1' },
    { value: 'C1', label: 'C1' }
  ];

  const SERVICIO_LABELS: Record<string, string> = {
    LICENCIA_A2: 'Licencia A2 (Moto)',
    LICENCIA_B1: 'Licencia B1 (Automóvil)',
    LICENCIA_C1: 'Licencia C1 (Camioneta)',
    LICENCIA_A2_REFRENDACION: 'Licencia A2 + Refrendación',
    LICENCIA_B1_REFRENDACION: 'Licencia B1 + Refrendación',
    LICENCIA_C1_REFRENDACION: 'Licencia C1 + Refrendación',
    COMBO_A2_B1: 'Combo A2 + B1',
    COMBO_A2_C1: 'Combo A2 + C1',
    CERTIFICADO_MOTO: 'Certificado Moto',
    CERTIFICADO_B1: 'Certificado B1',
    CERTIFICADO_C1: 'Certificado C1',
    CERTIFICADO_B1_SIN_PRACTICA: 'Certificado B1 sin práctica',
    CERTIFICADO_C1_SIN_PRACTICA: 'Certificado C1 sin práctica',
    CERTIFICADO_A2_B1_SIN_PRACTICA: 'Certificado A2 + B1 sin práctica',
    CERTIFICADO_A2_C1_SIN_PRACTICA: 'Certificado A2 + C1 sin práctica',
    CERTIFICADO_A2_B1_CON_PRACTICA: 'Certificado A2 + B1 con práctica',
    CERTIFICADO_A2_C1_CON_PRACTICA: 'Certificado A2 + C1 con práctica',
  };

  const inferirCategoriaDesdeTipo = (tipo: string) => {
    if (tipo.includes('A2') && tipo.includes('B1')) return 'A2,B1';
    if (tipo.includes('A2') && tipo.includes('C1')) return 'A2,C1';
    if (tipo.includes('A2') || tipo.includes('MOTO')) return 'A2';
    if (tipo.includes('B1')) return 'B1';
    if (tipo.includes('C1')) return 'C1';
    return '';
  };

  const formatearLabelServicio = (tipo: string) => {
    const labelConocido = SERVICIO_LABELS[tipo];
    if (labelConocido) return labelConocido;
    return tipo
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const tiposServicioDisponibles = useMemo(() => {
    const baseFallback = Object.keys(SERVICIO_LABELS);
    const catalogoActivo = catalogoServicios
      .filter((s) => s?.activo && s?.tipo_servicio)
      .map((s) => ({
        value: String(s.tipo_servicio),
        label: String(s.label || formatearLabelServicio(String(s.tipo_servicio))),
        categoria: String(s.categoria || inferirCategoriaDesdeTipo(String(s.tipo_servicio))),
      }))
      .filter((s) => !!s.categoria);

    if (catalogoActivo.length) {
      return catalogoActivo;
    }

    return baseFallback
      .map((tipo) => ({
        value: tipo,
        label: formatearLabelServicio(tipo),
        categoria: inferirCategoriaDesdeTipo(tipo),
      }))
      .filter((s) => !!s.categoria);
  }, [catalogoServicios]);

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
    const servicioSeleccionado = tiposServicioDisponibles.find(s => s.value === tipo);
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
    setAplicarDescuento(false);
    
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
    if (origenCliente === 'DIRECTO' && aplicarDescuento) {
      const valorNumerico = parseInt(valorTotal);
      if (!valorNumerico || valorNumerico <= 0) {
        setError('El valor con descuento debe ser mayor a 0');
        return;
      }
      if (minimo > 0 && valorNumerico > minimo) {
        setError(`El valor con descuento no puede ser mayor a ${formatearMoneda(minimo.toString())}`);
        return;
      }
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
        valor_total_curso: origenCliente === 'REFERIDO'
          ? parseInt(valorTotal)
          : (aplicarDescuento ? parseInt(valorTotal) : null),
        referido_por: origenCliente === 'REFERIDO' ? referidoPor : null,
        telefono_referidor: origenCliente === 'REFERIDO' ? telefonoReferidor : null,
        observaciones: observaciones || null
      });

      showToast('Servicio definido exitosamente', 'success');
      const abrirContrato = await confirm({
        title: 'Contrato generado',
        message: '¿Desea abrir el contrato en PDF?',
        confirmText: 'Abrir contrato',
        cancelText: 'Ahora no',
      });
      if (abrirContrato) {
        try {
          const pdfBlob = await estudiantesAPI.getContratoPdf(estudiante.id);
          const fileUrl = URL.createObjectURL(pdfBlob);
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
        } catch {
          showToast('No se pudo abrir el contrato en PDF', 'error');
        }
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
                {tiposServicioDisponibles.map(servicio => (
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
            {origenCliente === 'DIRECTO' && (
              <div className="help-text">
                {puedeAplicarDescuento ? (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aplicarDescuento}
                      onChange={(e) => setAplicarDescuento(e.target.checked)}
                    />
                    <span>Aplicar descuento</span>
                  </label>
                ) : (
                  <span>Solo Admin/Gerente puede aplicar descuento</span>
                )}
              </div>
            )}
            <div className="input-with-icon">
              <DollarSign size={20} className="input-icon" />
              <input
                type="text"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value.replace(/\D/g, ''))}
                readOnly={origenCliente === 'DIRECTO' && !aplicarDescuento}
                required
                className={`form-input ${origenCliente === 'DIRECTO' && !aplicarDescuento ? 'readonly' : ''}`}
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
