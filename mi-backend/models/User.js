// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Cargar variables de entorno
require('dotenv').config();

// Usar variables de entorno en lugar de claves hardcodeadas
const secretKey = process.env.BCRYPT_SECRET || 'secure-bcrypt-fallback';

/**
 * Schema de Usuario para MongoDB
 * Define la estructura de datos para usuarios del sistema (árbitros y organizadores)
 */
const userSchema = new mongoose.Schema({
    /** Email único del usuario, utilizado para autenticación */
    email: { type: String, required: true, unique: true },
    
    /** Contraseña hasheada con bcrypt */
    password: { type: String, required: true },
    
    /** Nombre completo del usuario */
    nombre: { type: String, required: true },
    
    /** Edad del usuario (requerida para validaciones deportivas) */
    edad: { type: Number, required: true },
    
    /** Información de contacto (teléfono, WhatsApp, etc.) */
    contacto: { type: String, required: true },
    
    /** Nivel de experiencia del árbitro (principiante, intermedio, avanzado) */
    experiencia: { type: String, required: true },
    
    /** URL de la imagen de perfil almacenada en Cloudinary */
    imagenPerfil: { type: String, default: null },
    
    /** Rol del usuario: 'arbitro' o 'organizador' */
    role: { type: String, default: 'arbitro' },
    
    /** Referencia a la cancha asignada (solo para organizadores) */
    canchaAsignada: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cancha',
        default: null 
    },
});

/**
 * Compara la contraseña proporcionada con la contraseña hasheada del usuario
 * @param {string} candidatePassword - La contraseña en texto plano a verificar
 * @returns {Promise<boolean>} - True si las contraseñas coinciden, false en caso contrario
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Genera un token JWT para autenticación del usuario
 * @returns {string} - Token JWT firmado con datos del usuario
 */
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET || 'secure-jwt-fallback', { expiresIn: '1h' });
    return token;
};

// Encriptar la contraseña antes de guardar el usuario
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    // Verificar si la contraseña ya está encriptada
    if (this.password.startsWith('$2b$')) {
        console.log('Contraseña ya está encriptada. No se volverá a encriptar.');
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Contraseña encriptada:', this.password); // Log para depuración
    next();
});

// Eliminar referencias innecesarias a `key` y `iv` en el middleware pre('save')
userSchema.pre('save', function (next) {
    if (this.isModified('contacto')) {
        // Normalizar el contacto sin cifrado
        this.contacto = this.contacto.trim();
    }
    if (this.isModified('email')) {
        // Normalizar el email
        this.email = this.email.trim().toLowerCase();
    }
    if (this.isModified('nombre')) {
        // Normalizar el nombre sin cifrado
        this.nombre = this.nombre.trim();
    }
    console.log('Datos normalizados:', { contacto: this.contacto, email: this.email, nombre: this.nombre });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
