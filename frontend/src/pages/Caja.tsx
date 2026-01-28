import { useState, useEffect } from 'react';
import { Search, DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus, X } from 'lucide-react';
import { cajaAPI } from '../services/api';
import '../styles/Caja.css';

interface CajaActual {
  id: number;
  estado: string;
  fecha_apertura: string;
  usuario_apertura: string;
  saldo_inicial: number;
  total_ingresos: number;
  total_egresos: number;
  saldo_efectivo_caja: number;
  total_ingresos_efectivo: number;
  total_ingresos_transferencia: number;
  total_ingresos_tarjeta: number;
  total_egresos_efectivo: number;
  total_egresos_transferencia: number;
  total_egresos_tarjeta: number;
  num_pagos: number;
  num_egresos: number;
}

interface EstudianteFinanciero {
  id: number;
  nombre_completo: string;
  cedula: string;
  matricula_numero: string;
  foto_url?: string;
  tipo_servicio?: string;
  categoria?: string;
  estado: string;
  valor_total_curso?: number;
  saldo_pendiente?: number;
  total_pagado: number;
  fecha_primer_pago?: string;
  fecha_limite_pago?: string;
  dias_restantes?: number;
  estado_financiero: string;
  num_pagos: number;
  ultimo_pago_fecha?: string;
  ultimo_pago_monto?: number;
}

