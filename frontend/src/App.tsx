import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NuevoEstudiante } from './pages/NuevoEstudiante';
import { Estudiantes } from './pages/Estudiantes';
import { EstudianteDetalle } from './pages/EstudianteDetalle';
import { Caja } from './pages/Caja';
import CajaFuerte from './pages/CajaFuerte';
import { HistorialCajas } from './pages/HistorialCajas';
import { Reportes } from './pages/Reportes';
import Alertas from './pages/Alertas';
import CierreFinanciero from './pages/CierreFinanciero';
import { Instructores } from './pages/Instructores';
import { InstructorDetalle } from './pages/InstructorDetalle';
import { Vehiculos } from './pages/Vehiculos';
import { VehiculoDetalle } from './pages/VehiculoDetalle';
import { Tarifas } from './pages/Tarifas';
import { Usuarios } from './pages/Usuarios';
import { Clases } from './pages/Clases';
import { RolUsuario } from './types';
import logo from './assets/cea_educar_final.png';

const MODULE_PATHS: Record<string, string> = {
  dashboard: '/dashboard',
  nuevo_estudiante: '/nuevo-estudiante',
  estudiantes: '/estudiantes',
  caja: '/caja',
  caja_fuerte: '/caja-fuerte',
  historial_cajas: '/historial-cajas',
  reportes: '/reportes',
  alertas: '/alertas',
  cierre_financiero: '/cierre-financiero',
  instructores: '/instructores',
  vehiculos: '/vehiculos',
  clases: '/clases',
  usuarios: '/usuarios',
  tarifas: '/tarifas'
};

const hasExplicitModulePermissions = (user?: { permisos_modulos?: string[] }) =>
  Array.isArray(user?.permisos_modulos);

const getHomeRoute = (user?: { rol?: RolUsuario; permisos_modulos?: string[] }) => {
  if (hasExplicitModulePermissions(user)) {
    const first = (user?.permisos_modulos || []).find((m) => MODULE_PATHS[m]);
    if (first) return MODULE_PATHS[first];
    return '/dashboard';
  }
  if (user?.rol === RolUsuario.INSTRUCTOR) return '/clases';
  return '/dashboard';
};

const hasModuleAccess = (user: any, moduleId: string, roles: RolUsuario[]) => {
  if (hasExplicitModulePermissions(user)) {
    return user.permisos_modulos.includes(moduleId);
  }
  return roles.includes(user?.rol);
};

const FullPageLoader = () => (
  <div className="app-loading-screen" role="status" aria-live="polite">
    <img src={logo} alt="CEA EDUCAR" className="app-loading-logo" />
    <div className="app-loading-spinner" />
    <p>Cargando sesión...</p>
  </div>
);

const RoleRoute = ({ children, roles, moduleId }: { children: React.ReactNode; roles: RolUsuario[]; moduleId: string }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <FullPageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (!user || !hasModuleAccess(user, moduleId, roles)) {
    if (user && hasExplicitModulePermissions(user) && !user.permisos_modulos.some((m) => MODULE_PATHS[m])) {
      return <div>No tienes módulos asignados. Contacta a un administrador.</div>;
    }
    return <Navigate to={getHomeRoute(user || undefined)} />;
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <FullPageLoader />;
  }
  return !isAuthenticated ? <>{children}</> : <Navigate to={getHomeRoute(user || undefined)} />;
};

const HomeRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <FullPageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <Navigate to={getHomeRoute(user || undefined)} />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]} moduleId="dashboard">
            <Layout>
              <Dashboard />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/nuevo-estudiante"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]} moduleId="nuevo_estudiante">
            <Layout>
              <NuevoEstudiante />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/estudiantes"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]} moduleId="estudiantes">
            <Layout>
              <Estudiantes />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/estudiantes/:id"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]} moduleId="estudiantes">
            <Layout>
              <EstudianteDetalle />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/caja"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]} moduleId="caja">
            <Layout>
              <Caja />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/caja-fuerte"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE]} moduleId="caja_fuerte">
            <Layout>
              <CajaFuerte />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/historial-cajas"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]} moduleId="historial_cajas">
            <Layout>
              <HistorialCajas />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE]} moduleId="reportes">
            <Layout>
              <Reportes />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/alertas"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO, RolUsuario.COORDINADOR]} moduleId="alertas">
            <Layout>
              <Alertas />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/cierre-financiero"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE]} moduleId="cierre_financiero">
            <Layout>
              <CierreFinanciero />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/instructores"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]} moduleId="instructores">
            <Layout>
              <Instructores />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/instructores/:id"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]} moduleId="instructores">
            <Layout>
              <InstructorDetalle />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/tarifas"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE]} moduleId="tarifas">
            <Layout>
              <Tarifas />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE]} moduleId="usuarios">
            <Layout>
              <Usuarios />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/vehiculos"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]} moduleId="vehiculos">
            <Layout>
              <Vehiculos />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/vehiculos/:id"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]} moduleId="vehiculos">
            <Layout>
              <VehiculoDetalle />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/clases"
        element={
          <RoleRoute roles={[RolUsuario.INSTRUCTOR, RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]} moduleId="clases">
            <Layout>
              <Clases />
            </Layout>
          </RoleRoute>
        }
      />
      <Route path="/" element={<HomeRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
