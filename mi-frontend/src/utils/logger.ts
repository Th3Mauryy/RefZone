/**
 * Sistema de logging condicional
 * Solo muestra logs en desarrollo, silencioso en producción
 */

const isProduction = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1');

const isDevelopment = !isProduction;

// Crear objeto logger con todos los métodos de console
const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]): void => {
    // Los errores SIEMPRE se muestran (incluso en producción)
    console.error(...args);
  },
  
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  table: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.table(...args);
    }
  },
  
  // Método especial para producción: solo muestra en producción
  production: (...args: unknown[]): void => {
    if (isProduction) {
      console.log(...args);
    }
  }
};

// Información del entorno al cargar
if (isDevelopment) {
  console.log('%c🔧 Modo Desarrollo Activado', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
  console.log('📍 Hostname:', window.location.hostname);
  console.log('🌐 Environment:', isDevelopment ? 'Development' : 'Production');
} else {
  console.log('%c🚀 RefZone - Production Mode', 'color: #2196F3; font-weight: bold;');
}

export default logger;
