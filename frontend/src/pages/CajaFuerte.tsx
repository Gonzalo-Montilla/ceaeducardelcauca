import { useEffect, useMemo, useState } from 'react';
import { Banknote, CreditCard, Wallet, Download } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useUIFeedback } from '../contexts/UIFeedbackContext';
import { cajaFuerteAPI } from '../services/api';
import '../styles/CajaFuerte.css';

const DENOMINACIONES = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50];
const METODOS = [
  'EFECTIVO',
  'NEQUI',
  'DAVIPLATA',
  'TRANSFERENCIA_BANCARIA',
];
const CATEGORIAS_EGRESO = [
  'ARRENDAMIENTO',
  'NOMINA',
  'SERVICIOS_PUBLICOS',
  'PAPELERIA',
  'MANTENIMIENTO',
  'COMBUSTIBLE',
  'IMPUESTOS',
  'PUBLICIDAD',
  'OTROS',
];
const CATEGORIAS_INGRESO = [
  'TRASLADO_CAJA',
  'AJUSTE',
  'INGRESO_EXTRAORDINARIO',
  'OTROS',
];

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const formatMoneyInput = (value: string | number) => {
  const digits = onlyDigits(String(value ?? ''));
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO');
};

export default function CajaFuerte() {
  const { confirm, showToast } = useUIFeedback();
  const [resumen, setResumen] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [inventarioTotal, setInventarioTotal] = useState(0);
  const [movDenoms, setMovDenoms] = useState(
    DENOMINACIONES.map((denominacion) => ({ denominacion, cantidad: 0 }))
  );
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    metodo_pago: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [form, setForm] = useState({
    tipo: 'INGRESO',
    metodo_pago: 'EFECTIVO',
    concepto: '',
    monto: '',
    observaciones: '',
  });
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('OTROS');
  const [categoriaCustom, setCategoriaCustom] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const totalMovimiento = useMemo(
    () => movDenoms.reduce((acc, item) => acc + item.denominacion * item.cantidad, 0),
    [movDenoms]
  );
  const montoObjetivo = useMemo(() => {
    const parsed = Number(form.monto);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [form.monto]);
  const diferenciaCuadre = useMemo(() => totalMovimiento - montoObjetivo, [totalMovimiento, montoObjetivo]);
  const estadoCuadre = useMemo(() => {
    if (montoObjetivo <= 0) {
      return {
        clase: 'cuadre-pendiente',
        texto: 'Pendiente por cuadrar',
      };
    }
    if (diferenciaCuadre === 0) {
      return {
        clase: 'cuadre-ok',
        texto: 'Cuadra: $0',
      };
    }
    if (diferenciaCuadre < 0) {
      return {
        clase: 'cuadre-faltante',
        texto: `Faltan: $${Math.abs(diferenciaCuadre).toLocaleString('es-CO')}`,
      };
    }
    return {
      clase: 'cuadre-sobrante',
      texto: `Sobra: $${Math.abs(diferenciaCuadre).toLocaleString('es-CO')}`,
    };
  }, [montoObjetivo, diferenciaCuadre]);
  const inventarioDetalle = useMemo(() => {
    const cantidades = new Map(
      inventario.map((item) => [Number(item.denominacion), Number(item.cantidad || 0)])
    );
    return DENOMINACIONES.map((denominacion) => {
      const cantidad = Number(cantidades.get(denominacion) || 0);
      const subtotal = denominacion * cantidad;
      return {
        denominacion,
        cantidad,
        subtotal,
      };
    });
  }, [inventario]);
  const inventarioBilletes = useMemo(
    () => inventarioDetalle.filter((item) => item.denominacion >= 2000),
    [inventarioDetalle]
  );
  const inventarioMonedas = useMemo(
    () => inventarioDetalle.filter((item) => item.denominacion < 2000),
    [inventarioDetalle]
  );
  const totalBilletes = useMemo(
    () => inventarioBilletes.reduce((acc, item) => acc + item.subtotal, 0),
    [inventarioBilletes]
  );
  const totalMonedas = useMemo(
    () => inventarioMonedas.reduce((acc, item) => acc + item.subtotal, 0),
    [inventarioMonedas]
  );
  const topDenominacionesInventario = useMemo(() => {
    const top = inventarioDetalle
      .filter((item) => item.subtotal > 0)
      .sort((a, b) => b.subtotal - a.subtotal)
      .slice(0, 3)
      .map((item) => item.denominacion);
    return new Set(top);
  }, [inventarioDetalle]);
  const saldoDigitalOperativo = Number(resumen?.saldo_nequi || 0) +
    Number(resumen?.saldo_daviplata || 0) +
    Number(resumen?.saldo_transferencia_bancaria || 0);
  const saldoTotalOperativo = Number(resumen?.saldo_efectivo || 0) + saldoDigitalOperativo;
  const getSaldoDisponiblePorMetodo = (metodo: string) => {
    const map: Record<string, number> = {
      EFECTIVO: Number(resumen?.saldo_efectivo || 0),
      NEQUI: Number(resumen?.saldo_nequi || 0),
      DAVIPLATA: Number(resumen?.saldo_daviplata || 0),
      TRANSFERENCIA_BANCARIA: Number(resumen?.saldo_transferencia_bancaria || 0),
      TARJETA_DEBITO: Number(resumen?.saldo_tarjeta_debito || 0),
      TARJETA_CREDITO: Number(resumen?.saldo_tarjeta_credito || 0),
      CREDISMART: Number(resumen?.saldo_credismart || 0),
      SISTECREDITO: Number(resumen?.saldo_sistecredito || 0),
    };
    return map[metodo] ?? 0;
  };
  const montoMovimientoValor = Number(form.monto) || 0;
  const saldoDisponibleMetodo = getSaldoDisponiblePorMetodo(form.metodo_pago);
  const egresoExcedeDisponible =
    form.tipo === 'EGRESO' &&
    montoMovimientoValor > 0 &&
    montoMovimientoValor > saldoDisponibleMetodo;

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

  const exportMovimientosCSV = () => {
    if (!movimientos.length) return;
    const rows = [
      ['ID', 'Fecha', 'Tipo', 'Método', 'Concepto', 'Categoría', 'Monto', 'Usuario', 'Observaciones'],
      ...movimientos.map((m) => [
        m.id,
        new Date(m.fecha).toLocaleString('es-CO'),
        m.tipo,
        m.metodo_pago,
        m.concepto,
        m.categoria || '',
        m.monto,
        m.usuario_nombre || '',
        m.observaciones || ''
      ])
    ];
    downloadCSV(`caja_fuerte_movimientos_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [res, inv, movs] = await Promise.all([
        cajaFuerteAPI.getResumen(),
        cajaFuerteAPI.getInventario(),
        cajaFuerteAPI.getMovimientos(),
      ]);
      setResumen(res);
      setInventario(inv.items || []);
      setInventarioTotal(Number(inv.total_efectivo || 0));
      setMovimientos(movs || []);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const handleBuscar = async () => {
    setCargando(true);
    try {
      const movs = await cajaFuerteAPI.getMovimientos({
        tipo: filtros.tipo || undefined,
        metodo_pago: filtros.metodo_pago || undefined,
        fecha_inicio: filtros.fecha_inicio || undefined,
        fecha_fin: filtros.fecha_fin || undefined,
      });
      setMovimientos(movs || []);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarMovimiento = async () => {
    if (!form.concepto || !form.monto) return;
    if (form.tipo === 'EGRESO' && Number(form.monto) > getSaldoDisponiblePorMetodo(form.metodo_pago)) {
      showToast(
        `Saldo insuficiente en ${form.metodo_pago}. Disponible: $${getSaldoDisponiblePorMetodo(form.metodo_pago).toLocaleString('es-CO')}`,
        'error'
      );
      return;
    }
    try {
      if (editandoId) {
        const categoriaFinal = categoriaSeleccionada === 'OTROS' ? categoriaCustom : categoriaSeleccionada;
        const payloadUpdate: any = {
          metodo_pago: form.metodo_pago,
          concepto: form.concepto,
          categoria: categoriaFinal || undefined,
          monto: Number(form.monto),
          observaciones: form.observaciones || undefined,
        };
        if (form.metodo_pago === 'EFECTIVO') {
          if (totalMovimiento !== Number(form.monto)) {
            showToast('Las denominaciones no cuadran con el monto del movimiento.', 'error');
            return;
          }
          payloadUpdate.inventario_items = movDenoms.map((i) => ({
            denominacion: i.denominacion,
            cantidad: Number(i.cantidad),
          }));
        }
        await cajaFuerteAPI.actualizarMovimiento(editandoId, payloadUpdate);
        setEditandoId(null);
      } else {
        const categoriaFinal = categoriaSeleccionada === 'OTROS' ? categoriaCustom : categoriaSeleccionada;
        const payload: any = {
          ...form,
          monto: Number(form.monto),
          categoria: categoriaFinal || undefined,
          observaciones: form.observaciones || undefined,
        };
        if (form.metodo_pago === 'EFECTIVO') {
          if (totalMovimiento !== Number(form.monto)) {
            showToast('Las denominaciones no cuadran con el monto del movimiento.', 'error');
            return;
          }
          payload.inventario_items = movDenoms.map((i) => ({
            denominacion: i.denominacion,
            cantidad: Number(i.cantidad),
          }));
        }
        await cajaFuerteAPI.crearMovimiento(payload);
      }
      showToast(editandoId ? 'Movimiento actualizado correctamente' : 'Movimiento registrado correctamente', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Error al registrar el movimiento', 'error');
      return;
    }
    setForm({
      tipo: 'INGRESO',
      metodo_pago: 'EFECTIVO',
      concepto: '',
      monto: '',
      observaciones: '',
    });
    setCategoriaSeleccionada('OTROS');
    setCategoriaCustom('');
    setMovDenoms(DENOMINACIONES.map((denominacion) => ({ denominacion, cantidad: 0 })));
    await cargarTodo();
  };

  const handleEditar = (mov: any) => {
    setEditandoId(mov.id);
    setForm({
      tipo: mov.tipo,
      metodo_pago: mov.metodo_pago,
      concepto: mov.concepto,
      monto: onlyDigits(String(mov.monto ?? '')),
      observaciones: mov.observaciones || '',
    });
    if (mov.categoria) {
      const categorias = mov.tipo === 'EGRESO' ? CATEGORIAS_EGRESO : CATEGORIAS_INGRESO;
      if (categorias.includes(mov.categoria)) {
        setCategoriaSeleccionada(mov.categoria);
        setCategoriaCustom('');
      } else {
        setCategoriaSeleccionada('OTROS');
        setCategoriaCustom(mov.categoria);
      }
    } else {
      setCategoriaSeleccionada('OTROS');
      setCategoriaCustom('');
    }
    if (mov.metodo_pago === 'EFECTIVO' && Array.isArray(mov.inventario_detalle)) {
      const map = new Map(mov.inventario_detalle.map((i: any) => [i.denominacion, i.cantidad]));
      setMovDenoms(DENOMINACIONES.map((denominacion) => ({
        denominacion,
        cantidad: Number(map.get(denominacion) || 0),
      })));
    } else {
      setMovDenoms(DENOMINACIONES.map((denominacion) => ({ denominacion, cantidad: 0 })));
    }
  };

  const handleEliminar = async (id: number) => {
    const ok = await confirm({
      title: 'Eliminar movimiento',
      message: '¿Eliminar este movimiento?',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await cajaFuerteAPI.eliminarMovimiento(id);
      await cargarTodo();
      showToast('Movimiento eliminado correctamente', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Error al eliminar el movimiento', 'error');
    }
  };

  const handleMovDenomChange = (denom: number, cantidad: number) => {
    const safeCantidad = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 0;
    setMovDenoms((prev) =>
      prev.map((item) => (item.denominacion === denom ? { ...item, cantidad: safeCantidad } : item))
    );
  };

  const handleRecibo = async (id: number) => {
    try {
      const blob = await cajaFuerteAPI.getMovimientoReciboPdf(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recibo_egreso_caja_fuerte_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo generar el recibo', 'error');
    }
  };

  return (
    <div className="caja-fuerte-container">
      <PageHeader
        title="Caja Fuerte"
        subtitle="Control de fondos y movimientos"
        icon={<Wallet size={20} />}
        actions={
          <>
            <button className="btn-nuevo" onClick={cargarTodo} disabled={cargando}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button className="btn-nuevo" onClick={exportMovimientosCSV} disabled={!movimientos.length}>
              <Download size={16} /> Exportar CSV
            </button>
          </>
        }
      />

      <div className="caja-fuerte-resumen">
        <div className="resumen-card">
          <div className="resumen-header">
            <div className="resumen-icon success"><Banknote size={18} /></div>
            <h3>Saldo Efectivo</h3>
          </div>
          <div className="resumen-valor">${Number(resumen?.saldo_efectivo || 0).toLocaleString()}</div>
        </div>
        <div className="resumen-card">
          <div className="resumen-header">
            <div className="resumen-icon primary"><CreditCard size={18} /></div>
            <h3>Saldo Digital</h3>
          </div>
          <div className="resumen-valor">${saldoDigitalOperativo.toLocaleString()}</div>
          <div className="resumen-subdetalle">
            <div className="detalle-row">
              <span>Nequi</span>
              <strong>${Number(resumen?.saldo_nequi || 0).toLocaleString()}</strong>
            </div>
            <div className="detalle-row">
              <span>Daviplata</span>
              <strong>${Number(resumen?.saldo_daviplata || 0).toLocaleString()}</strong>
            </div>
            <div className="detalle-row">
              <span>Transferencia Bancolombia</span>
              <strong>${Number(resumen?.saldo_transferencia_bancaria || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
        <div className="resumen-card">
          <div className="resumen-header">
            <div className="resumen-icon warning"><Wallet size={18} /></div>
            <h3>Saldo Operativo</h3>
          </div>
          <div className="resumen-valor">${saldoTotalOperativo.toLocaleString()}</div>
        </div>
      </div>

      <div className="caja-fuerte-grid">
        <div className="caja-fuerte-section movimiento-section">
          <div className="section-head">
            <div>
              <h2>Registrar movimiento</h2>
              <p className="section-subtitle">Diligencia los campos y valida el total antes de registrar.</p>
            </div>
            <div className="registro-chips">
              <span className={`registro-chip ${form.tipo === 'INGRESO' ? 'chip-success' : 'chip-danger'}`}>
                {form.tipo}
              </span>
              <span className="registro-chip chip-neutral">{form.metodo_pago.replaceAll('_', ' ')}</span>
              <span className="registro-chip chip-primary">
                Total: ${Number(totalMovimiento).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
          <div className="form-grid">
            <label className="field-control">
              <span>Tipo de movimiento</span>
              <select
                value={form.tipo}
                onChange={(e) => {
                  const nextTipo = e.target.value;
                  setForm({ ...form, tipo: nextTipo });
                  setCategoriaSeleccionada('OTROS');
                  setCategoriaCustom('');
                }}
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </label>
            <label className="field-control">
              <span>Método de pago</span>
              <select value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}>
                {METODOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span>Concepto</span>
              <input
                type="text"
                placeholder="Concepto del movimiento"
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              />
            </label>
            <label className="field-control">
              <span>Categoría</span>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              >
                {(form.tipo === 'EGRESO' ? CATEGORIAS_EGRESO : CATEGORIAS_INGRESO).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            {categoriaSeleccionada === 'OTROS' && (
              <label className="field-control">
                <span>Especifica categoría</span>
                <input
                  type="text"
                  placeholder="Ejemplo: ajuste inventario"
                  value={categoriaCustom}
                  onChange={(e) => setCategoriaCustom(e.target.value)}
                />
              </label>
            )}
            <label className="field-control">
              <span>Monto</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatMoneyInput(form.monto)}
                onChange={(e) => setForm({ ...form, monto: onlyDigits(e.target.value) })}
              />
            </label>
            <label className="field-control field-span-2">
              <span>Observaciones</span>
              <input
                type="text"
                placeholder="Observaciones adicionales (opcional)"
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              />
            </label>
          </div>
          {egresoExcedeDisponible && (
            <p className="movimiento-warning">
              El egreso supera el disponible en {form.metodo_pago.replaceAll('_', ' ')} (
              ${saldoDisponibleMetodo.toLocaleString('es-CO')}).
            </p>
          )}
          {form.metodo_pago === 'EFECTIVO' && (
            <div className="mov-denoms">
              <div className="subsection-head">
                <h3>Denominaciones del movimiento</h3>
                <div className="subsection-chips">
                  <strong className="inventario-total-chip">Total: ${Number(totalMovimiento).toLocaleString('es-CO')}</strong>
                  <span className={`cuadre-chip ${estadoCuadre.clase}`}>{estadoCuadre.texto}</span>
                </div>
              </div>
              <div className="inventario-grid">
                {DENOMINACIONES.map((denom) => {
                  const item = movDenoms.find((i) => i.denominacion === denom) || { cantidad: 0 };
                  return (
                    <div className="inventario-item" key={denom}>
                      <span className="denom">${denom.toLocaleString()}</span>
                      <div className="denom-control">
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={item.cantidad === 0 ? '' : item.cantidad}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => handleMovDenomChange(denom, e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="section-actions">
            {editandoId && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditandoId(null);
                  setForm({ tipo: 'INGRESO', metodo_pago: 'EFECTIVO', concepto: '', monto: '', observaciones: '' });
                  setCategoriaSeleccionada('OTROS');
                  setCategoriaCustom('');
                  setMovDenoms(DENOMINACIONES.map((denominacion) => ({ denominacion, cantidad: 0 })));
                }}
              >
                Cancelar edición
              </button>
            )}
            <button className="btn-primary" onClick={handleGuardarMovimiento} disabled={egresoExcedeDisponible}>
              {editandoId ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </div>
        </div>
        <aside className="caja-fuerte-section inventario-section">
          <div className="inventario-actual-panel">
            <div className="subsection-head">
              <h3>Inventario actual (efectivo)</h3>
              <strong className="inventario-total-chip">
                Total efectivo: ${Number(inventarioTotal).toLocaleString('es-CO')}
              </strong>
            </div>
            <div className="inventario-grupo">
              <div className="inventario-grupo-head">
                <h4>Billetes</h4>
                <span>${totalBilletes.toLocaleString('es-CO')}</span>
              </div>
              <div className="inventario-grid">
                {inventarioBilletes.map((item) => (
                  <div
                    className={`inventario-item readonly ${topDenominacionesInventario.has(item.denominacion) ? 'top-impact' : ''}`}
                    key={item.denominacion}
                  >
                    <div className="inventario-item-main">
                      <span className="denom">${item.denominacion.toLocaleString()}</span>
                      <span className="cantidad">x {item.cantidad}</span>
                    </div>
                    <span className="inventario-subtotal">
                      = ${item.subtotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="inventario-grupo">
              <div className="inventario-grupo-head">
                <h4>Monedas</h4>
                <span>${totalMonedas.toLocaleString('es-CO')}</span>
              </div>
              <div className="inventario-grid">
                {inventarioMonedas.map((item) => (
                  <div
                    className={`inventario-item readonly ${topDenominacionesInventario.has(item.denominacion) ? 'top-impact' : ''}`}
                    key={item.denominacion}
                  >
                    <div className="inventario-item-main">
                      <span className="denom">${item.denominacion.toLocaleString()}</span>
                      <span className="cantidad">x {item.cantidad}</span>
                    </div>
                    <span className="inventario-subtotal">
                      = ${item.subtotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

      </div>

      <div className="caja-fuerte-section">
        <h2>Movimientos</h2>
        <div className="filtros">
          <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="INGRESO">Ingresos</option>
            <option value="EGRESO">Egresos</option>
          </select>
          <select value={filtros.metodo_pago} onChange={(e) => setFiltros({ ...filtros, metodo_pago: e.target.value })}>
            <option value="">Todos los métodos</option>
            {METODOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input type="date" value={filtros.fecha_inicio} onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })} />
          <input type="date" value={filtros.fecha_fin} onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })} />
          <button className="btn-secondary" onClick={handleBuscar}>Filtrar</button>
        </div>

        <div className="tabla-movimientos">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Método</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov) => (
                <tr key={mov.id}>
                  <td>{new Date(mov.fecha).toLocaleString()}</td>
                  <td>{mov.tipo}</td>
                  <td>{mov.metodo_pago}</td>
                  <td>{mov.concepto}</td>
                  <td>${Number(mov.monto).toLocaleString()}</td>
                  <td>{mov.usuario_nombre}</td>
                  <td className="acciones">
                    {mov.tipo === 'EGRESO' && (
                      <button className="btn-secondary" onClick={() => handleRecibo(mov.id)}>
                        Recibo
                      </button>
                    )}
                    {!mov.caja_id && (
                      <>
                        <button className="btn-secondary" onClick={() => handleEditar(mov)}>Editar</button>
                        <button className="btn-danger" onClick={() => handleEliminar(mov.id)}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr>
                  <td colSpan={7} className="no-data">Sin movimientos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
