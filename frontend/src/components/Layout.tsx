import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  LogOut,
  History,
  Shield,
  Bell,
  ClipboardList,
  Menu,
  Wallet
} from 'lucide-react';
import { RolUsuario } from '../types';
import '../styles/Layout.css';

const logo = '/logo-real.png';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(max-width: 1024px)').matches;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminRoles = [RolUsuario.ADMIN, RolUsuario.COORDINADOR, RolUsuario.GERENTE];
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', moduleId: 'dashboard', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/nuevo-estudiante', icon: UserPlus, label: 'Nuevo Estudiante', moduleId: 'nuevo_estudiante', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/estudiantes', icon: Users, label: 'Estudiantes', moduleId: 'estudiantes', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/caja', icon: DollarSign, label: 'Caja / Pagos', moduleId: 'caja', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO] },
    { path: '/caja-fuerte', icon: Wallet, label: 'Caja Fuerte', moduleId: 'caja_fuerte', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
    { path: '/historial-cajas', icon: History, label: 'Historial de Cajas', moduleId: 'historial_cajas', roles: adminRoles },
    { path: '/reportes', icon: FileText, label: 'Reportes', moduleId: 'reportes', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
    { path: '/alertas', icon: Bell, label: 'Alertas', moduleId: 'alertas', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO, RolUsuario.COORDINADOR] },
    { path: '/cierre-financiero', icon: ClipboardList, label: 'Cierre Financiero', moduleId: 'cierre_financiero', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
    { path: '/instructores', icon: UserCheck, label: 'Instructores', moduleId: 'instructores', roles: adminRoles },
    { path: '/vehiculos', icon: Car, label: 'Vehículos', moduleId: 'vehiculos', roles: adminRoles },
    { path: '/clases', icon: Calendar, label: 'Programar Clases', moduleId: 'clases', roles: [RolUsuario.INSTRUCTOR, RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR] },
    { path: '/usuarios', icon: Shield, label: 'Usuarios', moduleId: 'usuarios', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
    { path: '/tarifas', icon: GraduationCap, label: 'Tarifas', moduleId: 'tarifas', roles: [RolUsuario.ADMIN, RolUsuario.GERENTE] },
  ];

  const allowedItems = menuItems.filter((item) => {
    if (!user?.rol) return false;
    if (user?.permisos_modulos && user.permisos_modulos.length > 0) {
      return user.permisos_modulos.includes(item.moduleId);
    }
    return item.roles.includes(user.rol as RolUsuario);
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
                  setMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon"><Icon size={22} /></span>
                <span className="nav-text">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>
      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`main-wrapper ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div className="dashboard-header-title">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => {
                  const isMobile = window.matchMedia('(max-width: 1024px)').matches;
                  if (isMobile) {
                    setMobileMenuOpen((prev) => !prev);
                    return;
                  }
                  setSidebarExpanded((prev) => !prev);
                }}
                title={sidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
                aria-label="Alternar menú lateral"
              >
                <Menu size={18} />
              </button>
              <div className="dashboard-header-brand">
                <h1>CEA EDUCAR DEL CAUCA S.A.S</h1>
                <span>Panel administrativo</span>
              </div>
            </div>
            <div className="dashboard-header-actions">
              <span className={`user-role-badge role-${String(user?.rol || '').toLowerCase()}`}>{user?.rol}</span>
              <span className="user-name">{user?.nombre_completo}</span>
              <span className="header-divider" aria-hidden="true" />
              <button
                onClick={handleLogout}
                className="icon-button logout-button"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
                <span className="logout-text">Salir</span>
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
