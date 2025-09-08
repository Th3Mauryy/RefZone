// Handler para Vercel Serverless
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

// Importar rutas
const authRoutes = require('../routes/auth');
const gameRoutes = require('../routes/gameRoutes');

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
app.use(helmet());
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

// 🔥 RUTA CSRF - AGREGAR ESTA LÍNEA
app.get('/csrf-token', (req, res) => {
    console.log('🔒 CSRF token solicitado');
    res.json({ 
        csrfToken: 'csrf-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        message: 'CSRF token generated successfully',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    console.log('🏥 Health check solicitado');
    res.json({ 
        status: 'OK', 
        message: 'RefZone API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🔥 AGREGAR: Ruta para usuarios/login (compatibilidad)
app.post('/usuarios/login', (req, res) => {
    console.log('👤 Login de usuario redirigido a /auth/login');
    // Redirigir internamente a la ruta correcta
    req.url = '/auth/login';
    return authRoutes(req, res);
});

// Rutas API
app.use('/auth', authRoutes);
app.use('/games', gameRoutes);

// Middleware de error 404
app.use('*', (req, res) => {
    console.log('❌ Ruta no encontrada:', req.method, req.originalUrl);
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Handler principal para Vercel
module.exports = async (req, res) => {
    await connectToDatabase();
    return app(req, res);
};