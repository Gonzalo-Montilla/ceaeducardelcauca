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

  getAll: async (): Promise<Estudiante[]> => {
    const response = await api.get<Estudiante[]>('/estudiantes/');
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
};

export default api;
