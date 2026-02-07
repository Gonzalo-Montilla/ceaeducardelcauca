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

  getAll: async (params?: { skip?: number; limit?: number; search?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
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

  getHistorial: async (params?: { fecha_inicio?: string; fecha_fin?: string; skip?: number; limit?: number }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    const response = await api.get(`/caja/historial${query ? `?${query}` : ''}`);
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

// Reportes endpoints
export const reportesAPI = {
  getDashboard: async (params?: { fecha_inicio?: string; fecha_fin?: string; comparar_periodo_anterior?: boolean }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    if (params?.comparar_periodo_anterior !== undefined) {
      queryParams.append('comparar_periodo_anterior', String(params.comparar_periodo_anterior));
    }
    const query = queryParams.toString();
    const response = await api.get(`/reportes/dashboard${query ? `?${query}` : ''}`);
    return response.data;
  },
  getAlertasOperativas: async (): Promise<any> => {
    const response = await api.get('/reportes/alertas-operativas');
    return response.data;
  },
};

// Vehículos endpoints
export const vehiculosAPI = {
  getAll: async (params?: { skip?: number; limit?: number; search?: string; activo?: boolean }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.activo !== undefined) queryParams.append('activo', String(params.activo));
    const query = queryParams.toString();
    const response = await api.get(`/vehiculos/${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await api.get(`/vehiculos/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await api.post('/vehiculos/', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/vehiculos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/vehiculos/${id}`);
  },

  getMantenimientos: async (vehiculoId: number): Promise<any> => {
    const response = await api.get(`/vehiculos/${vehiculoId}/mantenimientos`);
    return response.data;
  },

  getMantenimientosPaged: async (
    vehiculoId: number,
    params?: { skip?: number; limit?: number; fecha_inicio?: string; fecha_fin?: string; orden?: string }
  ): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    if (params?.orden) queryParams.append('orden', params.orden);
    const query = queryParams.toString();
    const response = await api.get(`/vehiculos/${vehiculoId}/mantenimientos${query ? `?${query}` : ''}`);
    return response.data;
  },

  createMantenimiento: async (vehiculoId: number, data: any): Promise<any> => {
    const response = await api.post(`/vehiculos/${vehiculoId}/mantenimientos`, data);
    return response.data;
  },

  updateMantenimiento: async (vehiculoId: number, mantenimientoId: number, data: any): Promise<any> => {
    const response = await api.put(`/vehiculos/${vehiculoId}/mantenimientos/${mantenimientoId}`, data);
    return response.data;
  },

  addRepuesto: async (vehiculoId: number, mantenimientoId: number, data: any): Promise<any> => {
    const response = await api.post(`/vehiculos/${vehiculoId}/mantenimientos/${mantenimientoId}/repuestos`, data);
    return response.data;
  },

  getCombustibles: async (vehiculoId: number): Promise<any> => {
    const response = await api.get(`/vehiculos/${vehiculoId}/combustible`);
    return response.data;
  },

  getCombustiblesPaged: async (
    vehiculoId: number,
    params?: { skip?: number; limit?: number; fecha_inicio?: string; fecha_fin?: string; conductor?: string; orden?: string }
  ): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    if (params?.conductor) queryParams.append('conductor', params.conductor);
    if (params?.orden) queryParams.append('orden', params.orden);
    const query = queryParams.toString();
    const response = await api.get(`/vehiculos/${vehiculoId}/combustible${query ? `?${query}` : ''}`);
    return response.data;
  },

  createCombustible: async (vehiculoId: number, data: any): Promise<any> => {
    const response = await api.post(`/vehiculos/${vehiculoId}/combustible`, data);
    return response.data;
  },

  addMantenimientoAdjuntos: async (vehiculoId: number, mantenimientoId: number, archivos: File[]): Promise<any> => {
    const formData = new FormData();
    archivos.forEach((archivo) => formData.append('archivos', archivo));
    const response = await api.post(`/vehiculos/${vehiculoId}/mantenimientos/${mantenimientoId}/adjuntos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  addCombustibleAdjuntos: async (vehiculoId: number, combustibleId: number, archivos: File[]): Promise<any> => {
    const formData = new FormData();
    archivos.forEach((archivo) => formData.append('archivos', archivo));
    const response = await api.post(`/vehiculos/${vehiculoId}/combustible/${combustibleId}/adjuntos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getCombustibleResumen: async (
    vehiculoId: number,
    params?: { fecha_inicio?: string; fecha_fin?: string; conductor?: string }
  ): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    if (params?.conductor) queryParams.append('conductor', params.conductor);
    const query = queryParams.toString();
    const response = await api.get(`/vehiculos/${vehiculoId}/combustible/resumen${query ? `?${query}` : ''}`);
    return response.data;
  },

  getConsumoUmbral: async (tipo: string): Promise<any> => {
    const response = await api.get(`/vehiculos/consumo-umbrales/${tipo}`);
    return response.data;
  },

  upsertConsumoUmbral: async (tipo: string, km_por_galon_min: number): Promise<any> => {
    const response = await api.put(`/vehiculos/consumo-umbrales/${tipo}`, { km_por_galon_min });
    return response.data;
  },

  getExportData: async (
    vehiculoId: number,
    params?: {
      mant_fecha_inicio?: string;
      mant_fecha_fin?: string;
      comb_fecha_inicio?: string;
      comb_fecha_fin?: string;
      comb_conductor?: string;
    }
  ): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.mant_fecha_inicio) queryParams.append('mant_fecha_inicio', params.mant_fecha_inicio);
    if (params?.mant_fecha_fin) queryParams.append('mant_fecha_fin', params.mant_fecha_fin);
    if (params?.comb_fecha_inicio) queryParams.append('comb_fecha_inicio', params.comb_fecha_inicio);
    if (params?.comb_fecha_fin) queryParams.append('comb_fecha_fin', params.comb_fecha_fin);
    if (params?.comb_conductor) queryParams.append('comb_conductor', params.comb_conductor);
    const query = queryParams.toString();
    const response = await api.get(`/vehiculos/${vehiculoId}/export-data${query ? `?${query}` : ''}`);
    return response.data;
  }
};

// Tarifas endpoints
export const tarifasAPI = {
  getAll: async (): Promise<any> => {
    const response = await api.get('/tarifas');
    return response.data;
  },
  create: async (data: any): Promise<any> => {
    const response = await api.post('/tarifas', data);
    return response.data;
  },
  update: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/tarifas/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tarifas/${id}`);
  }
};

// Usuarios endpoints
export const usuariosAPI = {
  getAll: async (params?: { search?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    const response = await api.get(`/usuarios${query ? `?${query}` : ''}`);
    return response.data;
  },
  create: async (data: any): Promise<any> => {
    const response = await api.post('/usuarios', data);
    return response.data;
  },
  update: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },
  resetPassword: async (id: number, new_password: string): Promise<void> => {
    await api.put(`/usuarios/${id}/password`, { new_password });
  }
};

// Uploads endpoints
export const uploadsAPI = {
  uploadVehiculoFoto: async (foto_base64: string, vehiculo_id?: number): Promise<any> => {
    const response = await api.post('/uploads/vehiculo/foto', { foto_base64, vehiculo_id });
    return response.data;
  },

  uploadReciboCombustible: async (archivo: File, vehiculo_id?: number): Promise<any> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (vehiculo_id !== undefined) {
      formData.append('vehiculo_id', String(vehiculo_id));
    }
    const response = await api.post('/uploads/vehiculo/recibo-combustible', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

export default api;
