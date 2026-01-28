import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  TrendingUp,
  BookOpen,
  DollarSign,
  Award,
  Database,
  CheckCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="welcome-section">
        <h2>Bienvenido, {user?.nombre_completo}</h2>
        <p className="welcome-subtitle">Panel de control - CEA EDUCAR</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-header">
            <span className="stat-icon"><Users size={32} /></span>
            <span className="stat-badge"><TrendingUp size={12} /> +12%</span>
          </div>
          <div className="stat-info">
            <p className="stat-value">--</p>
            <h3>Estudiantes Activos</h3>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-header">
            <span className="stat-icon"><BookOpen size={32} /></span>
            <span className="stat-badge">Hoy</span>
          </div>
          <div className="stat-info">
            <p className="stat-value">--</p>
            <h3>Clases Programadas</h3>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-header">
            <span className="stat-icon"><DollarSign size={32} /></span>
            <span className="stat-badge">Pendiente</span>
          </div>
          <div className="stat-info">
            <p className="stat-value">--</p>
            <h3>Pagos por Cobrar</h3>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-header">
            <span className="stat-icon"><Award size={32} /></span>
            <span className="stat-badge">Mes</span>
          </div>
          <div className="stat-info">
            <p className="stat-value">--</p>
            <h3>Graduados</h3>
          </div>
        </div>
      </div>

      <div className="info-panel">
        <div className="panel-header">
          <h3><FileText size={18} style={{display: 'inline', marginRight: '8px'}} /> Estado del Sistema</h3>
        </div>
        <div className="panel-body">
          <p><CheckCircle size={16} style={{display: 'inline', marginRight: '8px', color: '#10b981'}} /> Sistema recuperado exitosamente</p>
          <p><RefreshCw size={16} style={{display: 'inline', marginRight: '8px', color: '#3b82f6'}} /> Los datos estadísticos se cargarán próximamente</p>
          <p><Database size={16} style={{display: 'inline', marginRight: '8px', color: '#8b5cf6'}} /> Base de datos: Conectada</p>
        </div>
      </div>
    </>
  );
};
