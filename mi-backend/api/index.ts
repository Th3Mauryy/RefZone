// Serverless function entry point for Vercel
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cloudinaryModule from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Importar rutas
import authRoutes from '../src/routes/auth';
import gameRoutes from '../src/routes/gameRoutes';
import reporteRoutes from '../src/routes/reporteRoutes';
import canchaRoutes from '../src/routes/canchaRoutes';
import ubicacionRoutes from '../src/routes/ubicacionRoutes';

// Importar middlewares de seguridad
import { 
    loginLimiter, 
    registerLimiter, 
    passwordRecoveryLimiter,
    apiLimiter,
    createGameLimiter,
    applyGameLimiter 
} from '../src/middleware/rateLimiter';
import { sanitizeBodyMiddleware } from '../src/middleware/sanitizer';

// Cloudinary setup
const cloudinary = cloudinaryModule.v2;

// Crear la instancia de Express
const app = express();

// Middleware para procesar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para procesar cookies
app.use(cookieParser());

// Configuración de CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://ref-zone.vercel.app', process.env.FRONTEND_URL!]
        : process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-CSRF-Token']
}));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'secure-session-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    },
}));

// ===== MIDDLEWARES DE SEGURIDAD =====
// Helmet con configuración mejorada
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
}));

// Sanitización general de inputs
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

// Variable para controlar conexión a MongoDB
let isConnected = false;

// Función para conectar a MongoDB (solo una vez)
async function connectToDatabase(): Promise<void> {
    if (isConnected) return;
    
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/refzone');
        isConnected = true;
        console.log('✅ Conexión exitosa a MongoDB Atlas');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error);
        throw error;
    }
}

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware de seguridad adicional
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// Middleware para conectar a la base de datos antes de cada request
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        next(error);
    }
});

// Rutas con prefijo /api
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/canchas', canchaRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/reportes', reporteRoutes);

// Rutas sin prefijo /api para compatibilidad
app.use('/usuarios', authRoutes);
app.use('/games', gameRoutes);
app.use('/canchas', canchaRoutes);
app.use('/ubicaciones', ubicacionRoutes);
app.use('/reportes', reporteRoutes);

// Ruta de health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Exportar configuración de Cloudinary
export { cloudinary, CloudinaryStorage };

// Exportar app para Vercel
export default app;
