import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NuevoEstudiante } from './pages/NuevoEstudiante';
import { Estudiantes } from './pages/Estudiantes';
import { EstudianteDetalle } from './pages/EstudianteDetalle';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
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
