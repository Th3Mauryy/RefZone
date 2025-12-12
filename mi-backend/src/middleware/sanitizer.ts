/**
 * Input Sanitization Utilities
 * Protege contra XSS y otros ataques de inyección
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitiza strings removiendo caracteres peligrosos
 */
export const sanitizeString = (input: unknown): string => {
  if (typeof input !== 'string') return String(input || '');
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

/**
 * Sanitiza email
 */
export const sanitizeEmail = (email: unknown): string => {
  if (typeof email !== 'string') return '';
  
  const sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '');
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitiza números
 */
export const sanitizeNumber = (input: unknown): number => {
  const num = Number(input);
  return isNaN(num) ? 0 : num;
};

/**
 * Sanitiza ObjectId de MongoDB
 */
export const sanitizeObjectId = (id: unknown): string | null => {
  if (typeof id !== 'string') return null;
  
  const cleaned = id.trim();
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  return objectIdRegex.test(cleaned) ? cleaned : null;
};

/**
 * Sanitiza teléfono
 */
export const sanitizePhone = (phone: unknown): string => {
  if (typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
};

/**
 * Sanitiza HTML removiendo tags peligrosos
 */
export const sanitizeHTML = (html: unknown): string => {
  if (typeof html !== 'string') return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Sanitiza objeto completo recursivamente
 */
export const sanitizeObject = (obj: unknown): unknown => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Middleware para sanitizar el body de las peticiones
 */
export const sanitizeBodyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

interface UserRegistrationData {
  email: string;
  password: string;
  nombre: string;
  edad: number;
  contacto: string;
  experiencia?: string;
}

/**
 * Valida y sanitiza datos de registro de usuario
 */
export const sanitizeUserRegistration = (data: UserRegistrationData): UserRegistrationData => {
  return {
    email: sanitizeEmail(data.email),
    password: data.password, // NO sanitizar contraseñas
    nombre: sanitizeString(data.nombre),
    edad: sanitizeNumber(data.edad),
    contacto: sanitizePhone(data.contacto),
    experiencia: sanitizeHTML(data.experiencia || '')
  };
};

interface GameData {
  name: string;
  date: string;
  time: string;
  location: string;
  canchaId?: string;
  ubicacionId?: string;
}

/**
 * Valida y sanitiza datos de creación de partido
 */
export const sanitizeGameData = (data: GameData): GameData => {
  return {
    name: sanitizeString(data.name),
    date: data.date,
    time: data.time,
    location: sanitizeString(data.location),
    canchaId: sanitizeObjectId(data.canchaId) || undefined,
    ubicacionId: sanitizeObjectId(data.ubicacionId) || undefined
  };
};
