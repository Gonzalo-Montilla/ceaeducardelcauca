// Enums
export enum RolUsuario {
  ADMIN = "ADMIN",
  COORDINADOR = "COORDINADOR",
  INSTRUCTOR = "INSTRUCTOR",
  ESTUDIANTE = "ESTUDIANTE",
  CAJERO = "CAJERO"
}

export enum CategoriaLicencia {
  A2 = "A2",
  B1 = "B1",
  C1 = "C1",
  RECATEGORIZACION_C1 = "RECATEGORIZACION_C1"
}

export enum EstadoEstudiante {
  ACTIVO = "ACTIVO",
  GRADUADO = "GRADUADO",
  INACTIVO = "INACTIVO",
  RETIRADO = "RETIRADO"
}

export enum OrigenCliente {
  DIRECTO = "DIRECTO",
  REFERIDO = "REFERIDO"
}

export enum TipoServicio {
  LICENCIA = "LICENCIA",
  CERTIFICADO = "CERTIFICADO",
  COMBO = "COMBO"
}

export enum MetodoPago {
  EFECTIVO = "EFECTIVO",
  TRANSFERENCIA = "TRANSFERENCIA",
  TARJETA = "TARJETA"
}

export enum EstadoPago {
  PENDIENTE = "PENDIENTE",
  COMPLETADO = "COMPLETADO",
  CANCELADO = "CANCELADO"
}

// Interfaces
export interface Usuario {
  id: number;
  email: string;
  nombre_completo: string;
  cedula: string;
  telefono?: string;
  rol: RolUsuario;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface Estudiante {
  id: number;
  usuario_id: number;
  categoria_licencia: CategoriaLicencia;
  tipo_servicio: TipoServicio;
  origen_cliente: OrigenCliente;
  referido_por?: string;
  
  // Información académica
  fecha_matricula: string;
  fecha_estimada_graduacion?: string;
  horas_teoricas_completadas: number;
  horas_practicas_completadas: number;
  estado: EstadoEstudiante;
  
  // Información financiera
  valor_total_curso: number;
  saldo_pendiente: number;
  
  // SICOV
  sicov_usuario?: string;
  sicov_contrasena?: string;
  
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre_completo: string;
  cedula: string;
  telefono?: string;
  rol?: RolUsuario;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
