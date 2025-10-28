/**
 * Rate Limiting Middleware
 * Protege contra ataques de fuerza bruta y DoS
 */
const rateLimit = require('express-rate-limit');

// Rate limiter para login - MUY RESTRICTIVO
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    error: 'too_many_requests',
    message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
    help: 'Si olvidaste tu contraseña, usa la opción de recuperación.'
  },
  standardHeaders: true, // Retornar info en headers RateLimit-*
  legacyHeaders: false, // Deshabilitar headers X-RateLimit-*
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit excedido para login desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
      help: 'Si olvidaste tu contraseña, usa la opción de recuperación.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' minutos'
    });
  }
});

// Rate limiter para registro - MODERADO
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora desde la misma IP
  message: {
    error: 'too_many_registrations',
    message: 'Demasiados registros desde esta IP. Intenta más tarde.',
  },
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit excedido para registro desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'too_many_registrations',
      message: 'Demasiados registros desde esta IP. Por favor, intenta de nuevo en 1 hora.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' minutos'
    });
  }
});

// Rate limiter para recuperación de contraseña - MUY RESTRICTIVO
const passwordRecoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos por hora
  message: {
    error: 'too_many_password_reset_requests',
    message: 'Demasiadas solicitudes de recuperación de contraseña. Intenta en 1 hora.',
  },
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit excedido para recuperación de contraseña desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'too_many_password_reset_requests',
      message: 'Demasiadas solicitudes de recuperación de contraseña. Por favor, revisa tu email o intenta en 1 hora.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' minutos'
    });
  }
});

// Rate limiter general para API - PERMISIVO
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    error: 'rate_limit_exceeded',
    message: 'Demasiadas peticiones. Por favor, reduce la velocidad.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar rate limiting para endpoints de lectura menos críticos
    const skipPaths = ['/api/games', '/api/ubicaciones'];
    return skipPaths.some(path => req.path.startsWith(path)) && req.method === 'GET';
  }
});

// Rate limiter para creación de partidos - MODERADO
const createGameLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 partidos por hora
  message: {
    error: 'too_many_games_created',
    message: 'Has creado demasiados partidos. Intenta más tarde.',
  }
});

// Rate limiter para postulación de árbitros - PERMISIVO
const applyGameLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30, // 30 postulaciones por 10 minutos
  message: {
    error: 'too_many_applications',
    message: 'Has enviado demasiadas postulaciones. Espera un momento.',
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordRecoveryLimiter,
  apiLimiter,
  createGameLimiter,
  applyGameLimiter
};
