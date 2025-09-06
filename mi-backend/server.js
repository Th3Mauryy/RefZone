// Cargar variables de entorno PRIMERO
// Prioridad: .env.local > .env > defaults
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Importaciones necesarias
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/gameRoutes');
const crearOrganizadorPorDefecto = require('./config/initOrganizador');
const crearCanchaGolwin = require('./config/initCancha');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cron = require('node-cron');
const Game = require('./models/Game');
const User = require('./models/User');
const nodemailer = require('nodemailer');

// Crear la instancia de Express
const app = express();

// Middleware para procesar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para procesar cookies
app.use(cookieParser());

// Configuración de CORS (¡IMPORTANTE! Cambia el origin al puerto de tu frontend)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // URL de tu frontend
    credentials: true,               // Permitir envío de cookies
}));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'secure-session-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'Strict',
    },
}));

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/refzone')
    .then(() => {
        console.log('Conexión exitosa a MongoDB Atlas');
        crearOrganizadorPorDefecto(); // Crear organizador por defecto
        crearCanchaGolwin(); // Crear cancha Golwin y asignar organizador
        
        // Iniciar tarea programada para auto-eliminar partidos
        iniciarAutoEliminacionPartidos();
    })
    .catch((error) => {
        console.error('Error al conectar a MongoDB Atlas:', error);
    });

// Función para auto-eliminar partidos 1 hora después de su hora programada
function iniciarAutoEliminacionPartidos() {
    // Ejecutar cada 30 minutos
    cron.schedule('*/30 * * * *', async () => {
        try {
            console.log('🔍 Verificando partidos para auto-eliminación...');
            
            const ahora = new Date();
            
            // Buscar partidos que deberían eliminarse (1 hora después de su hora programada)
            const partidos = await Game.find()
                .populate('arbitro', 'nombre email')
                .populate('postulados', 'nombre email');
            
            for (const partido of partidos) {
                try {
                    // Construir la fecha y hora del partido
                    let fechaPartido;
                    
                    if (typeof partido.date === 'string' && typeof partido.time === 'string') {
                        fechaPartido = new Date(`${partido.date}T${partido.time}`);
                    } else {
                        continue; // Saltar si no tiene formato válido
                    }
                    
                    // Verificar si es una fecha válida
                    if (isNaN(fechaPartido)) {
                        continue;
                    }
                    
                    // Agregar 1 hora a la fecha del partido
                    const fechaEliminacion = new Date(fechaPartido.getTime() + (60 * 60 * 1000));
                    
                    // Si ya pasó 1 hora desde el partido, eliminarlo
                    if (ahora >= fechaEliminacion) {
                        console.log(`🗑️ Auto-eliminando partido: ${partido.name} (programado para ${fechaPartido})`);
                        
                        // Configurar transporte de correo
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS,
                            },
                        });
                        
                        // Función para formatear fecha y hora
                        const formatGameDateTime = (game) => {
                            const dateTime = new Date(`${game.date}T${game.time}`);
                            if (isNaN(dateTime)) {
                                return { formattedDate: 'Fecha no disponible', formattedTime: 'Hora no disponible' };
                            }
                            
                            const day = dateTime.getDate();
                            const month = dateTime.toLocaleString('es-ES', { month: 'long' });
                            const year = dateTime.getFullYear();
                            const hours = dateTime.getHours();
                            const minutes = dateTime.getMinutes().toString().padStart(2, '0');
                            const period = hours >= 12 ? 'PM' : 'AM';
                            const formattedHour = hours % 12 || 12;
                            
                            const formattedDate = `el día ${day} de ${month} del ${year}`;
                            const formattedTime = `a las ${formattedHour}:${minutes} ${period}`;
                            
                            return { formattedDate, formattedTime };
                        };
                        
                        const { formattedDate, formattedTime } = formatGameDateTime(partido);
                        
                        // Enviar correos de notificación
                        const emailPromises = [];
                        
                        // Correo al árbitro (si existe)
                        if (partido.arbitro) {
                            const arbitroMailOptions = {
                                from: `"Soporte Refzone" <${process.env.EMAIL_USER}>`,
                                to: partido.arbitro.email,
                                subject: 'Partido Finalizado - RefZone',
                                html: `<p>Hola <strong>${partido.arbitro.nombre}</strong>,</p>
<p>Te informamos que el partido <strong>"${partido.name}"</strong> programado para <strong>${formattedDate}</strong> <strong>${formattedTime}</strong> en <strong>${partido.location}</strong> ha sido <span style="color: blue; font-weight: bold;">finalizado</span> automáticamente del sistema.</p>
<p>Esperamos que el partido haya transcurrido exitosamente.</p>
<p>¡Gracias por ser parte de RefZone!</p>
<p>Saludos,<br>Equipo RefZone</p>`
                            };
                            emailPromises.push(transporter.sendMail(arbitroMailOptions));
                        }
                        
                        // Correos a postulados (si no hay árbitro)
                        if (partido.postulados && partido.postulados.length > 0) {
                            partido.postulados.forEach(postulado => {
                                const postuladoMailOptions = {
                                    from: `"Soporte Refzone" <${process.env.EMAIL_USER}>`,
                                    to: postulado.email,
                                    subject: 'Partido Finalizado - RefZone',
                                    html: `<p>Hola <strong>${postulado.nombre}</strong>,</p>
<p>Te informamos que el partido <strong>"${partido.name}"</strong> para el cual te habías postulado, programado para <strong>${formattedDate}</strong> <strong>${formattedTime}</strong> en <strong>${partido.location}</strong>, ha sido <span style="color: blue; font-weight: bold;">finalizado</span> automáticamente del sistema.</p>
<p>¡Gracias por tu interés en participar!</p>
<p>Saludos,<br>Equipo RefZone</p>`
                                };
                                emailPromises.push(transporter.sendMail(postuladoMailOptions));
                            });
                        }
                        
                        // Eliminar el partido y enviar correos
                        await Game.findByIdAndDelete(partido._id);
                        
                        // Enviar correos (sin bloquear si fallan)
                        try {
                            await Promise.all(emailPromises);
                            console.log(`✅ Partido ${partido.name} eliminado y correos enviados`);
                        } catch (emailError) {
                            console.error('⚠️ Error al enviar correos de finalización:', emailError);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error procesando partido ${partido.name}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Error en tarea de auto-eliminación:', error);
        }
    });
    
    console.log('⏰ Tarea de auto-eliminación de partidos iniciada (cada 30 minutos)');
}

// Rutas de API
app.use('/api/usuarios', authRoutes); // Rutas de autenticación
app.use('/api', gameRoutes);          // Rutas de partidos

// Middleware para servir archivos estáticos (opcional si usas React)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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
