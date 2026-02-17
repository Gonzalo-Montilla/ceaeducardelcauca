import { useState, useEffect } from 'react';
import { Search, DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus, X, ChevronDown, Download } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
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
  // Transferencias separadas
  total_nequi: number;
  total_daviplata: number;
  total_transferencia_bancaria: number;
  // Tarjetas separadas
  total_tarjeta_debito: number;
  total_tarjeta_credito: number;
  // Créditos
  total_credismart: number;
  total_sistecredito: number;
  num_pagos: number;
  num_egresos: number;
}

interface EstudianteFinanciero {
  id: number;
  nombre_completo: string;
  cedula: string;
  tipo_documento?: string;
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
  
  // Estados para secciones colapsables (cerradas por defecto)
  const [mostrarCajaFisica, setMostrarCajaFisica] = useState(false);
  const [mostrarMetodosDigitales, setMostrarMetodosDigitales] = useState(false);
  const [mostrarCreditos, setMostrarCreditos] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  
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
  
  // Estados para cierre de caja
  const [showCerrarCaja, setShowCerrarCaja] = useState(false);
  const [efectivoFisico, setEfectivoFisico] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [cerrandoCaja, setCerrandoCaja] = useState(false);

  const soloDigitos = (value: string) => value.replace(/\D/g, '');
  const formatDocumentoBusqueda = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 20);
  };
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

  const exportCajaCSV = () => {
    if (!cajaActual) return;
    const rows = [
      ['Caja y Pagos'],
      ['ID Caja', cajaActual.id],
      ['Fecha Apertura', new Date(cajaActual.fecha_apertura).toLocaleString('es-CO')],
      ['Usuario Apertura', cajaActual.usuario_apertura],
      [],
      ['Totales'],
      ['Saldo Inicial', cajaActual.saldo_inicial],
      ['Ingresos Totales', cajaActual.total_ingresos],
      ['Egresos Totales', cajaActual.total_egresos],
      ['Saldo Efectivo en Caja', cajaActual.saldo_efectivo_caja],
      [],
      ['Ingresos por método'],
      ['Efectivo', cajaActual.total_ingresos_efectivo],
      ['Nequi', cajaActual.total_nequi],
      ['Daviplata', cajaActual.total_daviplata],
      ['Transferencia', cajaActual.total_transferencia_bancaria],
      ['Tarjeta Débito', cajaActual.total_tarjeta_debito],
      ['Tarjeta Crédito', cajaActual.total_tarjeta_credito],
      ['Credismart', cajaActual.total_credismart],
      ['Sistecrédito', cajaActual.total_sistecredito],
      [],
      ['Egresos por método'],
      ['Efectivo', cajaActual.total_egresos_efectivo],
      ['Transferencia', cajaActual.total_egresos_transferencia],
      ['Tarjeta', cajaActual.total_egresos_tarjeta]
    ];
    downloadCSV(`caja_${cajaActual.id}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };
  
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
      if (!saldoInicial || parseFloat(saldoInicial) < 0) {
        alert('El saldo inicial debe ser mayor o igual a cero');
        return;
      }
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
    const cedulaLimpia = formatDocumentoBusqueda(cedula);
    if (!cedulaLimpia) {
      alert('Ingrese el documento del estudiante');
      return;
    }
    
    try {
      setBuscando(true);
      const response = await cajaAPI.buscarEstudiante(cedulaLimpia);
      setEstudiante(response);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Estudiante no encontrado');
      setEstudiante(null);
    } finally {
      setBuscando(false);
    }
  };
  
  const handleRegistrarPago = async () => {
    if (!estudiante) {
      alert('Debe buscar un estudiante primero');
      return;
    }
    
    // Calcular monto total
    let montoTotal: number;
    if (esPagoMixto) {
      // Validar que haya al menos 2 métodos
      const detallesConMonto = detallesPago.filter(d => parseFloat(d.monto) > 0);
      if (detallesConMonto.length < 2) {
        alert('Pago mixto debe tener al menos 2 métodos con monto');
        return;
      }
      montoTotal = detallesPago.reduce((sum, d) => sum + (parseFloat(d.monto) || 0), 0);
    } else {
      if (!montoPago || isNaN(parseFloat(montoPago))) {
        alert('Ingrese el monto a pagar');
        return;
      }
      montoTotal = parseFloat(montoPago);
    }
    
    if (montoTotal <= 0) {
      alert('El monto debe ser mayor a cero');
      return;
    }
    
    if (estudiante.saldo_pendiente && montoTotal > estudiante.saldo_pendiente) {
      alert(`El monto (${formatCurrency(montoTotal)}) excede el saldo pendiente (${formatCurrency(estudiante.saldo_pendiente)})`);
      return;
    }
    
    try {
      setRegistrandoPago(true);
      
      let pagoResponse: any = null;
      if (esPagoMixto) {
        // Pago mixto
        pagoResponse = await cajaAPI.registrarPago({
          estudiante_id: estudiante.id,
          monto: montoTotal,
          concepto: 'Abono al curso',
          es_pago_mixto: true,
          detalles_pago: detallesPago
            .filter(d => parseFloat(d.monto) > 0)
            .map(d => ({
              metodo_pago: d.metodo,
              monto: parseFloat(d.monto)
            }))
        });
      } else {
        // Pago simple
        pagoResponse = await cajaAPI.registrarPago({
          estudiante_id: estudiante.id,
          monto: montoTotal,
          metodo_pago: detallesPago[0].metodo,
          concepto: 'Abono al curso',
          es_pago_mixto: false
        });
      }
      
      alert('Pago registrado exitosamente');
      if (pagoResponse?.id) {
        const abrir = window.confirm('¿Desea abrir el recibo PDF del pago?');
        if (abrir) {
          const blob = await cajaAPI.getPagoReciboPdf(pagoResponse.id);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
      }
      setMontoPago('');
      setEsPagoMixto(false);
      setDetallesPago([{metodo: 'EFECTIVO', monto: ''}]);
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
    if (parseFloat(montoEgreso) <= 0) {
      alert('El monto debe ser mayor a cero');
      return;
    }
    
    try {
      const egresoResponse = await cajaAPI.registrarEgreso({
        concepto: conceptoEgreso,
        categoria: categoriaEgreso,
        monto: parseFloat(montoEgreso),
        metodo_pago: metodoEgreso,
        numero_factura: null,
        observaciones: null
      });
      
      alert('Egreso registrado exitosamente');
      if (egresoResponse?.id) {
        const abrir = window.confirm('¿Desea abrir el recibo PDF del egreso?');
        if (abrir) {
          const blob = await cajaAPI.getEgresoReciboPdf(egresoResponse.id);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
      }
      setShowEgreso(false);
      setConceptoEgreso('');
      setMontoEgreso('');
      await cargarCajaActual();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al registrar egreso');
    }
  };
  
  const handleCerrarCaja = async () => {
    if (!efectivoFisico) {
      alert('Ingrese el efectivo físico contado');
      return;
    }
    
    if (!cajaActual) return;
    
    const confirmacion = window.confirm(
      '¿Está seguro de cerrar la caja? Esta acción no se puede deshacer.'
    );
    
    if (!confirmacion) return;
    
    try {
      setCerrandoCaja(true);
      await cajaAPI.cerrarCaja(cajaActual.id, {
        efectivo_fisico: parseFloat(efectivoFisico),
        observaciones_cierre: observacionesCierre || null
      });
      
      alert('Caja cerrada exitosamente');
      const abrir = window.confirm('¿Desea abrir el soporte PDF de cierre de caja?');
      if (abrir) {
        const blob = await cajaAPI.getCierrePdf(cajaActual.id);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      setShowCerrarCaja(false);
      setEfectivoFisico('');
      setObservacionesCierre('');
      await cargarCajaActual();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al cerrar caja');
    } finally {
      setCerrandoCaja(false);
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
      <div className="modal-overlay">
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
              min="0"
              step="100"
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
      <PageHeader
        title="Caja y Pagos"
        subtitle="Registro de ingresos, egresos y pagos"
        icon={<DollarSign size={20} />}
        actions={
          <button className="btn-nuevo" onClick={exportCajaCSV} disabled={!cajaActual}>
            <Download size={16} /> Exportar CSV
          </button>
        }
      />
      
      {/* =========================== CAJA FÍSICA =========================== */}
      <div className="seccion-caja-fisica">
        <h3 
          className="section-title-main collapsable" 
          onClick={() => setMostrarCajaFisica(!mostrarCajaFisica)}
        >
          💵 Caja Física (Dinero Real en Mano)
          <ChevronDown 
            size={24} 
            className={`chevron-icon ${mostrarCajaFisica ? '' : 'rotated'}`}
          />
        </h3>
        
        {mostrarCajaFisica && (
        <div className="caja-resumen-grid-main">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e0f2fe' }}>
              <DollarSign size={24} color="#0284c7" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Saldo Inicial</p>
              <p className="stat-value">{formatCurrency(cajaActual?.saldo_inicial)}</p>
              <p className="stat-sublabel">Base de apertura</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}>
              <TrendingUp size={24} color="#16a34a" />
            </div>
            <div className="stat-content">
              <p className="stat-label">+ Efectivo Recibido</p>
              <p className="stat-value success">{formatCurrency(cajaActual?.total_ingresos_efectivo)}</p>
              <p className="stat-sublabel">Pagos en efectivo</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fee2e2' }}>
              <TrendingDown size={24} color="#dc2626" />
            </div>
            <div className="stat-content">
              <p className="stat-label">- Egresos en Efectivo</p>
              <p className="stat-value danger">{formatCurrency(cajaActual?.total_egresos_efectivo)}</p>
              <p className="stat-sublabel">{cajaActual?.num_egresos || 0} gastos</p>
            </div>
          </div>
          
          <div className="stat-card highlight">
            <div className="stat-content">
              <p className="stat-label">=EFECTIVO EN CAJA</p>
              <p className="stat-value-large">{formatCurrency(cajaActual?.saldo_efectivo_caja)}</p>
              <p className="stat-sublabel">Dinero físico actual</p>
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* =========================== MÉTODOS DIGITALES (FUERA DE CAJA) =========================== */}
      <div className="metodos-digitales-section">
        <h3 
          className="section-title-main collapsable" 
          onClick={() => setMostrarMetodosDigitales(!mostrarMetodosDigitales)}
        >
          💳 Métodos Digitales (No en Caja Física)
          <ChevronDown 
            size={24} 
            className={`chevron-icon ${mostrarMetodosDigitales ? '' : 'rotated'}`}
          />
        </h3>
        
        {mostrarMetodosDigitales && (
        <>
        <p className="section-subtitle-white">Dinero recibido pero NO está en caja física - Solo para control y registro</p>
        
        {/* Transferencias */}
        <div className="metodo-grupo">
          <h4 className="metodo-grupo-titulo">Transferencias Electrónicas</h4>
          <div className="metodos-grid">
            <div className="metodo-card transferencia">
              <div className="metodo-header">
                <span className="metodo-icon">📱</span>
                <span className="metodo-nombre">Nequi</span>
              </div>
              <p className="metodo-monto">{formatCurrency(cajaActual?.total_nequi || 0)}</p>
            </div>
            
            <div className="metodo-card transferencia">
              <div className="metodo-header">
                <span className="metodo-icon">📱</span>
                <span className="metodo-nombre">Daviplata</span>
              </div>
              <p className="metodo-monto">{formatCurrency(cajaActual?.total_daviplata || 0)}</p>
            </div>
            
            <div className="metodo-card transferencia">
              <div className="metodo-header">
                <span className="metodo-icon">🏦</span>
                <span className="metodo-nombre">Transf. Bancaria</span>
              </div>
              <p className="metodo-monto">{formatCurrency(cajaActual?.total_transferencia_bancaria || 0)}</p>
            </div>
            
            <div className="metodo-card-total transferencia">
              <p className="metodo-total-label">TOTAL TRANSFERENCIAS</p>
              <p className="metodo-total-monto">{formatCurrency(cajaActual?.total_ingresos_transferencia)}</p>
            </div>
          </div>
        </div>
        
        {/* Tarjetas */}
        <div className="metodo-grupo">
          <h4 className="metodo-grupo-titulo">Tarjetas</h4>
          <div className="metodos-grid">
            <div className="metodo-card tarjetas">
              <div className="metodo-header">
                <span className="metodo-icon">💳</span>
                <span className="metodo-nombre">Débito</span>
              </div>
              <p className="metodo-monto">{formatCurrency(cajaActual?.total_tarjeta_debito || 0)}</p>
            </div>
            
            <div className="metodo-card tarjetas">
              <div className="metodo-header">
                <span className="metodo-icon">💳</span>
                <span className="metodo-nombre">Crédito</span>
              </div>
              <p className="metodo-monto">{formatCurrency(cajaActual?.total_tarjeta_credito || 0)}</p>
            </div>
            
            <div className="metodo-card-total tarjetas">
              <p className="metodo-total-label">TOTAL TARJETAS</p>
              <p className="metodo-total-monto">{formatCurrency(cajaActual?.total_ingresos_tarjeta)}</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
      
      {/* =========================== CRÉDITOS FINANCIERAS (FUERA DE CAJA) =========================== */}
      <div className="creditos-section">
        <h3 
          className="section-title-main collapsable" 
          onClick={() => setMostrarCreditos(!mostrarCreditos)}
        >
          🏦 Créditos Financieras (No en Caja)
          <ChevronDown 
            size={24} 
            className={`chevron-icon ${mostrarCreditos ? '' : 'rotated'}`}
          />
        </h3>
        
        {mostrarCreditos && (
        <>
        <p className="section-subtitle">Pagos diferidos - La financiera pagará después. NO entra a caja física.</p>
        <div className="metodos-grid">
          <div className="metodo-card credismart">
            <div className="metodo-header">
              <span className="metodo-icon">💵</span>
              <span className="metodo-nombre">CrediSmart</span>
            </div>
            <p className="metodo-monto">{formatCurrency(cajaActual?.total_credismart)}</p>
            <p className="metodo-detalle">Pendiente de pago por financiera</p>
          </div>
          
          <div className="metodo-card sistecredito">
            <div className="metodo-header">
              <span className="metodo-icon">💵</span>
              <span className="metodo-nombre">Sistecredito</span>
            </div>
            <p className="metodo-monto">{formatCurrency(cajaActual?.total_sistecredito)}</p>
            <p className="metodo-detalle">Pendiente de pago por financiera</p>
          </div>
        </div>
        </>
        )}
      </div>
      
      {/* =========================== RESUMEN GENERAL DEL DÍA =========================== */}
      <div className="resumen-general">
        <h3 
          className="section-title-main collapsable" 
          onClick={() => setMostrarResumen(!mostrarResumen)}
        >
          📊 Resumen General del Día
          <ChevronDown 
            size={24} 
            className={`chevron-icon ${mostrarResumen ? '' : 'rotated'}`}
          />
        </h3>
        
        {mostrarResumen && (
        <div className="stats-row">
          <div className="stat-summary efectivo">
            <div className="stat-summary-icon">💵</div>
            <div className="stat-summary-content">
              <span className="stat-summary-label">Efectivo en Caja</span>
              <span className="stat-summary-value success">{formatCurrency(cajaActual?.saldo_efectivo_caja)}</span>
              <span className="stat-summary-detalle">Dinero físico que debe haber al contar</span>
            </div>
          </div>
          
          <div className="stat-summary digital">
            <div className="stat-summary-icon">💳</div>
            <div className="stat-summary-content">
              <span className="stat-summary-label">Métodos Digitales</span>
              <span className="stat-summary-value">{formatCurrency(
                Number(cajaActual?.total_ingresos_transferencia || 0) + 
                Number(cajaActual?.total_ingresos_tarjeta || 0)
              )}</span>
              <span className="stat-summary-detalle">Transferencias + Tarjetas (no en caja)</span>
            </div>
          </div>
          
          <div className="stat-summary creditos">
            <div className="stat-summary-icon">🏦</div>
            <div className="stat-summary-content">
              <span className="stat-summary-label">Créditos</span>
              <span className="stat-summary-value">{formatCurrency(
                Number(cajaActual?.total_credismart || 0) + 
                Number(cajaActual?.total_sistecredito || 0)
              )}</span>
              <span className="stat-summary-detalle">Por cobrar a financieras (no en caja)</span>
            </div>
          </div>
          
          <div className="stat-summary total">
            <div className="stat-summary-icon">✅</div>
            <div className="stat-summary-content">
              <span className="stat-summary-label">TOTAL RECAUDADO</span>
              <span className="stat-summary-value-large">{formatCurrency(
                Number(cajaActual?.total_ingresos_efectivo || 0) + 
                Number(cajaActual?.total_ingresos_transferencia || 0) + 
                Number(cajaActual?.total_ingresos_tarjeta || 0) + 
                Number(cajaActual?.total_credismart || 0) + 
                Number(cajaActual?.total_sistecredito || 0)
              )}</span>
              <span className="stat-summary-detalle">Todos los ingresos del día ({cajaActual?.num_pagos || 0} pagos)</span>
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Acciones rápidas */}
      <div className="actions-bar">
        <button onClick={() => setShowEgreso(true)} className="btn-action">
          <Plus size={20} />
          Registrar Egreso
        </button>
        <button onClick={() => setShowCerrarCaja(true)} className="btn-action btn-danger">
          <X size={20} />
          Cerrar Caja
        </button>
      </div>
      
      {/* Buscar y Registrar Pago */}
      <div className="main-content-grid">
        <div className="search-section">
          <h2>Registrar Pago</h2>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por documento..."
              value={cedula}
              onChange={(e) => setCedula(formatDocumentoBusqueda(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarEstudiante()}
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
                  <p>{getTipoDocumentoLabel(estudiante.tipo_documento)}: {estudiante.cedula}</p>
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
                
                {/* Toggle para pago mixto */}
                <div className="form-group">
                  <label className="checkbox-label pago-mixto-label">
                    <input
                      type="checkbox"
                      checked={esPagoMixto}
                      onChange={(e) => {
                        setEsPagoMixto(e.target.checked);
                        if (e.target.checked) {
                          setDetallesPago([{metodo: 'EFECTIVO', monto: ''}, {metodo: 'NEQUI', monto: ''}]);
                        } else {
                          setDetallesPago([{metodo: 'EFECTIVO', monto: montoPago}]);
                        }
                      }}
                    />
                    <span className="checkbox-custom" aria-hidden="true"></span>
                    <span className="checkbox-text">Pago Mixto (varios métodos)</span>
                  </label>
                </div>
                
                {!esPagoMixto ? (
                  // PAGO SIMPLE
                  <>
                    <div className="form-group">
                      <label>Monto a Pagar</label>
                      <input
                        type="number"
                        value={montoPago}
                        onChange={(e) => setMontoPago(e.target.value)}
                        placeholder="0"
                        className="form-input"
                        min="0"
                        step="100"
                      />
                    </div>
                    <div className="form-group">
                      <label>Método de Pago</label>
                      <select 
                        value={detallesPago[0].metodo} 
                        onChange={(e) => setDetallesPago([{metodo: e.target.value, monto: montoPago}])} 
                        className="form-select"
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="NEQUI">Nequi</option>
                        <option value="DAVIPLATA">Daviplata</option>
                        <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
                        <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                        <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                        <option value="CREDISMART">CrediSmart</option>
                        <option value="SISTECREDITO">Sistecredito</option>
                      </select>
                    </div>
                  </>
                ) : (
                  // PAGO MIXTO
                  <div className="pago-mixto-container">
                    {detallesPago.map((detalle, index) => (
                      <div key={index} className="detalle-pago-row">
                        <div className="form-group" style={{flex: 1}}>
                          <label>Método {index + 1}</label>
                          <select
                            value={detalle.metodo}
                            onChange={(e) => {
                              const newDetalles = [...detallesPago];
                              newDetalles[index].metodo = e.target.value;
                              setDetallesPago(newDetalles);
                            }}
                            className="form-select"
                          >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="NEQUI">Nequi</option>
                            <option value="DAVIPLATA">Daviplata</option>
                            <option value="TRANSFERENCIA_BANCARIA">Transferencia</option>
                            <option value="TARJETA_DEBITO">T. Débito</option>
                            <option value="TARJETA_CREDITO">T. Crédito</option>
                            <option value="CREDISMART">CrediSmart</option>
                            <option value="SISTECREDITO">Sistecredito</option>
                          </select>
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                          <label>Monto</label>
                          <input
                            type="number"
                            value={detalle.monto}
                            onChange={(e) => {
                              const newDetalles = [...detallesPago];
                              newDetalles[index].monto = e.target.value;
                              setDetallesPago(newDetalles);
                            }}
                            placeholder="0"
                            className="form-input"
                            min="0"
                            step="100"
                          />
                        </div>
                        {detallesPago.length > 1 && (
                          <button
                            onClick={() => {
                              setDetallesPago(detallesPago.filter((_, i) => i !== index));
                            }}
                            className="btn-icon-danger"
                            style={{marginTop: '24px'}}
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      onClick={() => {
                        setDetallesPago([...detallesPago, {metodo: 'EFECTIVO', monto: ''}]);
                      }}
                      className="btn-secondary-small"
                    >
                      <Plus size={16} />
                      Agregar Método
                    </button>
                    
                    <div className="total-mixto">
                      <strong>Total: {formatCurrency(detallesPago.reduce((sum, d) => sum + (parseFloat(d.monto) || 0), 0))}</strong>
                    </div>
                  </div>
                )}
                
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
      <div className="modal-overlay">
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
                  min="0"
                  step="100"
                />
              </div>
              <div className="form-group">
                <label>Método de Pago</label>
                <select value={metodoEgreso} onChange={(e) => setMetodoEgreso(e.target.value)} className="form-select">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                  <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
                  <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
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
      
      {/* Modal Cerrar Caja - Arqueo */}
      {showCerrarCaja && cajaActual && (
      <div className="modal-overlay">
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Arqueo y Cierre de Caja</h3>
              <button onClick={() => setShowCerrarCaja(false)} className="btn-icon">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* Resumen de Transacciones */}
              <div className="arqueo-transacciones">
                <h4>📊 Resumen de Transacciones del Día</h4>
                <div className="transacciones-grid">
                  <div className="transaccion-grupo">
                    <h5>📈 Ingresos por Método</h5>
                    <div className="transaccion-detalle">
                      <span>Efectivo:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_ingresos_efectivo)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Nequi:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_nequi || 0)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Daviplata:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_daviplata || 0)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Transferencia Bancaria:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_transferencia_bancaria || 0)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Tarjeta Débito:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_tarjeta_debito || 0)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Tarjeta Crédito:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_tarjeta_credito || 0)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>CrediSmart:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_credismart || 0)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Sistecredito:</span>
                      <strong className="success">{formatCurrency(cajaActual.total_sistecredito || 0)}</strong>
                    </div>
                    <div className="transaccion-total">
                      <span>TOTAL INGRESOS:</span>
                      <strong>{formatCurrency(
                        Number(cajaActual.total_ingresos_efectivo || 0) + 
                        Number(cajaActual.total_ingresos_transferencia || 0) + 
                        Number(cajaActual.total_ingresos_tarjeta || 0) + 
                        Number(cajaActual.total_credismart || 0) + 
                        Number(cajaActual.total_sistecredito || 0)
                      )}</strong>
                    </div>
                  </div>
                  
                  <div className="transaccion-grupo">
                    <h5>📉 Egresos por Método</h5>
                    <div className="transaccion-detalle">
                      <span>Efectivo:</span>
                      <strong className="danger">{formatCurrency(cajaActual.total_egresos_efectivo)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Transferencias:</span>
                      <strong className="danger">{formatCurrency(cajaActual.total_egresos_transferencia)}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Tarjetas:</span>
                      <strong className="danger">{formatCurrency(cajaActual.total_egresos_tarjeta)}</strong>
                    </div>
                    <div className="transaccion-total">
                      <span>TOTAL EGRESOS:</span>
                      <strong>{formatCurrency(
                        Number(cajaActual.total_egresos_efectivo || 0) + 
                        Number(cajaActual.total_egresos_transferencia || 0) + 
                        Number(cajaActual.total_egresos_tarjeta || 0)
                      )}</strong>
                    </div>
                  </div>
                  
                  <div className="transaccion-grupo resumen">
                    <h5>📝 Resumen General</h5>
                    <div className="transaccion-detalle">
                      <span>Total Pagos Recibidos:</span>
                      <strong>{cajaActual.num_pagos || 0}</strong>
                    </div>
                    <div className="transaccion-detalle">
                      <span>Total Egresos Realizados:</span>
                      <strong>{cajaActual.num_egresos || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resumen de Caja (Arqueo) */}
              <div className="arqueo-resumen">
                <h4>💵 Arqueo de Efectivo</h4>
                <div className="arqueo-grid">
                  <div className="arqueo-item">
                    <span className="arqueo-label">Saldo Inicial:</span>
                    <span className="arqueo-value">{formatCurrency(cajaActual.saldo_inicial)}</span>
                  </div>
                  <div className="arqueo-item">
                    <span className="arqueo-label">+ Efectivo Recibido:</span>
                    <span className="arqueo-value success">{formatCurrency(cajaActual.total_ingresos_efectivo)}</span>
                  </div>
                  <div className="arqueo-item">
                    <span className="arqueo-label">- Egresos en Efectivo:</span>
                    <span className="arqueo-value danger">{formatCurrency(cajaActual.total_egresos_efectivo)}</span>
                  </div>
                  <div className="arqueo-item highlight">
                    <span className="arqueo-label">=EFECTIVO TEÓRICO:</span>
                    <span className="arqueo-value-large">{formatCurrency(cajaActual.saldo_efectivo_caja)}</span>
                  </div>
                </div>
                <p className="arqueo-nota">
                  💵 El efectivo teórico es lo que DEBE haber en caja según el sistema
                </p>
              </div>
              
              {/* Conteo Físico */}
              <div className="arqueo-conteo">
                <h4>👆 Conteo Físico de Efectivo</h4>
                <div className="form-group">
                  <label>Efectivo Físico Contado *</label>
                  <input
                    type="number"
                    value={efectivoFisico}
                    onChange={(e) => setEfectivoFisico(e.target.value)}
                    placeholder="Ingrese el dinero que realmente hay en caja"
                    className="form-input form-input-large"
                    autoFocus
                    min="0"
                    step="100"
                  />
                </div>
              </div>
              
              {/* Diferencia */}
              {efectivoFisico && (
                <div className="arqueo-diferencia">
                  <div className={`diferencia-card ${
                    parseFloat(efectivoFisico) - cajaActual.saldo_efectivo_caja === 0 ? 'exacto' :
                    parseFloat(efectivoFisico) - cajaActual.saldo_efectivo_caja > 0 ? 'sobrante' : 'faltante'
                  }`}>
                    <h4>
                      {parseFloat(efectivoFisico) - cajaActual.saldo_efectivo_caja === 0 ? '✅ Caja Cuadrada' :
                       parseFloat(efectivoFisico) - cajaActual.saldo_efectivo_caja > 0 ? '🔼 Sobrante' : '🔽 Faltante'}
                    </h4>
                    <p className="diferencia-monto">
                      {formatCurrency(Math.abs(parseFloat(efectivoFisico) - cajaActual.saldo_efectivo_caja))}
                    </p>
                    <p className="diferencia-detalle">
                      Efectivo Físico: {formatCurrency(parseFloat(efectivoFisico))} | 
                      Efectivo Teórico: {formatCurrency(cajaActual.saldo_efectivo_caja)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Observaciones */}
              <div className="form-group">
                <label>Observaciones del Cierre (opcional)</label>
                <textarea
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Notas sobre el cierre, explicación de diferencias, etc."
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCerrarCaja(false)} className="btn-secondary" disabled={cerrandoCaja}>
                Cancelar
              </button>
              <button onClick={handleCerrarCaja} className="btn-danger" disabled={cerrandoCaja || !efectivoFisico}>
                {cerrandoCaja ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
