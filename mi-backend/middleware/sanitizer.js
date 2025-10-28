/**
 * Input Sanitization Utilities
 * Protege contra XSS y otros ataques de inyección
 */

/**
 * Sanitiza strings removiendo caracteres peligrosos
 * Previene XSS básico
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, ''); // Remover event handlers (onclick=, onload=, etc.)
};

/**
 * Sanitiza email
 * Valida formato y normaliza
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  const sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, ''); // Remover caracteres peligrosos
  
  // Validar formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitiza números
 * Asegura que sea un número válido
 */
const sanitizeNumber = (input) => {
  const num = Number(input);
  return isNaN(num) ? 0 : num;
};

/**
 * Sanitiza ObjectId de MongoDB
 * Valida formato hexadecimal de 24 caracteres
 */
const sanitizeObjectId = (id) => {
  if (typeof id !== 'string') return null;
  
  const cleaned = id.trim();
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  return objectIdRegex.test(cleaned) ? cleaned : null;
};

/**
 * Sanitiza teléfono
 * Solo permite dígitos
 */
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  
  return phone.replace(/\D/g, ''); // Solo dígitos
};

/**
 * Sanitiza HTML removiendo tags peligrosos
 * Para campos como experiencia o comentarios
 */
const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  // Remover scripts y estilos inline
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remover event handlers
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Sanitiza objeto completo recursivamente
 * Aplica sanitización a todos los strings del objeto
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
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
 * Aplica sanitización automática a todos los campos string
 */
const sanitizeBodyMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Valida y sanitiza datos de registro de usuario
 */
const sanitizeUserRegistration = (data) => {
  return {
    email: sanitizeEmail(data.email),
    password: data.password, // NO sanitizar contraseñas - permitir caracteres especiales
    nombre: sanitizeString(data.nombre),
    edad: sanitizeNumber(data.edad),
    contacto: sanitizePhone(data.contacto),
    experiencia: sanitizeHTML(data.experiencia || '')
  };
};

/**
 * Valida y sanitiza datos de creación de partido
 */
const sanitizeGameData = (data) => {
  return {
    name: sanitizeString(data.name),
    date: data.date, // Ya validado por Mongoose
    time: data.time, // Ya validado por Mongoose
    location: sanitizeString(data.location),
    canchaId: sanitizeObjectId(data.canchaId),
    ubicacionId: sanitizeObjectId(data.ubicacionId)
  };
};

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObjectId,
  sanitizePhone,
  sanitizeHTML,
  sanitizeObject,
  sanitizeBodyMiddleware,
  sanitizeUserRegistration,
  sanitizeGameData
};
