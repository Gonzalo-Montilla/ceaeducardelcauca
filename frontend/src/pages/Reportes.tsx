import { useState } from 'react';
import {
  BarChart3, DollarSign, Users, TrendingUp, AlertCircle,
  Calendar, CreditCard, PieChart, Download
} from 'lucide-react';
import { reportesAPI } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { KPICard } from '../components/reportes/KPICard';
import { FiltrosPeriodo } from '../components/reportes/FiltrosPeriodo';
import { RankingReferidos } from '../components/reportes/RankingReferidos';
import { TablaEstudiantesRegistrados } from '../components/reportes/TablaEstudiantesRegistrados';
import { TablaEstudiantesPagos } from '../components/reportes/TablaEstudiantesPagos';
import { TablaConceptosPagos } from '../components/reportes/TablaConceptosPagos';
import { TablaEgresosCaja } from '../components/reportes/TablaEgresosCaja';
import { TablaOtrosIngresos } from '../components/reportes/TablaOtrosIngresos';
import '../styles/Reportes.css';

interface DashboardData {
  kpis: any;
  grafico_ingresos: any;
  grafico_metodos_pago: any;
  grafico_estudiantes: any;
  grafico_egresos: any;
  ranking_referidos: any[];
  lista_estudiantes_registrados: any[];
  lista_estudiantes_pagos: any[];
  lista_egresos_caja: any[];
  lista_otros_movimientos: any[];
}

