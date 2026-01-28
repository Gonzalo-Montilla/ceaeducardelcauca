import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Users, 
  UserPlus, 
  UserCheck,
  Car,
  Calendar, 
  DollarSign,
  FileText,
  GraduationCap,
  MoreVertical
} from 'lucide-react';
import logo from '../assets/cea_educar_final.png';
import '../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/nuevo-estudiante', icon: UserPlus, label: 'Nuevo Estudiante' },
    { path: '/estudiantes', icon: Users, label: 'Estudiantes' },
    { path: '/instructores', icon: UserCheck, label: 'Instructores' },
    { path: '/vehiculos', icon: Car, label: 'Vehículos' },
    { path: '/clases', icon: Calendar, label: 'Programar Clases' },
    { path: '/pagos', icon: DollarSign, label: 'Caja / Pagos' },
    { path: '/reportes', icon: FileText, label: 'Reportes' },
  ];

  const isActive = (path: string) => {
    return window.location.pathname === path;
  };

  return (
    <div className="layout-container">
      <aside 
        className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="sidebar-logo">
          <img src={logo} alt="CEA EDUCAR" className="sidebar-logo-img" />
          {sidebarExpanded && <span className="logo-text">CEA EDUCAR</span>}
        </div>
        
        <nav className="nav-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <span className="nav-icon"><Icon size={22} /></span>
                {sidebarExpanded && <span className="nav-text">{item.label}</span>}
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-title">
              <h1>SISTEMA DE GESTIÓN</h1>
            </div>
            <div className="header-actions">
              <span className="user-role-badge">{user?.rol}</span>
              <span className="user-name">{user?.nombre_completo}</span>
              <button onClick={handleLogout} className="icon-button" title="Cerrar sesión">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
