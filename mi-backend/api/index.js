// Handler para Vercel Serverless
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

// Importar rutas
const authRoutes = require('../routes/auth');
const gameRoutes = require('../routes/gameRoutes');
const reporteRoutes = require('../routes/reporteRoutes');
const ubicacionRoutes = require('../routes/ubicacionRoutes');

// Importar middlewares de seguridad
const { 
  loginLimiter, 
  registerLimiter, 
  passwordRecoveryLimiter,
  apiLimiter 
} = require('../middleware/rateLimiter');

const { sanitizeBodyMiddleware } = require('../middleware/sanitizer');

// Crear app Express
const app = express();

// Configuración de CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://ref-zone.vercel.app']
        : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'", "https://ref-zone.vercel.app"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'RefZone_Session_2025_Ultra_Secure_Secret_ghi789rst345',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ===== MIDDLEWARES DE SEGURIDAD =====
// Sanitización de inputs
app.use(sanitizeBodyMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);
app.use(['/api/usuarios/login', '/api/auth/login'], loginLimiter);
app.use(['/api/usuarios/registro', '/api/auth/register'], registerLimiter);
app.use(['/api/usuarios/recuperar', '/api/auth/recuperar'], passwordRecoveryLimiter);

// Conectar a MongoDB
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('✅ Conectado a MongoDB Atlas');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        throw error;
    }
};

// 🔥 ATENDER TANTO LA RUTA CON /api COMO SIN /api
app.get('/api/csrf-token', (req, res) => {
    console.log('🔒 CSRF token solicitado con /api');
    res.json({ 
        csrfToken: 'csrf-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        message: 'CSRF token generated successfully',
        timestamp: new Date().toISOString()
    });
});

app.get('/csrf-token', (req, res) => {
    console.log('🔒 CSRF token solicitado sin /api');
    res.json({ 
        csrfToken: 'csrf-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        message: 'CSRF token generated successfully',
        timestamp: new Date().toISOString()
    });
});

// Middleware para advertencia de Self-XSS
app.get('/self-xss-warning.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
        console.log('%c¡Advertencia!', 'color: red; font-size: 20px;');
        console.log('No pegues código aquí. Podrías ser víctima de un ataque.');
    `);
});

app.get('/api/self-xss-warning.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
        console.log('%c¡Advertencia!', 'color: red; font-size: 20px;');
        console.log('No pegues código aquí. Podrías ser víctima de un ataque.');
    `);
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // También sin el prefijo /api

// Rutas de juegos
app.use('/api/games', gameRoutes);
app.use('/games', gameRoutes); // También sin el prefijo /api

// Mapear /api/usuarios/login a authRoutes
app.use('/api/usuarios', authRoutes);

// AÑADIR: Ruta para canchas
app.use('/api/canchas', require('../routes/canchaRoutes'));
app.use('/canchas', require('../routes/canchaRoutes'));

// AÑADIR: Ruta para ubicaciones
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/ubicaciones', ubicacionRoutes);

// AÑADIR: Ruta para reportes PDF
app.use('/api/reportes', require('../routes/reporteRoutes'));
app.use('/reportes', require('../routes/reporteRoutes'));

// Handler principal para Vercel
module.exports = async (req, res) => {
    await connectToDatabase();
    return app(req, res);
};