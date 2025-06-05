// filepath: c:\Users\maury\OneDrive\Escritorio\Proyecto_Especialidad\mi-backend\middleware\authMiddleware.js
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'mi-secreto-jwt-12345'; // Clave secreta desde .env o valor por defecto

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1]; // El token debe estar en el formato "Bearer <token>"
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret); // Verifica el token con la clave secreta
        req.user = decoded; // Agrega los datos del usuario al objeto `req`
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = verifyToken;