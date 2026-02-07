import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NuevoEstudiante } from './pages/NuevoEstudiante';
import { Estudiantes } from './pages/Estudiantes';
import { EstudianteDetalle } from './pages/EstudianteDetalle';
import { Caja } from './pages/Caja';
import { HistorialCajas } from './pages/HistorialCajas';
import { Reportes } from './pages/Reportes';
import { Instructores } from './pages/Instructores';
import { InstructorDetalle } from './pages/InstructorDetalle';
import { Vehiculos } from './pages/Vehiculos';
import { VehiculoDetalle } from './pages/VehiculoDetalle';
import { Tarifas } from './pages/Tarifas';
import { Usuarios } from './pages/Usuarios';
import { Clases } from './pages/Clases';
import { RolUsuario } from './types';

const getHomeRoute = (rol?: RolUsuario) => {
  if (rol === RolUsuario.INSTRUCTOR) return '/clases';
  return '/dashboard';
};

const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: RolUsuario[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <div>Cargando...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (!user || !roles.includes(user.rol)) {
    return <Navigate to={getHomeRoute(user?.rol)} />;
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <div>Cargando...</div>;
  }
  return !isAuthenticated ? <>{children}</> : <Navigate to={getHomeRoute(user?.rol)} />;
};

const HomeRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <div>Cargando...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <Navigate to={getHomeRoute(user?.rol)} />;
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
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]}>
            <Layout>
              <Dashboard />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/nuevo-estudiante"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]}>
            <Layout>
              <NuevoEstudiante />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/estudiantes"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]}>
            <Layout>
              <Estudiantes />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/estudiantes/:id"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]}>
            <Layout>
              <EstudianteDetalle />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/caja"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO]}>
            <Layout>
              <Caja />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/historial-cajas"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]}>
            <Layout>
              <HistorialCajas />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <RoleRoute roles={[RolUsuario.GERENTE]}>
            <Layout>
              <Reportes />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/instructores"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]}>
            <Layout>
              <Instructores />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/instructores/:id"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]}>
            <Layout>
              <InstructorDetalle />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/tarifas"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE]}>
            <Layout>
              <Tarifas />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE]}>
            <Layout>
              <Usuarios />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/vehiculos"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]}>
            <Layout>
              <Vehiculos />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/vehiculos/:id"
        element={
          <RoleRoute roles={[RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]}>
            <Layout>
              <VehiculoDetalle />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/clases"
        element={
          <RoleRoute roles={[RolUsuario.INSTRUCTOR, RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.COORDINADOR]}>
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