export const Reportes = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState<{
    fechaInicio: string;
    fechaFin: string;
    comparar: boolean;
  }>({
    fechaInicio: '',
    fechaFin: '',
    comparar: false
  });

  // El componente FiltrosPeriodo cargará automáticamente con "hoy"

  const cargarDashboard = async (fechaInicio: string, fechaFin: string, comparar: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setFiltrosAplicados({ fechaInicio, fechaFin, comparar });
      
      const params: any = { comparar_periodo_anterior: comparar };
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        params.fecha_inicio = inicio.toISOString();
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        params.fecha_fin = fin.toISOString();
      }

      const data = await reportesAPI.getDashboard(params);
      setDashboard(data);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setError('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const formatearPorcentaje = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const formatearFechaCsv = (valor: string | undefined | null) => {
    if (!valor) return '';
    const dt = new Date(valor);
    if (Number.isNaN(dt.getTime())) return String(valor);
    return dt.toLocaleString('es-CO');
  };

  const formatearPeriodoCsv = (valor: string) => {
    if (!valor) return '';
    if (valor.includes('T')) return formatearFechaCsv(valor);
    const dt = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return valor;
    return dt.toLocaleDateString('es-CO');
  };

  const safeNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  if (error) {
    return (
      <div className="reportes-container">
        <div className="error-estado">
          <AlertCircle size={48} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje de carga inicial
  if (!dashboard && !error) {
    return (
      <div className="reportes-container">
        {/* Header */}
        <div className="reportes-header">
          <div className="header-titulo">
            <BarChart3 size={32} />
            <div>
              <h1>Reportes Gerenciales</h1>
              <p>Dashboard ejecutivo con métricas clave del negocio</p>
            </div>
          </div>
        </div>
        
        {/* Filtros */}
        <FiltrosPeriodo onAplicarFiltros={cargarDashboard} cargando={loading} />
        
        {loading && (
          <div className="loading-estado">
            <div className="spinner"></div>
            <p>Cargando reportes...</p>
          </div>
        )}
      </div>
    );
  }

  const {
    kpis,
    grafico_ingresos,
    grafico_metodos_pago,
    grafico_estudiantes,
    grafico_egresos,
    ranking_referidos,
    lista_estudiantes_registrados,
    lista_estudiantes_pagos,
    lista_otros_movimientos,
    lista_egresos_caja
  } = dashboard!;

  // Preparar datos para gráfico de línea (ingresos)
  const datosIngresosLinea = (grafico_ingresos?.datos || []).map((d: any) => ({
    mes: d.fecha,
    ingresos: parseFloat(d.valor)
  }));

  // Preparar datos para gráfico de barras (métodos de pago)
  const datosMetodosPago = (grafico_metodos_pago?.datos || []).map((d: any) => ({
    nombre: d.nombre,
    valor: parseFloat(d.valor),
    porcentaje: d.porcentaje
  }));

  // Preparar datos para gráfico de dona (estudiantes)
  const datosEstudiantes = (grafico_estudiantes?.datos || []).map((d: any) => ({
    nombre: d.nombre,
    valor: parseFloat(d.valor),
    porcentaje: d.porcentaje,
    color: d.color
  }));

  // Preparar datos para gráfico de barras horizontales (egresos)
  const datosEgresos = (grafico_egresos?.datos || []).map((d: any) => ({
    categoria: d.nombre,
    monto: parseFloat(d.valor)
  }));

  const COLORES_METODOS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const escape = (value: string | number) => {
      const str = String(value ?? '');
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const buildFilename = (base: string) => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `${base}_${stamp}.csv`;
  };

  const getMetodoPagoLabel = (metodo?: string | null, esMixto?: boolean) => {
    if (esMixto) return 'MIXTO';
    if (!metodo) return 'N/A';
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      NEQUI: 'Nequi (Legado)',
      NEQUI_ESCUELA: 'Nequi Escuela',
      NEQUI_GERENCIA: 'Nequi Gerencia',
      BRE_B: 'Bre-B',
      DAVIPLATA: 'Daviplata',
      TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
      TARJETA_DEBITO: 'Tarjeta Débito',
      TARJETA_CREDITO: 'Tarjeta Crédito',
      CREDISMART: 'CrediSmart',
      SISTECREDITO: 'Sistecredito'
    };
    return labels[metodo] || metodo;
  };

  const exportarCSV = () => {
    if (!dashboard) return;
    const rows: (string | number)[][] = [
      ['Reportes Gerenciales'],
      ['Generado', new Date().toLocaleString('es-CO')],
      ['Período inicio', formatearPeriodoCsv(filtrosAplicados.fechaInicio)],
      ['Período fin', formatearPeriodoCsv(filtrosAplicados.fechaFin)],
      ['Comparar período anterior', filtrosAplicados.comparar ? 'Sí' : 'No'],
      [],
      ['KPI', 'Valor'],
      ['Ingresos Totales', safeNumber(kpis.ingresos_totales?.valor_actual)],
      ['Egresos Totales', safeNumber(kpis.egresos_totales?.valor_actual)],
      ['Ingreso Neto', safeNumber(kpis.ingreso_neto)],
      ['Saldo Pendiente', safeNumber(kpis.saldo_pendiente)],
      ['Margen Operativo (%)', safeNumber(kpis.margen_operativo)],
      ['Ticket Promedio', safeNumber(kpis.ticket_promedio)],
      ['Tasa de Cobranza (%)', safeNumber(kpis.tasa_cobranza)],
      ['Días Promedio de Pago', safeNumber(kpis.dias_promedio_pago)],
      ['% Pagos Vencidos', safeNumber(kpis.porcentaje_pagos_vencidos)],
      ['Estudiantes Activos', safeNumber(kpis.total_estudiantes_activos)],
      ['Estudiantes Inactivos', safeNumber(kpis.total_estudiantes_inactivos)],
      ['Nuevas Matrículas', safeNumber(kpis.nuevas_matriculas_mes)],
      [],
      ['Ingresos por periodo'],
      ['Periodo', 'Ingresos']
    ];
    datosIngresosLinea.forEach((d: { mes: string; ingresos: number }) => rows.push([d.mes, d.ingresos]));
    rows.push([]);
    rows.push(['Métodos de pago', 'Monto', 'Porcentaje']);
    datosMetodosPago.forEach((d: { nombre: string; valor: number; porcentaje: number }) => rows.push([d.nombre, d.valor, d.porcentaje]));
    rows.push([]);
    rows.push(['Egresos por categoría', 'Monto']);
    datosEgresos.forEach((d: { categoria: string; monto: number }) => rows.push([d.categoria, d.monto]));

    rows.push([]);
    rows.push(['Ranking de referidos']);
    rows.push(['Nombre', 'Teléfono', 'Referidos', 'Ingresos Generados', 'Activos', 'Graduados', 'Última Referencia']);
    (ranking_referidos || []).forEach((item: any) =>
      rows.push([
        item.referido_nombre || '',
        item.telefono || '',
        safeNumber(item.total_estudiantes_referidos),
        safeNumber(item.total_ingresos_generados),
        safeNumber(item.estudiantes_activos),
        safeNumber(item.estudiantes_graduados),
        formatearFechaCsv(item.ultima_referencia_fecha)
      ])
    );

    rows.push([]);
    rows.push(['Resumen - Estudiantes Registrados', safeNumber(lista_estudiantes_registrados?.length || 0)]);
    rows.push(['Resumen - Estudiantes con Pagos', safeNumber(lista_estudiantes_pagos?.length || 0)]);
    rows.push(['Resumen - Egresos Registrados', safeNumber(lista_egresos_caja?.length || 0)]);
    rows.push(['Resumen - Otros Ingresos', safeNumber(lista_otros_movimientos?.length || 0)]);
    rows.push(['Resumen - Conceptos de Pagos', safeNumber(lista_estudiantes_pagos?.length || 0)]);

    downloadCSV(`reportes_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const exportarEstudiantesRegistradosCSV = () => {
    const rows: (string | number)[][] = [
      ['Estudiantes Registrados - Detallado'],
      ['Generado', new Date().toLocaleString('es-CO')],
      ['Período inicio', formatearPeriodoCsv(filtrosAplicados.fechaInicio)],
      ['Período fin', formatearPeriodoCsv(filtrosAplicados.fechaFin)],
      ['Nombre', 'Documento', 'Categoría', 'Fecha Inscripción', 'Origen', 'Referido Por', 'Valor Curso', 'Estado']
    ];
    (lista_estudiantes_registrados || []).forEach((est: any) => {
      rows.push([
        est.nombre_completo || '',
        est.documento || '',
        est.categoria || '',
        formatearFechaCsv(est.fecha_inscripcion),
        est.origen_cliente || '',
        est.referido_por || '',
        safeNumber(est.valor_total_curso),
        est.estado || ''
      ]);
    });
    downloadCSV(buildFilename('estudiantes_registrados_detallado'), rows);
  };

  const exportarEstudiantesPagosCSV = () => {
    const rows: (string | number)[][] = [
      ['Estudiantes que Realizaron Pagos - Detallado'],
      ['Generado', new Date().toLocaleString('es-CO')],
      ['Período inicio', formatearPeriodoCsv(filtrosAplicados.fechaInicio)],
      ['Período fin', formatearPeriodoCsv(filtrosAplicados.fechaFin)],
      ['Pago ID', 'Nombre', 'Documento', 'Categoría', 'Fecha Pago', 'Concepto', 'Monto', 'Método Pago', 'Saldo Pendiente', 'Pago Mixto']
    ];
    (lista_estudiantes_pagos || []).forEach((pago: any) => {
      rows.push([
        pago.pago_id || '',
        pago.nombre_completo || '',
        pago.documento || '',
        pago.categoria || '',
        formatearFechaCsv(pago.fecha_pago),
        pago.concepto || '',
        safeNumber(pago.monto),
        getMetodoPagoLabel(pago.metodo_pago, pago.es_pago_mixto),
        safeNumber(pago.saldo_pendiente),
        pago.es_pago_mixto ? 'Sí' : 'No'
      ]);
    });
    downloadCSV(buildFilename('estudiantes_pagos_detallado'), rows);
  };

  const exportarEgresosCSV = () => {
    const rows: (string | number)[][] = [
      ['Egresos Registrados - Detallado'],
      ['Generado', new Date().toLocaleString('es-CO')],
      ['Período inicio', formatearPeriodoCsv(filtrosAplicados.fechaInicio)],
      ['Período fin', formatearPeriodoCsv(filtrosAplicados.fechaFin)],
      ['Egreso ID', 'Fecha', 'Concepto', 'Categoría', 'Método', 'Monto', 'Usuario', 'Factura', 'Observaciones']
    ];
    (lista_egresos_caja || []).forEach((eg: any) => {
      rows.push([
        eg.egreso_id || '',
        formatearFechaCsv(eg.fecha),
        eg.concepto || '',
        eg.categoria || '',
        getMetodoPagoLabel(eg.metodo_pago, eg.metodo_pago === 'MIXTO'),
        safeNumber(eg.monto),
        eg.usuario || '',
        eg.numero_factura || '',
        eg.observaciones || ''
      ]);
    });
    downloadCSV(buildFilename('egresos_registrados_detallado'), rows);
  };

  const exportarOtrosIngresosCSV = () => {
    const rows: (string | number)[][] = [
      ['Otros Ingresos - Detallado'],
      ['Generado', new Date().toLocaleString('es-CO')],
      ['Período inicio', formatearPeriodoCsv(filtrosAplicados.fechaInicio)],
      ['Período fin', formatearPeriodoCsv(filtrosAplicados.fechaFin)],
      ['Movimiento ID', 'Tipo', 'Fecha', 'Concepto', 'Categoría', 'Método', 'Monto', 'Tercero', 'Documento Tercero', 'Usuario']
    ];
    (lista_otros_movimientos || []).forEach((mov: any) => {
      rows.push([
        mov.movimiento_id || '',
        mov.tipo || '',
        formatearFechaCsv(mov.fecha),
        mov.concepto || '',
        mov.categoria || '',
        getMetodoPagoLabel(mov.metodo_pago, mov.metodo_pago === 'MIXTO'),
        safeNumber(mov.monto),
        mov.tercero_nombre || '',
        mov.tercero_documento || '',
        mov.usuario || ''
      ]);
    });
    downloadCSV(buildFilename('otros_ingresos_detallado'), rows);
  };

  const exportarConceptosPagosCSV = () => {
    const rows: (string | number)[][] = [
      ['Conceptos de Pagos - Detallado'],
      ['Generado', new Date().toLocaleString('es-CO')],
      ['Período inicio', formatearPeriodoCsv(filtrosAplicados.fechaInicio)],
      ['Período fin', formatearPeriodoCsv(filtrosAplicados.fechaFin)],
      ['Pago ID', 'Fecha', 'Concepto', 'Estudiante', 'Documento', 'Categoría', 'Método', 'Monto']
    ];
    (lista_estudiantes_pagos || []).forEach((pago: any) => {
      rows.push([
        pago.pago_id || '',
        formatearFechaCsv(pago.fecha_pago),
        pago.concepto || '',
        pago.nombre_completo || '',
        pago.documento || '',
        pago.categoria || '',
        getMetodoPagoLabel(pago.metodo_pago, pago.es_pago_mixto),
        safeNumber(pago.monto)
      ]);
    });
    downloadCSV(buildFilename('conceptos_pagos_detallado'), rows);
  };

  return (
    <div className="reportes-container">
      {/* Header */}
      <div className="reportes-header">
        <div className="header-titulo">
          <BarChart3 size={32} />
          <div>
            <h1>Reportes Gerenciales</h1>
            <p>Dashboard ejecutivo con métricas clave del negocio</p>
          </div>
        </div>
        <div className="reportes-actions">
          <button className="btn-exportar secondary" onClick={exportarCSV}>
            <Download size={18} />
            Exportar CSV
          </button>
          <button className="btn-exportar" disabled>
            <Download size={18} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosPeriodo onAplicarFiltros={cargarDashboard} cargando={loading} />

      {/* KPIs Grid */}
      <div className="kpis-grid">
        <KPICard
          titulo="Ingresos Totales"
          valor={formatearMoneda(parseFloat(kpis.ingresos_totales.valor_actual))}
          icono={<DollarSign size={24} />}
          cambio={kpis.ingresos_totales.cambio_porcentual}
          tendencia={kpis.ingresos_totales.tendencia}
          colorIcono="#10b981"
        />
        <KPICard
          titulo="Egresos Totales"
          valor={formatearMoneda(parseFloat(kpis.egresos_totales.valor_actual))}
          icono={<TrendingUp size={24} />}
          cambio={kpis.egresos_totales.cambio_porcentual}
          tendencia={kpis.egresos_totales.tendencia}
          colorIcono="#ef4444"
        />
        <KPICard
          titulo="Saldo Pendiente"
          valor={formatearMoneda(parseFloat(kpis.saldo_pendiente))}
          icono={<CreditCard size={24} />}
          colorIcono="#f59e0b"
        />
        <KPICard
          titulo="Margen Operativo"
          valor={formatearPorcentaje(kpis.margen_operativo)}
          icono={<PieChart size={24} />}
          colorIcono="#8b5cf6"
        />
        <KPICard
          titulo="Estudiantes Activos"
          valor={kpis.total_estudiantes_activos}
          icono={<Users size={24} />}
          colorIcono="#2563eb"
        />
        <KPICard
          titulo="Nuevas Matrículas"
          valor={kpis.nuevas_matriculas_mes}
          icono={<Calendar size={24} />}
          colorIcono="#06b6d4"
        />
        <KPICard
          titulo="Ticket Promedio"
          valor={formatearMoneda(parseFloat(kpis.ticket_promedio))}
          icono={<DollarSign size={24} />}
          colorIcono="#10b981"
        />
        <KPICard
          titulo="Tasa de Cobranza"
          valor={formatearPorcentaje(kpis.tasa_cobranza)}
          icono={<TrendingUp size={24} />}
          colorIcono="#22c55e"
        />
      </div>

      {/* Gráficos Grid */}
      <div className="graficos-grid">
        {/* Gráfico de línea: Evolución de ingresos */}
        <div className="grafico-card grafico-grande">
          <div className="grafico-header">
            <h3>Evolución de Ingresos</h3>
            <div className="grafico-stats">
              <span>Total: {formatearMoneda(parseFloat(grafico_ingresos.total_periodo))}</span>
              <span>Promedio: {formatearMoneda(parseFloat(grafico_ingresos.promedio_mensual))}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosIngresosLinea}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => formatearMoneda(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
                name="Ingresos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras: Métodos de pago */}
        <div className="grafico-card">
          <div className="grafico-header">
            <h3>Ingresos por Método de Pago</h3>
            <span className="grafico-subtitle">Método preferido: {grafico_metodos_pago.metodo_preferido}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosMetodosPago}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="nombre" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => formatearMoneda(value)}
              />
              <Bar dataKey="valor" name="Monto">
                {datosMetodosPago.map((_: { nombre: string; valor: number; porcentaje: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORES_METODOS[index % COLORES_METODOS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de dona: Estudiantes por categoría */}
        <div className="grafico-card">
          <div className="grafico-header">
            <h3>Estudiantes por Categoría</h3>
            <span className="grafico-subtitle">Total: {grafico_estudiantes.total}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={datosEstudiantes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const nombre = props?.payload?.nombre || '';
                  const porcentaje = typeof props?.payload?.porcentaje === 'number'
                    ? props.payload.porcentaje
                    : ((props?.percent || 0) * 100);
                  return `${nombre}: ${porcentaje.toFixed(1)}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="valor"
              >
                {datosEstudiantes.map((entry: { color: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value} estudiantes`} />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras: Top egresos */}
        <div className="grafico-card grafico-grande">
          <div className="grafico-header">
            <h3>Top 5 Categorías de Egresos</h3>
            <div className="grafico-stats">
              <span>Total: {formatearMoneda(parseFloat(grafico_egresos.total))}</span>
              <span>Mayor: {grafico_egresos.categoria_mayor}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosEgresos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="categoria" type="category" stroke="#6b7280" style={{ fontSize: '12px' }} width={150} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => formatearMoneda(value)}
              />
              <Bar dataKey="monto" fill="#ef4444" name="Monto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking de Referidos */}
      <RankingReferidos referidos={ranking_referidos || []} />

      {/* Tablas de Estudiantes */}
      <div className="tablas-estudiantes-grid">
        <TablaEstudiantesRegistrados
          estudiantes={lista_estudiantes_registrados || []}
          onExportCSV={exportarEstudiantesRegistradosCSV}
        />
        <TablaEstudiantesPagos
          pagos={lista_estudiantes_pagos || []}
          onExportCSV={exportarEstudiantesPagosCSV}
        />
        <TablaEgresosCaja
          egresos={lista_egresos_caja || []}
          onExportCSV={exportarEgresosCSV}
        />
        <TablaOtrosIngresos
          ingresos={lista_otros_movimientos || []}
          onExportCSV={exportarOtrosIngresosCSV}
        />
        <TablaConceptosPagos
          pagos={lista_estudiantes_pagos || []}
          onExportCSV={exportarConceptosPagosCSV}
        />
      </div>
    </div>
  );
};
