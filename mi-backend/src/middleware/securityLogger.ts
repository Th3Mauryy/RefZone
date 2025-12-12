/**
 * Security Logger Middleware
 * Registra eventos de seguridad para auditoría
 */
import { Request } from 'express';

interface SecurityEventBase {
  type: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  success?: boolean;
  details?: unknown;
  reason?: string;
  action?: string;
  field?: string;
  path?: string;
  method?: string;
  userRole?: string;
  error?: string;
}

interface SecurityEvent extends SecurityEventBase {
  timestamp: string;
}

interface SecurityFilter {
  type?: string;
  level?: string;
  ip?: string;
}

interface SecurityStats {
  total_events_24h: number;
  failed_logins_24h: number;
  unauthorized_attempts_24h: number;
  rate_limit_hits_24h: number;
  critical_actions_24h: number;
  by_level: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
}

const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000;

/**
 * Registra un evento de seguridad
 */
export const logSecurityEvent = (event: SecurityEventBase): void => {
  const timestamp = new Date().toISOString();
  const logEntry: SecurityEvent = {
    timestamp,
    type: event.type,
    level: event.level,
    message: event.message,
    ip: event.ip,
    userAgent: event.userAgent,
    userId: event.userId,
    email: event.email,
    success: event.success,
    details: event.details
  };
  
  securityEvents.unshift(logEntry);
  
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.pop();
  }
  
  if (event.level === 'critical' || event.level === 'error') {
    console.error(`🔴 [SECURITY] ${timestamp} - ${event.type}:`, event.message);
  } else if (event.level === 'warning') {
    console.warn(`🟡 [SECURITY] ${timestamp} - ${event.type}:`, event.message);
  }
};

/**
 * Middleware para loguear intentos de autenticación
 */
export const logAuthAttempt = (req: Request, success: boolean, message = ''): void => {
  logSecurityEvent({
    type: 'auth_attempt',
    level: success ? 'info' : 'warning',
    success,
    email: (req.body?.email as string) || 'unknown',
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    message: message || (success ? 'Login exitoso' : 'Login fallido')
  });
};

/**
 * Middleware para loguear accesos no autorizados
 */
export const logUnauthorizedAccess = (req: Request, reason: string): void => {
  logSecurityEvent({
    type: 'unauthorized_access',
    level: 'warning',
    reason,
    path: req.path,
    method: req.method,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    message: `Intento de acceso no autorizado: ${reason}`
  });
};

/**
 * Middleware para loguear cambios críticos
 */
export const logCriticalAction = (req: Request, action: string, details: Record<string, unknown>): void => {
  logSecurityEvent({
    type: 'critical_action',
    level: 'info',
    action,
    userId: (req.user as any)?.id || 'unknown',
    userRole: (req.user as any)?.role || 'unknown',
    details,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    message: `Acción crítica: ${action}`
  });
};

/**
 * Middleware para loguear errores de validación
 */
export const logValidationError = (req: Request, field: string, error: Error): void => {
  logSecurityEvent({
    type: 'validation_error',
    level: 'info',
    field,
    error: error.toString(),
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    message: `Error de validación en campo: ${field}`
  });
};

/**
 * Middleware para loguear rate limiting
 */
export const logRateLimitHit = (req: Request): void => {
  logSecurityEvent({
    type: 'rate_limit_exceeded',
    level: 'warning',
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    message: 'Rate limit excedido'
  });
};

/**
 * Obtener eventos de seguridad recientes
 */
export const getSecurityEvents = (limit = 50, filter: SecurityFilter = {}): SecurityEvent[] => {
  let filtered = securityEvents;
  
  if (filter.type) {
    filtered = filtered.filter(e => e.type === filter.type);
  }
  
  if (filter.level) {
    filtered = filtered.filter(e => e.level === filter.level);
  }
  
  if (filter.ip) {
    filtered = filtered.filter(e => e.ip === filter.ip);
  }
  
  return filtered.slice(0, limit);
};

/**
 * Obtener estadísticas de seguridad
 */
export const getSecurityStats = (): SecurityStats => {
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
