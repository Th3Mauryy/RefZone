// Handler para Vercel Serverless
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

// Importar rutas
const authRoutes = require('../routes/auth');
const gameRoutes = require('../routes/gameRoutes');

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

// Handler principal para Vercel
module.exports = async (req, res) => {
    await connectToDatabase();

    // Crear app Express DENTRO del handler
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

    // 🔥 RUTAS DIRECTAS - LAS QUE NECESITAS
    app.get('/csrf-token', (req, res) => {
        console.log('🔒 CSRF token solicitado exitosamente');
        res.json({ 
            csrfToken: 'csrf-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            message: 'CSRF token generated successfully',
            timestamp: new Date().toISOString()
        });
    });

    app.get('/health', (req, res) => {
        console.log('🏥 Health check exitoso');
        res.json({ 
            status: 'OK', 
            message: 'RefZone API is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });

    // Rutas de autenticación y juegos
    app.use('/auth', authRoutes);
    app.use('/games', gameRoutes);

    // Manejar la petición
    return app(req, res);
};