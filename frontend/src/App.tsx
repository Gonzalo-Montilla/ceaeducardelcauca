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

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }
    return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
  };
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
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/nuevo-estudiante"
        element={
          <PrivateRoute>
            <Layout>
              <NuevoEstudiante />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/estudiantes"
        element={
          <PrivateRoute>
            <Layout>
              <Estudiantes />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/estudiantes/:id"
        element={
          <PrivateRoute>
            <Layout>
              <EstudianteDetalle />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/caja"
        element={
          <PrivateRoute>
            <Layout>
              <Caja />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/historial-cajas"
        element={
          <PrivateRoute>
            <Layout>
              <HistorialCajas />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <PrivateRoute>
            <Layout>
              <Reportes />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
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
