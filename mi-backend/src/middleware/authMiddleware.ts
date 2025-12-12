import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

interface DecodedToken {
  _id?: string;
  id?: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware para verificar la autenticación mediante JWT
 * Verifica el token en los headers de autorización y decodifica la información del usuario
 */
const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;
    
    // 1. Intentar desde Authorization header (preferido)
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    
    // 2. Intentar desde query params (útil para descargas de archivos)
    if (!token && req.query.token) {
      token = req.query.token as string;
    }
    
    // 3. Si no hay token, devolver error
    if (!token) {
      console.log("No se encontró token de autenticación");
      res.status(401).json({ 
        message: "Token no proporcionado", 
        error: "missing_token", 
        help: "Asegúrate de enviar un token en el header Authorization o como parámetro token" 
      });
      return;
    }

    try {
      // Verifica el token con la clave secreta
      const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
      req.user = decoded as any;
      
      // Comprobar si tiene los campos mínimos necesarios
      const userId = decoded.id || decoded._id;
      if (!userId) {
        console.log("Token sin ID de usuario:", decoded);
        res.status(401).json({ 
          message: "Token inválido (falta ID de usuario)", 
          error: "invalid_token_missing_id" 
        });
        return;
      }
      
      console.log("Token verificado correctamente para usuario:", userId);
      next();
    } catch (jwtError: any) {
      console.error("Error al verificar token:", jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ 
          message: "El token ha expirado", 
          error: "token_expired",
          help: "Por favor, inicia sesión nuevamente"
        });
        return;
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({ 
          message: "Token inválido o malformado", 
          error: "invalid_token",
          help: "El token proporcionado no es válido"
        });
        return;
      }
      
      res.status(401).json({ 
        message: "Error de autenticación", 
        error: "auth_error",
        help: "Por favor, inicia sesión nuevamente"
      });
    }
  } catch (error) {
    console.error("Error general en middleware auth:", error);
    res.status(500).json({ 
      message: "Error interno del servidor", 
      error: "server_error" 
    });
  }
};

export default verifyToken;
