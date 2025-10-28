const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production'; // Clave secreta desde .env o valor por defecto
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const verifyToken = require('../middleware/authMiddleware');
const crypto = require('crypto');
const partidoService = require('../services/partidoService');
const HistorialPartido = require('../models/HistorialPartido');

// Importar security logger
const { logAuthAttempt, logCriticalAction } = require('../middleware/securityLogger');

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de multer con Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'user-profiles',
        format: async (req, file) => 'png', // Formato de las imágenes
        public_id: (req, file) => Date.now(), // Nombre único para cada archivo
    },
});

const upload = multer({ storage });

// Ruta para registrarse - OPTIMIZADA
router.post('/registro', upload.single('imagenPerfil'), async (req, res) => {
    try {
        const { email, password, nombre, edad, contacto, experiencia } = req.body;

        // Validaciones rápidas ANTES de procesar
        if (!email || !password || !nombre) {
            return res.status(400).json({ message: 'Email, contraseña y nombre son requeridos' });
        }

        const edadNum = parseInt(edad);
        if (isNaN(edadNum) || edadNum < 18 || edadNum > 50) {
            return res.status(400).json({ message: 'La edad debe ser entre 18 y 50' });
        }

        if (!/^\d{10}$/.test(contacto)) {
            return res.status(400).json({ message: 'El contacto debe tener 10 dígitos' });
        }

        // CRÍTICO: Verificar email duplicado ANTES de procesar imagen
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail }).select('_id').lean();
        if (existingUser) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }

        // Crear usuario (imagen ya subida por multer)
        const newUser = new User({
            email: normalizedEmail,
            password,
            nombre: nombre.trim(),
            edad: edadNum,
            contacto,
            experiencia: experiencia || '',
            imagenPerfil: req.file ? req.file.path : null,
            role: 'arbitro'
        });

        await newUser.save();
        
        res.status(201).json({ 
            message: 'Registro exitoso',
            user: { id: newUser._id, nombre: newUser.nombre }
        });
    } catch (error) {
        console.error('Error registro:', error.message);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Ruta para iniciar sesión - OPTIMIZADA
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario solo con los campos necesarios
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail })
            .select('_id email password role nombre imagenPerfil')
            .lean();
        
        if (!user) {
            // LOG: Intento fallido - usuario no existe
            logAuthAttempt(req, false, 'Usuario no encontrado');
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña directamente
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // LOG: Intento fallido - contraseña incorrecta
            logAuthAttempt(req, false, 'Contraseña incorrecta');
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // LOG: Login exitoso
        logAuthAttempt(req, true);

        // Generar token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email }, 
            jwtSecret, 
            { expiresIn: '7d' }
        );

        // Respuesta optimizada con datos mínimos
        res.status(200).json({ 
            token, 
            redirect: user.role === 'organizador' ? '/dashboard-organizador' : '/dashboard',
            user: {
                id: user._id,
                nombre: user.nombre,
                role: user.role,
                imagenPerfil: user.imagenPerfil
            }
        });
    } catch (error) {
        console.error('Error login:', error.message);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

/**
 * Verifica el estado de la sesión del usuario actual
 * Requiere token de autenticación
 * Devuelve información básica del usuario
 */
router.get('/check-session', verifyToken, async (req, res) => {
  try {
    // Validar que existe un ID de usuario en el token
    if (!req.user || !req.user.id) {
      console.error('Token sin ID de usuario:', req.user);
      return res.status(401).json({ 
        message: 'Token inválido - falta ID de usuario',
        success: false
      });
    }
    
    console.log('Verificando sesión para usuario:', req.user.id);
    
    // Usar .lean() para obtener un objeto JavaScript puro y evitar problemas
    const user = await User.findById(req.user.id)
      .select('_id nombre email role imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones')
      .lean()
      .exec();
    
    if (!user) {
      console.error('Usuario no encontrado en la base de datos:', req.user.id);
      return res.status(404).json({ 
        message: 'Usuario no encontrado en la base de datos',
        success: false 
      });
    }
    
    // Si llegamos aquí, la sesión es válida
    console.log('Sesión válida para:', user.nombre || user.email);
    
    // Guardar en localStorage los datos básicos del usuario
    // Esto se hace enviando instrucciones al cliente
    res.status(200).json({
      success: true,
      userId: user._id,
      nombre: user.nombre,
      email: user.email,
      imagenPerfil: user.imagenPerfil,
      role: user.role,
      edad: user.edad,
      contacto: user.contacto,
      experiencia: user.experiencia,
      calificacionPromedio: user.calificacionPromedio || 0,
      totalCalificaciones: user.totalCalificaciones || 0,
      // Incluir instrucciones para el cliente
      storeLocally: true,
      storeFields: ['userId', 'nombre', 'email', 'role']
    });
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor', 
      error: error.message,
      success: false
    });
  }
});

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.status(200).json({ message: 'Sesión cerrada con éxito' });
    });
});

