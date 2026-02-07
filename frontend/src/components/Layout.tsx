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
  MoreVertical,
  History,
  Shield,
  Bell,
  ClipboardList,
  Menu
} from 'lucide-react';
import { RolUsuario } from '../types';
import logo from '../assets/cea_educar_final.png';
import '../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminRoles = [RolUsuario.ADMIN, RolUsuario.COORDINADOR, RolUsuario.GERENTE];
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/nuevo-estudiante', icon: UserPlus, label: 'Nuevo Estudiante', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/estudiantes', icon: Users, label: 'Estudiantes', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/caja', icon: DollarSign, label: 'Caja / Pagos', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/historial-cajas', icon: History, label: 'Historial de Cajas', roles: adminRoles },
    { path: '/reportes', icon: FileText, label: 'Reportes', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
    { path: '/alertas', icon: Bell, label: 'Alertas', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO, RolUsuario.COORDINADOR] },
    { path: '/cierre-financiero', icon: ClipboardList, label: 'Cierre Financiero', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
    { path: '/instructores', icon: UserCheck, label: 'Instructores', roles: adminRoles },
    { path: '/vehiculos', icon: Car, label: 'Vehículos', roles: adminRoles },
    { path: '/clases', icon: Calendar, label: 'Programar Clases', roles: [RolUsuario.INSTRUCTOR, RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR] },
    { path: '/usuarios', icon: Shield, label: 'Usuarios', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
    { path: '/tarifas', icon: GraduationCap, label: 'Tarifas', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
  ];

  const allowedItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    if (!user?.rol) return false;
    return item.roles.includes(user.rol as RolUsuario);
  });

  const isActive = (path: string) => {
    return window.location.pathname === path;
  };

  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="CEA EDUCAR" className="sidebar-logo-img" />
        </div>
        
        <nav className="nav-menu">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                title={item.label}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <span className="nav-icon"><Icon size={22} /></span>
                <span className="nav-text">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className={`main-wrapper ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-title">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setSidebarExpanded((prev) => !prev)}
                title={sidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
              >
                <Menu size={18} />
              </button>
              <div className="header-brand">
                <h1>CEA EDUCAR</h1>
                <span>Panel administrativo</span>
              </div>
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
