const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production'; // Clave secreta desde .env o valor por defecto

/**
 * Middleware para verificar la autenticación mediante JWT
 * Verifica el token en los headers de autorización y decodifica la información del usuario
 */
const verifyToken = (req, res, next) => {
  try {
    // Intentar obtener el token de diferentes fuentes
    let token;
    
    // 1. Intentar desde Authorization header (preferido)
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    
    // 2. Intentar desde query params (útil para descargas de archivos)
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    // 3. Si no hay token, devolver error
    if (!token) {
      console.log("No se encontró token de autenticación");
      return res.status(401).json({ 
        message: "Token no proporcionado", 
        error: "missing_token", 
        help: "Asegúrate de enviar un token en el header Authorization o como parámetro token" 
      });
    }

    try {
      // Verifica el token con la clave secreta
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // Agrega los datos del usuario al objeto `req`
      
      // Comprobar si tiene los campos mínimos necesarios
      if (!decoded.id) {
        console.log("Token sin ID de usuario:", decoded);
        return res.status(401).json({ 
          message: "Token inválido (falta ID de usuario)", 
          error: "invalid_token_missing_id" 
        });
      }
      
      console.log("Token verificado correctamente para usuario:", decoded.id);
      next();
    } catch (jwtError) {
      console.error("Error al verificar token:", jwtError.message);
      
      // Mensajes de error más descriptivos
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: "El token ha expirado", 
          error: "token_expired",
          help: "Por favor, inicia sesión nuevamente"
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: "Token inválido o malformado", 
          error: "invalid_token",
          help: "El token proporcionado no es válido"
        });
      }
      
      return res.status(401).json({ 
        message: "Error de autenticación", 
        error: "auth_error",
        help: "Por favor, inicia sesión nuevamente"
      });
    }
  } catch (error) {
    console.error("Error general en middleware auth:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor", 
      error: "server_error" 
    });
  }
};

module.exports = verifyToken;