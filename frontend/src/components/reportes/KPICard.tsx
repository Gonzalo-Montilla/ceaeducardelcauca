import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  titulo: string;
  valor: string | number;
  icono: React.ReactNode;
  cambio?: number | null;
  tendencia?: 'up' | 'down' | 'neutral';
  unidad?: string;
  colorIcono?: string;
}

export const KPICard = ({
  titulo,
  valor,
  icono,
  cambio,
  tendencia = 'neutral',
  unidad = '',
  colorIcono = '#2563eb'
}: KPICardProps) => {
  const getTendenciaIcono = () => {
    if (tendencia === 'up') return <TrendingUp size={16} />;
    if (tendencia === 'down') return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  const getTendenciaColor = () => {
    if (tendencia === 'up') return 'tendencia-positiva';
    if (tendencia === 'down') return 'tendencia-negativa';
    return 'tendencia-neutral';
  };

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <div className="kpi-icono" style={{ backgroundColor: `${colorIcono}15`, color: colorIcono }}>
          {icono}
        </div>
        <span className="kpi-titulo">{titulo}</span>
      </div>
      
      <div className="kpi-valor">
        {unidad && <span className="kpi-unidad">{unidad}</span>}
        {valor}
      </div>

      {cambio !== undefined && cambio !== null && (
        <div className={`kpi-cambio ${getTendenciaColor()}`}>
          {getTendenciaIcono()}
          <span>{Math.abs(cambio).toFixed(1)}%</span>
          <span className="kpi-cambio-texto">vs período anterior</span>
        </div>
      )}
    </div>
  );
};
