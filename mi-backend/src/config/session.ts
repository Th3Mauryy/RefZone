import { SessionOptions } from 'express-session';

/**
 * Configuración de sesiones
 */
export function getSessionConfig(): SessionOptions {
  return {
    secret: process.env.SESSION_SECRET || 'secure-session-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    },
  };
}
