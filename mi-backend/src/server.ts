// ============================================
// CARGA DE VARIABLES DE ENTORNO
// ============================================
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// ============================================
// IMPORTACIONES
// ============================================
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cloudinaryModule from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuraciones
import { connectDatabase } from './config/database';
import { getCorsConfig } from './config/cors';
import { getSessionConfig } from './config/session';
import { getHelmetConfig } from './config/helmet';
import { iniciarAutoEliminacionPartidos } from './config/cronJobs';

// Rutas
import authRoutes from './routes/auth';
import gameRoutes from './routes/games';
import reporteRoutes from './routes/reporteRoutes';
import canchaRoutes from './routes/canchaRoutes';
import ubicacionRoutes from './routes/ubicacionRoutes';

// Middlewares de seguridad
import { 
  loginLimiter, 
  registerLimiter, 
  passwordRecoveryLimiter,
  apiLimiter,
  createGameLimiter,
  applyGameLimiter 
} from './middleware/rateLimiter';
import { sanitizeBodyMiddleware } from './middleware/sanitizer';

// ============================================
// CONFIGURACIÓN DE CLOUDINARY
// ============================================
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================
// CREAR APLICACIÓN EXPRESS
// ============================================
const app = express();

// ============================================
// MIDDLEWARES BÁSICOS
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(getCorsConfig()));
app.use(session(getSessionConfig()));

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================
console.log('🔒 Configurando middlewares de seguridad...');

app.use(helmet(getHelmetConfig()));
app.use(sanitizeBodyMiddleware);

// Rate limiting general para API
app.use('/api/', apiLimiter);

// Rate limiters específicos para rutas críticas
app.use('/api/usuarios/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/usuarios/registro', registerLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/usuarios/recuperar', passwordRecoveryLimiter);
app.use('/api/auth/recuperar', passwordRecoveryLimiter);

app.use('/api/games', (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST') return createGameLimiter(req, res, next);
  next();
});
app.use('/api/games/:id/apply', applyGameLimiter);

console.log('✅ Middlewares de seguridad configurados');

// ============================================
// CONEXIÓN A BASE DE DATOS
// ============================================
connectDatabase().then(() => {
  iniciarAutoEliminacionPartidos();
}).catch((error) => {
  console.error('Error crítico al conectar a la base de datos:', error);
});

// ============================================
// RUTAS DE API
// ============================================
// Con prefijo /api
app.use('/api/usuarios', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/canchas', canchaRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/reportes', reporteRoutes);

// Sin prefijo /api para compatibilidad
app.use('/usuarios', authRoutes);
app.use('/games', gameRoutes);
app.use('/canchas', canchaRoutes);
app.use('/ubicaciones', ubicacionRoutes);
app.use('/reportes', reporteRoutes);

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// HEADERS DE SEGURIDAD ADICIONALES
// ============================================
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Advertencia Self-XSS
app.get('/self-xss-warning.js', (_req: Request, res: Response) => {
  res.type('application/javascript');
  res.send(`
    console.log('%c¡Advertencia!', 'color: red; font-size: 20px;');
    console.log('No pegues código aquí. Podrías ser víctima de un ataque.');
  `);
});

// ============================================
// PRODUCCIÓN: SERVIR FRONTEND
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../mi-frontend/dist')));
  
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../mi-frontend/dist/index.html'));
    }
  });
}

// ============================================
// EXPORTS
// ============================================
export { cloudinary, CloudinaryStorage };

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en el puerto ${PORT}`);
});

export default app;