/**
 * Ruta para listar todos los usuarios
 * Requiere autenticación (token válido)
 * Devuelve array de usuarios sin contraseñas
 */
router.get('/usuarios', verifyToken, async (req, res) => {
    try {
        console.log('📋 Listando usuarios - Solicitado por:', req.user.id);
        
        // Obtener todos los usuarios sin incluir la contraseña ni datos internos
        const usuarios = await User.find()
            .select('-password -__v')
            .lean()
            .exec();
        
        console.log(`✅ ${usuarios.length} usuarios encontrados`);
        
        res.status(200).json({
            success: true,
            count: usuarios.length,
            usuarios: usuarios
        });
    } catch (error) {
        console.error('❌ Error al listar usuarios:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener la lista de usuarios',
            error: error.message 
        });
    }
});

// Ruta para obtener el perfil del usuario
router.get('/perfil/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Devolver datos del usuario sin la contraseña
        const { password, ...userWithoutPassword } = user.toObject();
        
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil' });
    }
});

// Ruta para editar perfil
router.put('/editar-perfil', verifyToken, upload.single('imagenPerfil'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, contacto, experiencia } = req.body;

        // Validaciones
        if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        if (contacto && !/^\d{10}$/.test(contacto)) {
            return res.status(400).json({ message: 'El contacto debe contener exactamente 10 dígitos.' });
        }

        if (experiencia && experiencia.length < 10) {
            return res.status(400).json({ message: 'Describe tu experiencia con al menos 10 caracteres.' });
        }

        // Buscar el usuario actual
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar si el email ya existe en otro usuario
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: 'El email ya está en uso por otro usuario' });
            }
        }

        // Preparar datos para actualizar
        const updateData = {};
        if (email) updateData.email = email.trim().toLowerCase();
        if (contacto) updateData.contacto = contacto;
        if (experiencia) updateData.experiencia = experiencia;

        // Si hay nueva imagen, actualizar
        if (req.file) {
            updateData.imagenPerfil = req.file.path;
        }

        // Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { 
            new: true,
            runValidators: true 
        });

        if (!updatedUser) {
            return res.status(404).json({ message: 'Error al actualizar el usuario' });
        }

        // Responder con datos actualizados (sin contraseña)
        const { password, ...userWithoutPassword } = updatedUser.toObject();
        
        res.status(200).json({ 
            message: 'Perfil actualizado exitosamente',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error al editar perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Ruta para recuperar contraseña
router.post('/recuperar', async (req, res) => {
    const { email } = req.body;

    try {
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Generar un token único para la recuperación
        const token = user.generateAuthToken(); // Puedes usar tu método existente o crear un token único
        const recoveryLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetear?token=${token}`;

        // Configurar el transporte de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Enviar correo con el enlace de recuperación
        await transporter.sendMail({
            from: `"Soporte Refzone" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recuperación de Contraseña',
            text: `Hola ${user.nombre}, sigue este enlace para recuperar tu contraseña: ${recoveryLink}`,
            html: `<p>Hola ${user.nombre},</p><p>Sigue este enlace para recuperar tu contraseña:</p><a href="${recoveryLink}">${recoveryLink}</a>`,
        });

        res.status(200).json({ message: 'Correo de recuperación enviado con éxito' });
    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        res.status(500).json({ message: 'Error al enviar el correo de recuperación' });
    }
});
router.post('/resetear', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        console.log("Token recibido:", token);
        console.log("Nueva contraseña recibida:", newPassword);

        // Decodificar el token
        const decoded = jwt.verify(token, jwtSecret);
        console.log("Datos decodificados del token:", decoded);

        // Buscar al usuario por ID
        const user = await User.findById(decoded._id);
        if (!user) {
            console.log("Usuario no encontrado con el ID:", decoded._id);
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar la contraseña del usuario
        user.password = newPassword;
        await user.save();
        console.log("Contraseña actualizada correctamente para el usuario:", user);

        res.status(200).json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error.message, error.stack);
        res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
});

