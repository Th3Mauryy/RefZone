import { Document, Types } from 'mongoose';

// ============================================
// INTERFACES BASE
// ============================================

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// USER INTERFACES
// ============================================

export type UserRole = 'arbitro' | 'organizador';

export interface ICalificacion {
  organizadorId: Types.ObjectId;
  partidoId: Types.ObjectId;
  estrellas: number;
  comentario: string;
  fecha: Date;
}

export interface IUser {
  email: string;
  password: string;
  nombre: string;
  edad: number;
  contacto: string;
  experiencia: string;
  imagenPerfil: string | null;
  role: UserRole;
  canchaAsignada: Types.ObjectId | null;
  calificacionPromedio: number;
  totalCalificaciones: number;
  calificaciones: ICalificacion[];
}

export interface IUserDocument extends IUser, Document, ITimestamps {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

// ============================================
// CANCHA INTERFACES
// ============================================

export interface ICancha {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  logo: string | null;
  descripcion?: string;
  activa: boolean;
  fechaCreacion: Date;
}

export interface ICanchaDocument extends ICancha, Document, ITimestamps {}

// ============================================
// GAME INTERFACES
// ============================================

export type GameEstado = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';

export interface IGame {
  name: string;
  date: string;
  time: string;
  location: string;
  ubicacionId: Types.ObjectId | null;
  arbitro: Types.ObjectId | null;
  postulados: Types.ObjectId[];
  estado: GameEstado;
  canchaId: Types.ObjectId | null;
  creadorId: Types.ObjectId | null;
}

export interface IGameDocument extends IGame, Document, ITimestamps {}

// ============================================
// UBICACION INTERFACES
// ============================================

export interface IUbicacion {
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  googleMapsUrl?: string;
  organizadorId: Types.ObjectId;
  canchaId: Types.ObjectId;
  activa: boolean;
  fechaCreacion: Date;
}

export interface IUbicacionDocument extends IUbicacion, Document, ITimestamps {}

// ============================================
// HISTORIAL PARTIDO INTERFACES
// ============================================

export type HistorialEstado = 'Finalizado' | 'Cancelado';
export type RazonEliminacion = 'automatica' | 'manual';

export interface IHistorialPartido {
  originalId: Types.ObjectId;
  nombre: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  arbitro: Types.ObjectId | null;
  arbitroNombre: string;
  canchaId: Types.ObjectId | null;
  estado: HistorialEstado;
  razonEliminacion: RazonEliminacion;
  fechaEliminacion: Date;
  mesPartido: number;
  anoPartido: number;
  calificado: boolean;
}

export interface IHistorialPartidoDocument extends IHistorialPartido, Document, ITimestamps {}

// ============================================
// REQUEST INTERFACES (para Express)
// ============================================

import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  canchaAsignada?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  userId?: string;
  file?: Express.Multer.File;
}

// Deprecated: use AuthenticatedRequest instead
export type IAuthRequest = AuthenticatedRequest;

// ============================================
// API RESPONSE INTERFACES
// ============================================

export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
