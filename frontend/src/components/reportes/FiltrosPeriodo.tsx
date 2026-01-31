import { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

interface FiltrosPeriodoProps {
  onAplicarFiltros: (fechaInicio: string, fechaFin: string, comparar: boolean) => void;
  cargando?: boolean;
}

type PeriodoPredef = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'personalizado';

export const FiltrosPeriodo = ({ onAplicarFiltros, cargando = false }: FiltrosPeriodoProps) => {
  const [periodo, setPeriodo] = useState<PeriodoPredef>('hoy');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [comparar, setComparar] = useState(false);

  const calcularFechas = (tipoPeriodo: PeriodoPredef): { inicio: string; fin: string } => {
    const hoy = new Date();
    let inicio = new Date();
    let fin = new Date();

    switch (tipoPeriodo) {
      case 'hoy':
        inicio = hoy;
        fin = hoy;
        break;
      case 'semana':
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 7);
        fin = hoy;
        break;
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = hoy;
        break;
      case 'trimestre':
        inicio = new Date(hoy);
        inicio.setMonth(hoy.getMonth() - 3);
        fin = hoy;
        break;
      case 'ano':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = hoy;
        break;
      case 'personalizado':
        return { inicio: fechaInicio, fin: fechaFin };
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0]
    };
  };

  // Cargar "hoy" al montar el componente
  useEffect(() => {
    const fechas = calcularFechas('hoy');
    onAplicarFiltros(fechas.inicio, fechas.fin, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo una vez al montar

  const handlePeriodoChange = (nuevoPeriodo: PeriodoPredef) => {
    setPeriodo(nuevoPeriodo);
    if (nuevoPeriodo !== 'personalizado') {
      const fechas = calcularFechas(nuevoPeriodo);
      onAplicarFiltros(fechas.inicio, fechas.fin, comparar);
    }
  };

  const handleAplicarPersonalizado = () => {
    if (fechaInicio && fechaFin) {
      onAplicarFiltros(fechaInicio, fechaFin, comparar);
    }
  };

  const handleComparar = (checked: boolean) => {
    setComparar(checked);
    const fechas = periodo === 'personalizado' 
      ? { inicio: fechaInicio, fin: fechaFin }
      : calcularFechas(periodo);
    
    if (fechas.inicio && fechas.fin) {
      onAplicarFiltros(fechas.inicio, fechas.fin, checked);
    }
  };

  return (
    <div className="filtros-periodo">
      <div className="filtros-header">
        <Calendar size={20} />
        <h3>Período de Análisis</h3>
      </div>

      <div className="filtros-botones">
        <button
          className={`filtro-btn ${periodo === 'hoy' ? 'activo' : ''}`}
          onClick={() => handlePeriodoChange('hoy')}
          disabled={cargando}
        >
          Hoy
        </button>
        <button
          className={`filtro-btn ${periodo === 'semana' ? 'activo' : ''}`}
          onClick={() => handlePeriodoChange('semana')}
          disabled={cargando}
        >
          Semana
        </button>
        <button
          className={`filtro-btn ${periodo === 'mes' ? 'activo' : ''}`}
          onClick={() => handlePeriodoChange('mes')}
          disabled={cargando}
        >
          Mes
        </button>
        <button
          className={`filtro-btn ${periodo === 'trimestre' ? 'activo' : ''}`}
          onClick={() => handlePeriodoChange('trimestre')}
          disabled={cargando}
        >
          Trimestre
        </button>
        <button
          className={`filtro-btn ${periodo === 'ano' ? 'activo' : ''}`}
          onClick={() => handlePeriodoChange('ano')}
          disabled={cargando}
        >
          Año
        </button>
        <button
          className={`filtro-btn ${periodo === 'personalizado' ? 'activo' : ''}`}
          onClick={() => handlePeriodoChange('personalizado')}
          disabled={cargando}
        >
          Personalizado
        </button>
      </div>

      {periodo === 'personalizado' && (
        <div className="filtros-personalizado">
          <div className="filtro-fecha">
            <label>Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={cargando}
            />
          </div>
          <div className="filtro-fecha">
            <label>Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={cargando}
            />
          </div>
          <button
            className="btn-aplicar-filtros"
            onClick={handleAplicarPersonalizado}
            disabled={!fechaInicio || !fechaFin || cargando}
          >
            <RefreshCw size={16} />
            Aplicar
          </button>
        </div>
      )}

      <div className="filtro-comparar">
        <label>
          <input
            type="checkbox"
            checked={comparar}
            onChange={(e) => handleComparar(e.target.checked)}
            disabled={cargando}
          />
          <span>Comparar con período anterior</span>
        </label>
      </div>
    </div>
  );
};
