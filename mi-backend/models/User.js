// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secretKey = 'mi-clave-secreta';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nombre: { type: String, required: true },
    edad: { type: Number, required: true },
    contacto: { type: String, required: true },
    experiencia: { type: String, required: true },
    imagenPerfil: { type: String, default: null }, // Ruta de la imagen de perfil
    role: { type: String, default: 'arbitro' }, // Rol del usuario
});

// Método para comparar la contraseña en el inicio de sesión
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar el token JWT
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, role: this.role }, 'mi-secreto-jwt-12345', { expiresIn: '1h' });
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

userSchema.pre('save', function (next) {
    if (this.isModified('contacto')) {
        const cipher = crypto.createCipher('aes-256-cbc', secretKey);
        this.contacto = cipher.update(this.contacto, 'utf8', 'hex') + cipher.final('hex');
    }
    if (this.isModified('email')) {
        const cipher = crypto.createCipher('aes-256-cbc', secretKey);
        this.email = cipher.update(this.email, 'utf8', 'hex') + cipher.final('hex');
    }
    if (this.isModified('nombre')) {
        const cipher = crypto.createCipher('aes-256-cbc', secretKey);
        this.nombre = cipher.update(this.nombre, 'utf8', 'hex') + cipher.final('hex');
    }
    next();
});

userSchema.methods.decryptContacto = function () {
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
    return decipher.update(this.contacto, 'hex', 'utf8') + decipher.final('utf8');
};

userSchema.methods.decryptEmail = function () {
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
    return decipher.update(this.email, 'hex', 'utf8') + decipher.final('utf8');
};

userSchema.methods.decryptNombre = function () {
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
    return decipher.update(this.nombre, 'hex', 'utf8') + decipher.final('utf8');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
