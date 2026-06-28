// Enums
export enum RolUsuario {
  ADMIN = "ADMIN",
  GERENTE = "GERENTE",
  COORDINADOR = "COORDINADOR",
  INSTRUCTOR = "INSTRUCTOR",
  ESTUDIANTE = "ESTUDIANTE",
  CAJERO = "CAJERO"
}

export enum CategoriaLicencia {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  B3 = "B3",
  C1 = "C1",
  C2 = "C2",
  C3 = "C3",
  RECATEGORIZACION_C1 = "RECATEGORIZACION_C1"
}

export enum EstadoEstudiante {
  PROSPECTO = "PROSPECTO",
  INSCRITO = "INSCRITO",
  EN_FORMACION = "EN_FORMACION",
  LISTO_EXAMEN = "LISTO_EXAMEN",
  ACTIVO = "ACTIVO",
  GRADUADO = "GRADUADO",
  INACTIVO = "INACTIVO",
  DESERTOR = "DESERTOR",
  RETIRADO = "RETIRADO"
}

export enum OrigenCliente {
  DIRECTO = "DIRECTO",
  REFERIDO = "REFERIDO"
}

export enum TipoServicio {
  LICENCIA_A2 = "LICENCIA_A2",
  LICENCIA_B1 = "LICENCIA_B1",
  LICENCIA_C1 = "LICENCIA_C1",
  LICENCIA_A2_REFRENDACION = "LICENCIA_A2_REFRENDACION",
  LICENCIA_B1_REFRENDACION = "LICENCIA_B1_REFRENDACION",
  LICENCIA_C1_REFRENDACION = "LICENCIA_C1_REFRENDACION",
  RECATEGORIZACION_C1 = "RECATEGORIZACION_C1",
  COMBO_A2_B1 = "COMBO_A2_B1",
  COMBO_A2_C1 = "COMBO_A2_C1",
  CERTIFICADO_MOTO = "CERTIFICADO_MOTO",
  CERTIFICADO_B1 = "CERTIFICADO_B1",
  CERTIFICADO_C1 = "CERTIFICADO_C1",
  CERTIFICADO_B1_SIN_PRACTICA = "CERTIFICADO_B1_SIN_PRACTICA",
  CERTIFICADO_C1_SIN_PRACTICA = "CERTIFICADO_C1_SIN_PRACTICA",
  CERTIFICADO_A2_B1_SIN_PRACTICA = "CERTIFICADO_A2_B1_SIN_PRACTICA",
  CERTIFICADO_A2_C1_SIN_PRACTICA = "CERTIFICADO_A2_C1_SIN_PRACTICA",
  CERTIFICADO_A2_B1_CON_PRACTICA = "CERTIFICADO_A2_B1_CON_PRACTICA",
  CERTIFICADO_A2_C1_CON_PRACTICA = "CERTIFICADO_A2_C1_CON_PRACTICA",
  LICENCIA = "LICENCIA",
  CERTIFICADO = "CERTIFICADO",
  COMBO = "COMBO"
}

export enum MetodoPago {
  EFECTIVO = "EFECTIVO",
  NEQUI = "NEQUI",
  NEQUI_ESCUELA = "NEQUI_ESCUELA",
  NEQUI_GERENCIA = "NEQUI_GERENCIA",
  DAVIPLATA = "DAVIPLATA",
  BRE_B = "BRE_B",
  TRANSFERENCIA_BANCARIA = "TRANSFERENCIA_BANCARIA",
  TARJETA_DEBITO = "TARJETA_DEBITO",
  TARJETA_CREDITO = "TARJETA_CREDITO",
  CREDISMART = "CREDISMART",
  SISTECREDITO = "SISTECREDITO"
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
  tipo_documento?: string;
  telefono?: string;
  rol: RolUsuario;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  permisos_modulos?: string[];
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
  tipo_documento?: string;
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

// Interfaces para Pagos
export interface DetallePago {
  metodo_pago: MetodoPago;
  monto: number;
  referencia?: string;
}

export interface PagoCreate {
  estudiante_id: number;
  monto: number;
  metodo_pago?: MetodoPago;  // Solo para pagos simples
  concepto?: string;
  referencia_pago?: string;
  observaciones?: string;
  es_pago_mixto: boolean;
  detalles_pago?: DetallePago[];  // Para pagos mixtos
}

export interface DetallePagoResponse {
  id: number;
  metodo_pago: MetodoPago;
  monto: number;
  referencia?: string;
}

export interface PagoResponse {
  id: number;
  estudiante_id: number;
  caja_id?: number;
  concepto: string;
  monto: number;
  metodo_pago?: MetodoPago;  // null si es pago mixto
  estado: string;
  referencia_pago?: string;
  fecha_pago: string;
  observaciones?: string;
  es_pago_mixto: boolean;
  detalles_pago: DetallePagoResponse[];
  estudiante_nombre: string;
  estudiante_matricula: string;
  usuario_nombre?: string;
}
