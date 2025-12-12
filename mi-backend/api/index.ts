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
        console.error('Error connecting to database:', error);
        next(error);
    }
});

// Importar rutas de forma dinámica para mejor manejo de errores
let authRoutes: any, gameRoutes: any, reporteRoutes: any, canchaRoutes: any, ubicacionRoutes: any;
let sanitizeBodyMiddleware: any, apiLimiter: any, loginLimiter: any, registerLimiter: any, passwordRecoveryLimiter: any, createGameLimiter: any, applyGameLimiter: any;

try {
    // Importar middlewares de seguridad
    const rateLimiter = require('../src/middleware/rateLimiter');
    const sanitizer = require('../src/middleware/sanitizer');
    
    loginLimiter = rateLimiter.loginLimiter;
    registerLimiter = rateLimiter.registerLimiter;
    passwordRecoveryLimiter = rateLimiter.passwordRecoveryLimiter;
    apiLimiter = rateLimiter.apiLimiter;
    createGameLimiter = rateLimiter.createGameLimiter;
    applyGameLimiter = rateLimiter.applyGameLimiter;
    sanitizeBodyMiddleware = sanitizer.sanitizeBodyMiddleware;
    
    // Importar rutas
    authRoutes = require('../src/routes/auth').default;
    gameRoutes = require('../src/routes/games').default;
    reporteRoutes = require('../src/routes/reporteRoutes').default;
    canchaRoutes = require('../src/routes/canchaRoutes').default;
    ubicacionRoutes = require('../src/routes/ubicacionRoutes').default;
    
    console.log('✅ Rutas y middlewares cargados correctamente');
} catch (error) {
    console.error('❌ Error cargando rutas/middlewares:', error);
}

// Aplicar middlewares de seguridad si están disponibles
if (sanitizeBodyMiddleware) {
    app.use(sanitizeBodyMiddleware);
}

if (apiLimiter) {
    app.use('/api/', apiLimiter);
}

// Rate limiters específicos para rutas críticas
if (loginLimiter) {
    app.use('/api/usuarios/login', loginLimiter);
    app.use('/api/auth/login', loginLimiter);
}
if (registerLimiter) {
    app.use('/api/usuarios/registro', registerLimiter);
    app.use('/api/auth/register', registerLimiter);
}
if (passwordRecoveryLimiter) {
    app.use('/api/usuarios/recuperar', passwordRecoveryLimiter);
    app.use('/api/auth/recuperar', passwordRecoveryLimiter);
}
if (createGameLimiter) {
    app.use('/api/games', (req: Request, res: Response, next: NextFunction) => {
        if (req.method === 'POST') return createGameLimiter(req, res, next);
        next();
    });
}
if (applyGameLimiter) {
    app.use('/api/games/:id/apply', applyGameLimiter);
}

// Rutas con prefijo /api
if (authRoutes) {
    app.use('/api/auth', authRoutes);
    app.use('/api/usuarios', authRoutes);
    app.use('/usuarios', authRoutes);
}
if (gameRoutes) {
    app.use('/api/games', gameRoutes);
    app.use('/games', gameRoutes);
}
if (canchaRoutes) {
    app.use('/api/canchas', canchaRoutes);
    app.use('/canchas', canchaRoutes);
}
if (ubicacionRoutes) {
    app.use('/api/ubicaciones', ubicacionRoutes);
    app.use('/ubicaciones', ubicacionRoutes);
}
if (reporteRoutes) {
    app.use('/api/reportes', reporteRoutes);
    app.use('/reportes', reporteRoutes);
}

// Ruta de health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        routesLoaded: !!authRoutes
    });
});

// Error handler global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error en servidor:', err);
    res.status(500).json({ 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Exportar configuración de Cloudinary
export { cloudinary, CloudinaryStorage };

// Exportar app para Vercel
export default app;
