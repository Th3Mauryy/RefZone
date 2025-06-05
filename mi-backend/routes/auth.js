const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'mi-secreto-jwt-12345'; // Clave secreta desde .env o valor por defecto
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const verifyToken = require('../middleware/authMiddleware');

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: 'da93e5w1o',
    api_key: '211741512968278',
    api_secret: 'Kk-2D27Ckh0CIztEfvyDmgWSMSQ',
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
    const { email, password, nombre, edad, contacto, experiencia } = req.body;

    try {
        // Validaciones
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const nameRegex = /^[a-zA-Z\s]+$/;
        const contactRegex = /^\d{10}$/;

        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email inválido.' });
        }

        if (!nombre || !nameRegex.test(nombre)) {
            return res.status(400).json({ message: 'El nombre solo puede contener letras.' });
        }

        if (!edad || isNaN(edad) || edad <= 17 || edad > 50) {
            return res.status(400).json({ message: 'La edad debe ser un número entre 18 y 50.' });
        }

        if (!contacto || !contactRegex.test(contacto)) {
            return res.status(400).json({ message: 'El contacto debe contener exactamente 10 dígitos.' });
        }

        // Obtener la URL de la imagen subida a Cloudinary
        const imagenPerfil = req.file ? req.file.path : null;

        const newUser = new User({
            email,
            password, // No encriptes aquí, deja que el middleware lo haga
            role: 'arbitro',
            nombre,
            edad,
            contacto,
            experiencia,
            imagenPerfil, // Guardar la URL de Cloudinary
        });

        await newUser.save();
        res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign({ id: user._id, role: user.role }, 'mi-secreto-jwt-12345', { expiresIn: '1h' });

        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
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
            nombre: user.nombre,
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
router.get('/perfil/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Descifrar los campos sensibles
        const contactoDescifrado = user.decryptContacto();
        const emailDescifrado = user.decryptEmail();
        const nombreDescifrado = user.decryptNombre();

        res.status(200).json({
            ...user.toObject(),
            contacto: contactoDescifrado,
            email: emailDescifrado,
            nombre: nombreDescifrado,
        });
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil' });
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
        const recoveryLink = `http://refzone.netlify.app/resetear?token=${token}`;

        // Configurar el transporte de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Cambia esto si usas otro servicio
            auth: {
                user: 'maurymendoza021@gmail.com', // Tu email
                pass: 'wofm lgcl vkne epgl',      // Tu contraseña (o un token de aplicación)
            },
        });

        // Enviar correo con el enlace de recuperación
        await transporter.sendMail({
            from: '"Soporte Refzone" <maurymendoza021@gmail.com>',
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
        // Decodificar el token
        const decoded = jwt.verify(token, 'tu_clave_secreta'); // Cambia 'tu_clave_secreta' por una clave real o variable de entorno

        // Buscar al usuario por ID
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar la contraseña del usuario
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
});
module.exports = router;