// Ruta para obtener estadísticas del usuario
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const Game = require('../models/Game');

        // Obtener todas las aplicaciones del usuario
        const userApplications = await Game.find({ 'postulados': userId });
        const totalApplications = userApplications.length;

        // Obtener juegos aceptados (donde el usuario es el árbitro)
        const acceptedGames = await Game.find({ 'arbitro': userId });
        const acceptedCount = acceptedGames.length;

        // Obtener aplicaciones pendientes (postulado pero sin árbitro asignado)
        const pendingApplications = await Game.find({ 
            'postulados': userId, 
            'arbitro': { $exists: false } 
        });
        const pendingCount = pendingApplications.length;

        res.status(200).json({
            totalApplications,
            acceptedGames: acceptedCount,
            pendingApplications: pendingCount
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas del usuario' });
    }
});

// ⭐ AGREGAR: Ruta para register (alias de registro) - DESPUÉS de la ruta /registro
router.post('/register', upload.single('imagenPerfil'), async (req, res) => {
    try {
        console.log('📝 Datos recibidos en /register:', req.body);
        console.log('📸 Archivo recibido:', req.file);

        // Validaciones básicas
        if (!req.body.email || !req.body.password || !req.body.nombre) {
            return res.status(400).json({ 
                message: 'Email, contraseña y nombre son requeridos' 
            });
        }

        if (!req.body.edad || isNaN(req.body.edad) || req.body.edad <= 17 || req.body.edad > 50) {
            return res.status(400).json({ 
                message: 'La edad debe ser un número entre 18 y 50.' 
            });
        }

        if (!req.body.contacto || !/^\d{10}$/.test(req.body.contacto)) {
            return res.status(400).json({ 
                message: 'El contacto debe contener exactamente 10 dígitos.' 
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }

        // Subir imagen a Cloudinary si existe
        const imagenPerfil = req.file ? req.file.path : null;

        // Crear nuevo usuario
        const newUser = new User({
            email: req.body.email,
            password: req.body.password, // Se hashea automáticamente en el modelo
            nombre: req.body.nombre,
            edad: parseInt(req.body.edad),
            contacto: req.body.contacto,
            experiencia: req.body.experiencia || '',
            imagenPerfil,
            role: 'arbitro',
        });

        await newUser.save();
        console.log('✅ Usuario registrado exitosamente:', newUser.email);
        
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser._id,
                email: newUser.email,
                nombre: newUser.nombre
            }
        });
    } catch (error) {
        console.error('❌ Error en el registro:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * Ruta para calificar a un árbitro después de un partido finalizado
 * Solo puede calificar el organizador del partido
 * Calificación de 1 a 5 estrellas con comentario opcional
 */
router.post('/calificar-arbitro', verifyToken, async (req, res) => {
    try {
        const { partidoId, arbitroId, estrellas, comentario } = req.body;
        const organizadorId = req.user.id;
        
        // Validaciones
        if (!partidoId || !arbitroId || !estrellas) {
            return res.status(400).json({ 
                message: 'partidoId, arbitroId y estrellas son requeridos' 
            });
        }
        
        if (estrellas < 1 || estrellas > 5) {
            return res.status(400).json({ 
                message: 'La calificación debe ser entre 1 y 5 estrellas' 
            });
        }
        
        // Verificar que el partido existe en el historial
        const partido = await HistorialPartido.findById(partidoId);
        if (!partido) {
            return res.status(404).json({ 
                message: 'Partido no encontrado en el historial' 
            });
        }
        
        // Verificar que el partido ya fue calificado
        if (partido.calificado) {
            return res.status(400).json({ 
                message: 'Este partido ya fue calificado' 
            });
        }
        
        // Verificar que el árbitro del partido coincide
        if (!partido.arbitro || partido.arbitro.toString() !== arbitroId) {
            return res.status(400).json({ 
                message: 'El árbitro no coincide con el partido' 
            });
        }
        
        // Buscar el árbitro
        const arbitro = await User.findById(arbitroId);
        if (!arbitro) {
            return res.status(404).json({ 
                message: 'Árbitro no encontrado' 
            });
        }
        
        // Verificar que ya no haya calificado este partido antes
        const yaCalificado = arbitro.calificaciones.some(
            cal => cal.partidoId.toString() === partidoId
        );
        
        if (yaCalificado) {
            return res.status(400).json({ 
                message: 'Ya calificaste a este árbitro por este partido' 
            });
        }
        
        // Agregar calificación al árbitro
        arbitro.calificaciones.push({
            organizadorId,
            partidoId,
            estrellas,
            comentario: comentario || '',
            fecha: new Date()
        });
        
        // Recalcular promedio
        const totalEstrellas = arbitro.calificaciones.reduce((sum, cal) => sum + cal.estrellas, 0);
        const totalCalificaciones = arbitro.calificaciones.length;
        arbitro.calificacionPromedio = totalEstrellas / totalCalificaciones;
        arbitro.totalCalificaciones = totalCalificaciones;
        
        await arbitro.save();
        
        // Marcar partido como calificado
        partido.calificado = true;
        await partido.save();
        
        console.log(`⭐ Árbitro ${arbitro.nombre} calificado con ${estrellas} estrellas. Promedio: ${arbitro.calificacionPromedio.toFixed(2)}`);
        
        res.status(200).json({ 
            message: 'Calificación registrada exitosamente',
            arbitro: {
                id: arbitro._id,
                nombre: arbitro.nombre,
                calificacionPromedio: arbitro.calificacionPromedio,
                totalCalificaciones: arbitro.totalCalificaciones
            }
        });
    } catch (error) {
        console.error('Error al calificar árbitro:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * Ruta para verificar partidos finalizados y obtener pendientes de calificación
 * Ejecuta la verificación automática y retorna partidos a calificar
 */
router.get('/verificar-partidos', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('🔍 Verificando partidos para usuario:', userId);
        
        // Ejecutar verificación automática
        const resultado = await partidoService.verificarYFinalizarPartidos();
        
        console.log('📊 Resultado de verificación:', {
            finalizados: resultado.finalizados.length,
            porCalificar: Object.keys(resultado.porCalificar).map(canchaId => ({
                canchaId,
                cantidad: resultado.porCalificar[canchaId].length
            }))
        });
        
        // Buscar cancha del organizador
        const user = await User.findById(userId).select('canchaAsignada');
        if (!user || !user.canchaAsignada) {
            console.log('⚠️ Usuario sin cancha asignada');
            return res.status(200).json({ 
                finalizados: resultado.finalizados.length,
                pendientesCalificacion: []
            });
        }
        
        const canchaId = user.canchaAsignada.toString();
        const pendientes = resultado.porCalificar[canchaId] || [];
        
        console.log(`✅ Cancha del organizador: ${canchaId}`);
        console.log(`📋 Pendientes para esta cancha: ${pendientes.length}`);
        
        res.status(200).json({
            finalizados: resultado.finalizados.length,
            pendientesCalificacion: pendientes
        });
    } catch (error) {
        console.error('Error al verificar partidos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * Ruta para obtener partidos pendientes de calificación del organizador
 */
router.get('/partidos-pendientes-calificacion', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Buscar cancha del organizador
        const user = await User.findById(userId).select('canchaAsignada');
        if (!user || !user.canchaAsignada) {
            return res.status(200).json({ pendientes: [] });
        }
        
        const HistorialPartido = require('../models/HistorialPartido');
        
        // Buscar partidos pendientes de calificación (SOLO finalizados, NO cancelados)
        const pendientes = await HistorialPartido.find({
            canchaId: user.canchaAsignada,
            arbitro: { $ne: null },
            calificado: false,
            estado: 'Finalizado' // CRÍTICO: Excluir partidos cancelados
        })
        .populate('arbitro', 'nombre email imagenPerfil calificacionPromedio totalCalificaciones')
        .sort({ fechaEliminacion: -1 });
        
        res.status(200).json({ pendientes });
    } catch (error) {
        console.error('Error al obtener pendientes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