export const Caja = () => {
  const [cajaActual, setCajaActual] = useState<CajaActual | null>(null);
  const [hayCajaAbierta, setHayCajaAbierta] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para abrir caja
  const [showAbrirCaja, setShowAbrirCaja] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState('');
  
  // Estados para buscar estudiante
  const [cedula, setCedula] = useState('');
  const [estudiante, setEstudiante] = useState<EstudianteFinanciero | null>(null);
  const [buscando, setBuscando] = useState(false);
  
  // Estados para registrar pago
  const [montoPago, setMontoPago] = useState('');
  const [esPagoMixto, setEsPagoMixto] = useState(false);
  const [detallesPago, setDetallesPago] = useState<Array<{metodo: string, monto: string}>>([{metodo: 'EFECTIVO', monto: ''}]);
  const [registrandoPago, setRegistrandoPago] = useState(false);
  
  // Estados para egreso
  const [showEgreso, setShowEgreso] = useState(false);
  const [conceptoEgreso, setConceptoEgreso] = useState('');
  const [categoriaEgreso, setCategoriaEgreso] = useState('OTROS');
  const [montoEgreso, setMontoEgreso] = useState('');
  const [metodoEgreso, setMetodoEgreso] = useState('EFECTIVO');
  
  useEffect(() => {
    cargarCajaActual();
  }, []);
  
  const cargarCajaActual = async () => {
    try {
      setIsLoading(true);
      const response = await cajaAPI.getCajaActual();
      if (response) {
        setCajaActual(response);
        setHayCajaAbierta(true);
      } else {
        setHayCajaAbierta(false);
      }
    } catch (error) {
      console.error('Error al cargar caja:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAbrirCaja = async () => {
    try {
      await cajaAPI.abrirCaja({
        saldo_inicial: parseFloat(saldoInicial),
        observaciones_apertura: null
      });
      setShowAbrirCaja(false);
      setSaldoInicial('');
      await cargarCajaActual();
      alert('Caja abierta exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al abrir caja');
    }
  };
  
  const handleBuscarEstudiante = async () => {
    if (!cedula.trim()) {
      alert('Ingrese la cédula del estudiante');
      return;
    }
    
    try {
      setBuscando(true);
      const response = await cajaAPI.buscarEstudiante(cedula);
      setEstudiante(response);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Estudiante no encontrado');
      setEstudiante(null);
    } finally {
      setBuscando(false);
    }
  };
  
  const handleRegistrarPago = async () => {
    if (!estudiante || !montoPago) {
      alert('Complete todos los campos');
      return;
    }
    
    if (parseFloat(montoPago) <= 0) {
      alert('El monto debe ser mayor a cero');
      return;
    }
    
    if (estudiante.saldo_pendiente && parseFloat(montoPago) > estudiante.saldo_pendiente) {
      alert('El monto excede el saldo pendiente');
      return;
    }
    
    try {
      setRegistrandoPago(true);
      await cajaAPI.registrarPago({
        estudiante_id: estudiante.id,
        monto: parseFloat(montoPago),
        metodo_pago: metodoPago,
        concepto: 'Abono al curso',
        referencia_pago: null,
        observaciones: null
      });
      
      alert('Pago registrado exitosamente');
      setMontoPago('');
      setCedula('');
      setEstudiante(null);
      await cargarCajaActual();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al registrar pago');
    } finally {
      setRegistrandoPago(false);
    }
  };
  
  const handleRegistrarEgreso = async () => {
    if (!conceptoEgreso.trim() || !montoEgreso) {
      alert('Complete todos los campos');
      return;
    }
    
    try {
      await cajaAPI.registrarEgreso({
        concepto: conceptoEgreso,
        categoria: categoriaEgreso,
        monto: parseFloat(montoEgreso),
        metodo_pago: metodoEgreso,
        numero_factura: null,
        observaciones: null
      });
      
      alert('Egreso registrado exitosamente');
      setShowEgreso(false);
      setConceptoEgreso('');
      setMontoEgreso('');
      await cargarCajaActual();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al registrar egreso');
    }
  };
  
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  const getEstadoFinancieroColor = (estado: string) => {
    switch (estado) {
      case 'PAGADO_COMPLETO': return 'verde';
      case 'AL_DIA': return 'azul';
      case 'PROXIMO_VENCER': return 'amarillo';
      case 'VENCIDO': return 'rojo';
      default: return 'gris';
    }
  };
  
  if (isLoading) {
    return <div className="loading">Cargando...</div>;
  }
  
  if (!hayCajaAbierta) {
    return (
      <div className="caja-container">
        <div className="caja-cerrada-card">
          <AlertCircle size={64} className="icon-warning" />
          <h2>No hay caja abierta</h2>
          <p>Debe abrir una caja para comenzar a registrar movimientos</p>
          <button onClick={() => setShowAbrirCaja(true)} className="btn-primary-large">
            Abrir Caja
          </button>
        </div>
        
        {showAbrirCaja && (
          <div className="modal-overlay" onClick={() => setShowAbrirCaja(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Abrir Caja</h3>
                <button onClick={() => setShowAbrirCaja(false)} className="btn-icon">
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Saldo Inicial en Efectivo</label>
                  <input
                    type="number"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAbrirCaja(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleAbrirCaja} className="btn-primary">
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="caja-container">
      <div className="caja-header">
        <h1>Caja y Pagos</h1>
      </div>
      
      {/* Resumen de Caja */}
      <div className="caja-resumen-grid">
        <div className="stat-card highlight">
          <div className="stat-content">
            <p className="stat-label">Efectivo en Caja</p>
            <p className="stat-value-large">{formatCurrency(cajaActual?.saldo_efectivo_caja)}</p>
            <p className="stat-sublabel">Base: {formatCurrency(cajaActual?.saldo_inicial)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}>
            <DollarSign size={24} color="#16a34a" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Efectivo</p>
            <p className="stat-value success">+{formatCurrency(cajaActual?.total_ingresos_efectivo)}</p>
            <p className="stat-sublabel">-{formatCurrency(cajaActual?.total_egresos_efectivo)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe' }}>
            <TrendingUp size={24} color="#0284c7" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Transferencias</p>
            <p className="stat-value">+{formatCurrency(cajaActual?.total_ingresos_transferencia)}</p>
            <p className="stat-sublabel">-{formatCurrency(cajaActual?.total_egresos_transferencia)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <TrendingUp size={24} color="#d97706" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Tarjetas</p>
            <p className="stat-value">+{formatCurrency(cajaActual?.total_ingresos_tarjeta)}</p>
            <p className="stat-sublabel">-{formatCurrency(cajaActual?.total_egresos_tarjeta)}</p>
          </div>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-small">
          <span className="stat-small-label">Total Ingresos ({cajaActual?.num_pagos || 0} pagos)</span>
          <span className="stat-small-value success">{formatCurrency(cajaActual?.total_ingresos)}</span>
        </div>
        <div className="stat-small">
          <span className="stat-small-label">Total Egresos ({cajaActual?.num_egresos || 0} gastos)</span>
          <span className="stat-small-value danger">{formatCurrency(cajaActual?.total_egresos)}</span>
        </div>
      </div>
      
      {/* Acciones rápidas */}
      <div className="actions-bar">
        <button onClick={() => setShowEgreso(true)} className="btn-action">
          <Plus size={20} />
          Registrar Egreso
        </button>
      </div>
      
      {/* Buscar y Registrar Pago */}
      <div className="main-content-grid">
        <div className="search-section">
          <h2>Registrar Pago</h2>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por cédula..."
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscarEstudiante()}
              className="search-input"
            />
            <button onClick={handleBuscarEstudiante} disabled={buscando} className="btn-search">
              <Search size={20} />
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          
          {estudiante && (
            <div className="estudiante-info-card">
              <div className="estudiante-header">
                {estudiante.foto_url && (
                  <img src={estudiante.foto_url} alt={estudiante.nombre_completo} className="estudiante-foto" />
                )}
                <div className="estudiante-datos">
                  <h3>{estudiante.nombre_completo}</h3>
                  <p>CC: {estudiante.cedula}</p>
                  <p>Matrícula: {estudiante.matricula_numero}</p>
                  <span className={`badge badge-${getEstadoFinancieroColor(estudiante.estado_financiero)}`}>
                    {estudiante.estado_financiero.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="financial-info">
                <div className="info-row">
                  <span>Servicio:</span>
                  <strong>{estudiante.tipo_servicio || 'N/A'}</strong>
                </div>
                <div className="info-row">
                  <span>Valor Total:</span>
                  <strong>{formatCurrency(estudiante.valor_total_curso)}</strong>
                </div>
                <div className="info-row">
                  <span>Total Pagado:</span>
                  <strong className="success">{formatCurrency(estudiante.total_pagado)}</strong>
                </div>
                <div className="info-row highlight">
                  <span>Saldo Pendiente:</span>
                  <strong className="danger">{formatCurrency(estudiante.saldo_pendiente)}</strong>
                </div>
                {estudiante.dias_restantes !== null && estudiante.dias_restantes !== undefined && (
                  <div className="info-row">
                    <span>Días Restantes:</span>
                    <strong className={estudiante.dias_restantes < 7 ? 'danger' : ''}>
                      {estudiante.dias_restantes} días
                    </strong>
                  </div>
                )}
              </div>
              
              <div className="pago-form">
                <h4>Registrar Pago</h4>
                <div className="form-group">
                  <label>Monto a Pagar</label>
                  <input
                    type="number"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Método de Pago</label>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="form-select">
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="NEQUI">Nequi</option>
                    <option value="DAVIPLATA">Daviplata</option>
                  </select>
                </div>
                <button onClick={handleRegistrarPago} disabled={registrandoPago} className="btn-primary-full">
                  {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal Egreso */}
      {showEgreso && (
        <div className="modal-overlay" onClick={() => setShowEgreso(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Egreso</h3>
              <button onClick={() => setShowEgreso(false)} className="btn-icon">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Concepto *</label>
                <input
                  type="text"
                  value={conceptoEgreso}
                  onChange={(e) => setConceptoEgreso(e.target.value.toUpperCase())}
                  placeholder="Descripción del gasto"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={categoriaEgreso} onChange={(e) => setCategoriaEgreso(e.target.value)} className="form-select">
                  <option value="COMBUSTIBLE">Combustible</option>
                  <option value="MANTENIMIENTO_VEHICULO">Mantenimiento Vehículo</option>
                  <option value="SERVICIOS_PUBLICOS">Servicios Públicos</option>
                  <option value="NOMINA">Nómina</option>
                  <option value="PAPELERIA">Papelería</option>
                  <option value="ASEO">Aseo</option>
                  <option value="ALQUILER">Alquiler</option>
                  <option value="OTROS">Otros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  value={montoEgreso}
                  onChange={(e) => setMontoEgreso(e.target.value)}
                  placeholder="0"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Método de Pago</label>
                <select value={metodoEgreso} onChange={(e) => setMetodoEgreso(e.target.value)} className="form-select">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEgreso(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleRegistrarEgreso} className="btn-primary">
                Registrar Egreso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
