/**
 * Security Logger Middleware
 * Registra eventos de seguridad para auditoría
 */

const securityEvents = [];
const MAX_EVENTS = 1000; // Mantener solo los últimos 1000 eventos en memoria

/**
 * Registra un evento de seguridad
 */
const logSecurityEvent = (event) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event
  };
  
  securityEvents.unshift(logEntry);
  
  // Mantener solo los últimos MAX_EVENTS
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.pop();
  }
  
  // Log en consola solo para eventos críticos
  if (event.level === 'critical' || event.level === 'error') {
    console.error(`🔴 [SECURITY] ${timestamp} - ${event.type}:`, event.message);
  } else if (event.level === 'warning') {
    console.warn(`🟡 [SECURITY] ${timestamp} - ${event.type}:`, event.message);
  }
};

/**
 * Middleware para loguear intentos de autenticación
 */
const logAuthAttempt = (req, success, message = '') => {
  logSecurityEvent({
    type: 'auth_attempt',
    level: success ? 'info' : 'warning',
    success,
    email: req.body?.email || 'unknown',
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    message: message || (success ? 'Login exitoso' : 'Login fallido')
  });
};

/**
 * Middleware para loguear accesos no autorizados
 */
const logUnauthorizedAccess = (req, reason) => {
  logSecurityEvent({
    type: 'unauthorized_access',
    level: 'warning',
    reason,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    message: `Intento de acceso no autorizado: ${reason}`
  });
};

/**
 * Middleware para loguear cambios críticos
 */
const logCriticalAction = (req, action, details) => {
  logSecurityEvent({
    type: 'critical_action',
    level: 'info',
    action,
    userId: req.user?.id || 'unknown',
    userRole: req.user?.role || 'unknown',
    details,
    ip: req.ip || req.connection.remoteAddress,
    message: `Acción crítica: ${action}`
  });
};

/**
 * Middleware para loguear errores de validación
 */
const logValidationError = (req, field, error) => {
  logSecurityEvent({
    type: 'validation_error',
    level: 'info',
    field,
    error: error.toString(),
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    message: `Error de validación en campo: ${field}`
  });
};

/**
 * Middleware para loguear rate limiting
 */
const logRateLimitHit = (req) => {
  logSecurityEvent({
    type: 'rate_limit_exceeded',
    level: 'warning',
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    message: 'Rate limit excedido'
  });
};

/**
 * Obtener eventos de seguridad recientes
 * Solo para administradores
 */
const getSecurityEvents = (limit = 50, filter = {}) => {
  let filtered = securityEvents;
  
  // Filtrar por tipo si se especifica
  if (filter.type) {
    filtered = filtered.filter(e => e.type === filter.type);
  }
  
  // Filtrar por nivel si se especifica
  if (filter.level) {
    filtered = filtered.filter(e => e.level === filter.level);
  }
  
  // Filtrar por IP si se especifica
  if (filter.ip) {
    filtered = filtered.filter(e => e.ip === filter.ip);
  }
  
  return filtered.slice(0, limit);
};

/**
 * Obtener estadísticas de seguridad
 */
const getSecurityStats = () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recent = securityEvents.filter(e => new Date(e.timestamp) > last24h);
  
  return {
    total_events_24h: recent.length,
    failed_logins_24h: recent.filter(e => 
      e.type === 'auth_attempt' && !e.success
    ).length,
    unauthorized_attempts_24h: recent.filter(e => 
      e.type === 'unauthorized_access'
    ).length,
    rate_limit_hits_24h: recent.filter(e => 
      e.type === 'rate_limit_exceeded'
    ).length,
    critical_actions_24h: recent.filter(e => 
      e.type === 'critical_action'
    ).length,
    by_level: {
      critical: recent.filter(e => e.level === 'critical').length,
      error: recent.filter(e => e.level === 'error').length,
      warning: recent.filter(e => e.level === 'warning').length,
      info: recent.filter(e => e.level === 'info').length
    }
  };
};

module.exports = {
  logSecurityEvent,
  logAuthAttempt,
  logUnauthorizedAccess,
  logCriticalAction,
  logValidationError,
  logRateLimitHit,
  getSecurityEvents,
  getSecurityStats
};
