// ============================================
// USER TYPES
// ============================================

export type UserRole = 'arbitro' | 'organizador';

export interface User {
  _id: string;
  email: string;
  nombre: string;
  edad: number;
  contacto: string;
  experiencia: string;
  imagenPerfil: string | null;
  role: UserRole;
  canchaAsignada?: string | null;
  calificacionPromedio: number;
  totalCalificaciones: number;
}

export interface AuthUser extends User {
  token: string;
}

// ============================================
// CANCHA TYPES
// ============================================

export interface Cancha {
  _id: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  logo: string | null;
  descripcion?: string;
  activa: boolean;
}

// ============================================
// GAME TYPES
// ============================================

export type GameEstado = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';

export interface Postulado {
  _id: string;
  nombre: string;
  email: string;
  imagenPerfil?: string | null;
  calificacionPromedio?: number;
}

export interface Game {
  _id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  ubicacionId?: string | null;
  arbitro: Postulado | null;
  postulados: Postulado[];
  estado: GameEstado;
  canchaId?: string | null;
  creadorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// UBICACION TYPES
// ============================================

export interface Ubicacion {
  _id: string;
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  googleMapsUrl?: string;
  organizadorId: string;
  canchaId: string;
  activa: boolean;
}

// ============================================
// HISTORIAL TYPES
// ============================================

export interface HistorialPartido {
  _id: string;
  originalId: string;
  nombre: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  arbitro: Postulado | null;
  arbitroNombre: string;
  canchaId?: string | null;
  estado: 'Finalizado' | 'Cancelado';
  calificado: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message?: string;
}

export interface RegisterResponse {
  message: string;
  user?: User;
}

// ============================================
// FORM TYPES
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  edad: number;
  contacto: string;
  experiencia: string;
  role?: UserRole;
}

export interface GameFormData {
  name: string;
  date: string;
  time: string;
  location: string;
  ubicacionId?: string;
}

export interface ProfileFormData {
  nombre: string;
  edad: number;
  contacto: string;
  experiencia: string;
  imagenPerfil?: File | null;
}

// ============================================
// STATS TYPES
// ============================================

export interface ArbitroStats {
  totalPartidos: number;
  partidosAsignados: number;
  postulacionesPendientes: number;
  calificacionPromedio: number;
}

export interface OrganizadorStats {
  total: number;
  upcoming: number;
  needsReferee: number;
  // Campos opcionales extendidos
  totalPartidos?: number;
  partidosProgramados?: number;
  partidosFinalizados?: number;
  arbitrosDisponibles?: number;
  pendientesCalificacion?: number;
}

// ============================================
// CALIFICACION TYPES
// ============================================

export interface Calificacion {
  organizadorId: string;
  partidoId: string;
  estrellas: number;
  comentario: string;
  fecha: string;
}

export interface CalificarArbitroData {
  partidoId: string;
  arbitroId: string;
  estrellas: number;
  comentario?: string;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardUser {
  nombre: string;
  userId: string;
  imagenPerfil: string | null;
  email: string;
  contacto: string;
  experiencia: string;
  role?: UserRole;
}

export interface ApplyModalState {
  open: boolean;
  gameId: string | null;
}

export interface CancelModalState {
  open: boolean;
  gameId: string | null;
}

export interface ButtonState {
  text: string;
  color: string;
  disabled: boolean;
  cancel: boolean;
}

export interface GameWithCancha extends Omit<Game, 'canchaId'> {
  canchaId?: {
    _id: string;
    nombre: string;
  } | string | null;
}

// ============================================
// DASHBOARD ORGANIZADOR TYPES
// ============================================

export interface OrganizadorUser {
  userId: string;
  nombre: string;
  email?: string;
  role: 'organizador';
  imagenPerfil?: string | null;
  canchaAsignada?: CanchaAsignada | null;
}

export interface CanchaAsignada {
  _id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface PostuladosModal {
  open: boolean;
  postulados: ArbitroPostulado[];
  gameId: string | null;
}

export interface ArbitroPostulado {
  _id: string;
  nombre?: string;
  email: string;
  imagenPerfil?: string | null;
  calificacionPromedio: number;
  totalCalificaciones: number;
  edad?: number;
  contacto?: string;
  experiencia?: string;
}

export interface HistorialArbitroPartido {
  _id: string;
  nombre: string;
  fecha: string;
  hora?: string;
  creadorId?: { nombre?: string } | null;
  calificacion?: number;
  comentario?: string;
}

export interface HistorialModal {
  open: boolean;
  arbitro: ArbitroPostulado | null;
  historial: HistorialArbitroPartido[];
  loading: boolean;
}

export interface ReporteModal {
  open: boolean;
  mes: number;
  ano: number;
  cargando: boolean;
}

export interface ArbitroDetalleModal {
  open: boolean;
  arbitro: ArbitroPostulado | null;
}

export interface SustitucionModal {
  open: boolean;
  gameId: string | null;
  gameName: string;
  arbitroActual: ArbitroPostulado | null;
  postulados: ArbitroPostulado[];
  nuevoArbitroId: string;
  razon: string;
  loading: boolean;
}

export interface CalificacionModal {
  open: boolean;
  partido: PartidoPendiente | null;
  arbitro: ArbitroPostulado | null;
  estrellas: number;
  comentario: string;
  loading: boolean;
}

export interface PartidoPendiente {
  _id: string;
  nombre: string;
  fecha: string;
  hora: string;
  arbitro: ArbitroPostulado;
  calificado: boolean;
}

export interface UbicacionModal {
  open: boolean;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  googleMapsUrl?: string;
  saving: boolean;
  editingId: string | null;
  marcadorColocado: boolean;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | (() => Promise<void>) | null;
  type: 'danger' | 'warning' | 'info';
}

export interface GameErrors {
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  [key: string]: string | undefined;
}

export interface CurrentGame {
  name: string;
  date: string;
  time: string;
  location: string;
  ubicacionId: string;
}
