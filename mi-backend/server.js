// Importaciones necesarias
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/gameRoutes');
const crearOrganizadorPorDefecto = require('./config/initOrganizador');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

// Crear la instancia de Express
const app = express();

// Middleware para procesar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para procesar cookies
app.use(cookieParser());

// Configuración de CORS (¡IMPORTANTE! Cambia el origin al puerto de tu frontend)
app.use(cors({
    origin: 'http://localhost:5173', // URL de tu frontend local
    credentials: true,               // Permitir envío de cookies
}));

// Configuración de sesiones
app.use(session({
    secret: 'mi-secreto',            // Cambiar en producción
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'Strict',
    },
}));

// Conexión a MongoDB Atlas
mongoose.connect('mongodb+srv://olired2:futbol7@cluster0.qfdl2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => {
        console.log('Conexión exitosa a MongoDB Atlas');
        crearOrganizadorPorDefecto(); // Crear organizador por defecto
    })
    .catch((error) => {
        console.error('Error al conectar a MongoDB Atlas:', error);
    });

// Rutas de API
app.use('/api/usuarios', authRoutes); // Rutas de autenticación
app.use('/api', gameRoutes);          // Rutas de partidos

// Middleware para servir archivos estáticos (opcional si usas React)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: 'da93e5w1o', // Tu cloud name
    api_key: '211741512968278', // Tu API key
    api_secret: 'Kk-2D27Ckh0CIztEfvyDmgWSMSQ', // Tu API secret
});

// Middleware para manejar CSRF
app.use(csrf({ cookie: true }));

// Ruta para obtener el token CSRF (puedes exponerlo al frontend)
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Middleware de seguridad adicional
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "script-src 'self'");
    next();
});

// Middleware para advertencia de Self-XSS
app.get('/self-xss-warning.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
        console.log('%c¡Advertencia!', 'color: red; font-size: 20px;');
        console.log('No pegues código aquí. Podrías ser víctima de un ataque.');
    `);
});

// Configuración de encabezados de seguridad
app.use(helmet());

// Configuración personalizada de encabezados
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY'); // Previene clickjacking
    res.setHeader('X-XSS-Protection', '1; mode=block'); // Protege contra XSS
    res.setHeader('Referrer-Policy', 'no-referrer'); // Controla la información del referer
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // Fuerza HTTPS
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()'); // Controla permisos
    next();
});

// Exportar configuración de Cloudinary para usarla en las rutas
module.exports = { cloudinary, CloudinaryStorage };

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
