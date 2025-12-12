import cors, { CorsOptions } from 'cors';

/**
 * Configuración de CORS para el servidor
 */
export function getCorsConfig(): CorsOptions {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://ref-zone.vercel.app', process.env.FRONTEND_URL!]
    : [process.env.FRONTEND_URL || 'http://localhost:5173'];

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-CSRF-Token']
  };
}

export default cors;
