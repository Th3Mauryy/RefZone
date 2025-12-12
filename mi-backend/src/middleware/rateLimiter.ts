/**
 * Rate Limiting Middleware
 * Protege contra ataques de fuerza bruta y DoS
 */
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

interface RateLimitRequest extends Request {
  rateLimit: {
    resetTime: Date;
  };
}

// Rate limiter para login - MUY RESTRICTIVO
export const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    error: 'too_many_requests',
    message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
    help: 'Si olvidaste tu contraseña, usa la opción de recuperación.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const rateLimitReq = req as RateLimitRequest;
    console.warn(`⚠️ Rate limit excedido para login desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
      help: 'Si olvidaste tu contraseña, usa la opción de recuperación.',
      retryAfter: Math.ceil((rateLimitReq.rateLimit.resetTime.getTime() - Date.now()) / 1000 / 60) + ' minutos'
    });
  }
});

// Rate limiter para registro - MODERADO
export const registerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora desde la misma IP
  message: {
    error: 'too_many_registrations',
    message: 'Demasiados registros desde esta IP. Intenta más tarde.',
  },
  handler: (req: Request, res: Response) => {
    const rateLimitReq = req as RateLimitRequest;
    console.warn(`⚠️ Rate limit excedido para registro desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'too_many_registrations',
      message: 'Demasiados registros desde esta IP. Por favor, intenta de nuevo en 1 hora.',
      retryAfter: Math.ceil((rateLimitReq.rateLimit.resetTime.getTime() - Date.now()) / 1000 / 60) + ' minutos'
    });
  }
});

// Rate limiter para recuperación de contraseña - MUY RESTRICTIVO
export const passwordRecoveryLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos por hora
  message: {
    error: 'too_many_password_reset_requests',
    message: 'Demasiadas solicitudes de recuperación de contraseña. Intenta en 1 hora.',
  },
  handler: (req: Request, res: Response) => {
    const rateLimitReq = req as RateLimitRequest;
    console.warn(`⚠️ Rate limit excedido para recuperación de contraseña desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'too_many_password_reset_requests',
      message: 'Demasiadas solicitudes de recuperación de contraseña. Por favor, revisa tu email o intenta en 1 hora.',
      retryAfter: Math.ceil((rateLimitReq.rateLimit.resetTime.getTime() - Date.now()) / 1000 / 60) + ' minutos'
    });
  }
});

// Rate limiter general para API - PERMISIVO
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    error: 'rate_limit_exceeded',
    message: 'Demasiadas peticiones. Por favor, reduce la velocidad.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    const skipPaths = ['/api/games', '/api/ubicaciones'];
    return skipPaths.some(path => req.path.startsWith(path)) && req.method === 'GET';
  }
});

// Rate limiter para creación de partidos - MODERADO
export const createGameLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 partidos por hora
  message: {
    error: 'too_many_games_created',
    message: 'Has creado demasiados partidos. Intenta más tarde.',
  }
});

// Rate limiter para postulación de árbitros - PERMISIVO
export const applyGameLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30, // 30 postulaciones por 10 minutos
  message: {
    error: 'too_many_applications',
    message: 'Has enviado demasiadas postulaciones. Espera un momento.',
  }
});
