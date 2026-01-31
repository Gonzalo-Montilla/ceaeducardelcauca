import axios from 'axios';
import type { LoginRequest, RegisterRequest, TokenResponse, Usuario, Estudiante } from '../types';

const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, intentar refrescar
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          // Reintentar la petición original
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return axios(error.config);
        } catch (refreshError) {
          // Si falla el refresh, limpiar tokens y redirigir al login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<Usuario> => {
    const response = await api.post<Usuario>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<Usuario> => {
    const response = await api.get<Usuario>('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// Estudiantes endpoints
export const estudiantesAPI = {
  create: async (data: any): Promise<any> => {
    const response = await api.post('/estudiantes/', data);
    return response.data;
  },

  getAll: async (params?: { skip?: number; limit?: number }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    
    const url = queryParams.toString() ? `/estudiantes/?${queryParams.toString()}` : '/estudiantes/';
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<Estudiante> => {
    const response = await api.get<Estudiante>(`/estudiantes/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<Estudiante>): Promise<Estudiante> => {
    const response = await api.put<Estudiante>(`/estudiantes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/estudiantes/${id}`);
  },

  definirServicio: async (id: number, data: any): Promise<Estudiante> => {
    const response = await api.put<Estudiante>(`/estudiantes/${id}/definir-servicio`, data);
    return response.data;
  },
};

// Caja endpoints
export const cajaAPI = {
  abrirCaja: async (data: { saldo_inicial: number; observaciones_apertura?: string | null }): Promise<any> => {
    const response = await api.post('/caja/abrir', data);
    return response.data;
  },

  getCajaActual: async (): Promise<any> => {
    try {
      const response = await api.get('/caja/actual');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  cerrarCaja: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/caja/${id}/cerrar`, data);
    return response.data;
  },

  buscarEstudiante: async (cedula: string): Promise<any> => {
    const response = await api.get(`/caja/estudiante/${cedula}`);
    return response.data;
  },

  registrarPago: async (data: {
    estudiante_id: number;
    monto: number;
    metodo_pago: string;
    concepto: string;
    referencia_pago?: string | null;
    observaciones?: string | null;
  }): Promise<any> => {
    const response = await api.post('/caja/pagos', data);
    return response.data;
  },

  registrarEgreso: async (data: {
    concepto: string;
    categoria: string;
    monto: number;
    metodo_pago: string;
    numero_factura?: string | null;
    observaciones?: string | null;
  }): Promise<any> => {
    const response = await api.post('/caja/egresos', data);
    return response.data;
  },

  getDashboard: async (): Promise<any> => {
    const response = await api.get('/caja/dashboard');
    return response.data;
  },

  getHistorial: async (fecha_inicio?: string, fecha_fin?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) params.append('fecha_fin', fecha_fin);
    const response = await api.get(`/caja/historial?${params.toString()}`);
    return response.data;
  },
};

// Instructores endpoints
export const instructoresAPI = {
  getAll: async (params?: { skip?: number; limit?: number; estado?: string; busqueda?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.estado) queryParams.append('estado', params.estado);
    if (params?.busqueda) queryParams.append('busqueda', params.busqueda);
    
    const url = queryParams.toString() ? `/instructores/?${queryParams.toString()}` : '/instructores/';
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await api.get(`/instructores/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await api.post('/instructores/', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/instructores/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/instructores/${id}`);
  },

  getEstadisticas: async (id: number): Promise<any> => {
    const response = await api.get(`/instructores/${id}/estadisticas`);
    return response.data;
  },
};

export default api;
