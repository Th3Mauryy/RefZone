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

// Ruta para registrarse
router.post('/registro', upload.single('imagenPerfil'), async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        console.log('Archivo recibido:', req.file);

        // Validaciones
        if (!req.body.email) {
            console.error('Email no proporcionado');
            return res.status(400).json({ message: 'Email es requerido' });
        }

        if (!req.body.password) {
            console.error('Contraseña no proporcionada');
            return res.status(400).json({ message: 'Contraseña es requerida' });
        }

        if (!req.body.nombre) {
            console.error('Nombre no proporcionado');
            return res.status(400).json({ message: 'Nombre es requerido' });
        }

        if (!req.body.edad || isNaN(req.body.edad) || req.body.edad <= 17 || req.body.edad > 50) {
            console.error('Edad inválida:', req.body.edad);
            return res.status(400).json({ message: 'La edad debe ser un número entre 18 y 50.' });
        }

        if (!req.body.contacto || !/^\d{10}$/.test(req.body.contacto)) {
            console.error('Contacto inválido:', req.body.contacto);
            return res.status(400).json({ message: 'El contacto debe contener exactamente 10 dígitos.' });
        }

        // Subir imagen a Cloudinary
        const imagenPerfil = req.file ? req.file.path : null;

        // Crear nuevo usuario con el rol "arbitro"
        const newUser = new User({
            email: req.body.email,
            password: req.body.password, // No encriptes aquí, deja que el middleware lo haga
            nombre: req.body.nombre,
            edad: req.body.edad,
            contacto: req.body.contacto,
            experiencia: req.body.experiencia,
            imagenPerfil,
            role: 'arbitro', // Rol por defecto
        });

        await newUser.save();
        console.log('Usuario registrado:', newUser);
        res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Datos recibidos en /login:', { email, password }); // Log para depuración

    try {
        // Buscar al usuario directamente con el email normalizado
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.error('Usuario no encontrado con el email:', normalizedEmail);
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Verificar la contraseña
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.error('Contraseña inválida para el usuario:', normalizedEmail);
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
        console.log('Token generado:', token); // Log para depuración

        // Redirigir según el rol del usuario
        const redirect = user.role === 'organizador' ? '/dashboard-organizador' : '/dashboard';

        res.status(200).json({ message: 'Inicio de sesión exitoso', token, redirect });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

router.get('/check-session', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({
      userId: user._id,
      nombre: user.nombre, // Corregido: enviar 'nombre' en lugar de 'name'
      imagenPerfil: user.imagenPerfil,
    });
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    res.status(500).json({ message: 'Error del servidor' });
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
            return res.status(400).json({ message: 'El email ya está registrado' });
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
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
