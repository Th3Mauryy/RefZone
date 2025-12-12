import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as emailService from '../services/emailService';
import { logAuthAttempt } from '../middleware';

// ============================================
// REGISTRO
// ============================================
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, nombre, edad, contacto, experiencia } = req.body;
    const imagenPerfil = req.file ? req.file.path : null;

    // Validar datos
    const validation = authService.validateRegistration({
      email, password, nombre, 
      edad: parseInt(edad), 
      contacto, experiencia
    });

    if (!validation.valid) {
      res.status(400).json({ message: validation.errors.join('. '), errors: validation.errors });
      return;
    }

    if (!imagenPerfil) {
      res.status(400).json({ message: 'Debes subir una foto de perfil' });
      return;
    }

    const result = await authService.registerUser({
      email, password, nombre,
      edad: parseInt(edad),
      contacto, experiencia,
      imagenPerfil
    });

    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(201).json({
      message: 'Registro exitoso',
      user: result.data
    });
  } catch (error: any) {
    console.error('Error registro:', error.message);
    if (error.code === 11000) {
      res.status(409).json({ message: 'El email ya está registrado' });
      return;
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ============================================
// LOGIN
// ============================================
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    if (!result.success) {
      logAuthAttempt(req, false, result.message);
      res.status(401).json({ message: result.message });
      return;
    }

    logAuthAttempt(req, true);

    res.status(200).json({
      token: result.token,
      redirect: result.redirect,
      user: result.user
    });
  } catch (error: any) {
    console.error('Error login:', error.message);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

// ============================================
// CHECK SESSION
// ============================================
export async function checkSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      res.status(401).json({ message: 'Token inválido - falta ID de usuario', success: false });
      return;
    }

    const user = await authService.checkSession(userId);

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado', success: false });
      return;
    }

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
      canchaAsignada: user.canchaAsignada || null,
      storeLocally: true,
      storeFields: ['userId', 'nombre', 'email', 'role']
    });
  } catch (error: any) {
    console.error('Error al verificar la sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message, success: false });
  }
}

// ============================================
// LOGOUT
// ============================================
export function logout(req: Request, res: Response): void {
  req.session?.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      res.status(500).json({ message: 'Error al cerrar sesión' });
      return;
    }
    res.status(200).json({ message: 'Sesión cerrada con éxito' });
  });
}

// ============================================
// LISTAR USUARIOS
// ============================================
export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const usuarios = await authService.listUsers();

    res.status(200).json({
      success: true,
      count: usuarios.length,
      usuarios
    });
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la lista de usuarios', error: error.message });
  }
}

// ============================================
// OBTENER PERFIL
// ============================================
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await authService.getProfile(req.params.id);
    
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
}

// ============================================
// EDITAR PERFIL
// ============================================
export async function editProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as any).id;
    const { email, contacto, experiencia, currentPassword, newPassword } = req.body;

    // Validaciones
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      res.status(400).json({ message: 'Email inválido' });
      return;
    }

    if (contacto && !/^\d{10}$/.test(contacto)) {
      res.status(400).json({ message: 'El contacto debe contener exactamente 10 dígitos.' });
      return;
    }

    if (experiencia && experiencia.length < 10) {
      res.status(400).json({ message: 'Describe tu experiencia con al menos 10 caracteres.' });
      return;
    }

    // Validar cambio de contraseña
    let passwordData: { currentPassword: string; newPassword: string } | undefined;
    if (newPassword || currentPassword) {
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: 'Para cambiar la contraseña, debes proporcionar tanto la contraseña actual como la nueva' });
        return;
      }

      const pwdValidation = authService.validatePasswordChange(newPassword);
      if (!pwdValidation.valid) {
        res.status(400).json({ message: pwdValidation.message });
        return;
      }

      passwordData = { currentPassword, newPassword };
    }

    const result = await authService.updateProfile(
      userId,
      { email, contacto, experiencia, imagenPerfil: req.file?.path },
      passwordData
    );

    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user: result.data
    });
  } catch (error) {
    console.error('Error al editar perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ============================================
// RECUPERAR CONTRASEÑA
// ============================================
export async function recoverPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      res.status(400).json({ message: 'Email inválido' });
      return;
    }

    const result = await authService.generatePasswordResetToken(email);

    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    // Enviar email
    await emailService.sendPasswordResetEmail(email, result.data.nombre, result.data.recoveryLink);

    res.status(200).json({ message: 'Correo de recuperación enviado con éxito' });
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    res.status(500).json({ message: 'Error al enviar el correo de recuperación' });
  }
}

// ============================================
// RESETEAR CONTRASEÑA
// ============================================
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword);

    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({ message: 'Contraseña restablecida con éxito' });
  } catch (error: any) {
    console.error('Error al restablecer la contraseña:', error.message);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
}

// ============================================
// ESTADÍSTICAS
// ============================================
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as any).id;
    const stats = await authService.getUserStats(userId);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas del usuario' });
  }
}

// ============================================
// CALIFICAR ÁRBITRO
// ============================================
export async function calificarArbitro(req: Request, res: Response): Promise<void> {
  try {
    const { partidoId, arbitroId, estrellas, comentario } = req.body;
    const organizadorId = (req.user as any).id;

    if (!partidoId || !arbitroId || !estrellas) {
      res.status(400).json({ message: 'partidoId, arbitroId y estrellas son requeridos' });
      return;
    }

    const result = await authService.calificarArbitro(organizadorId, partidoId, arbitroId, estrellas, comentario);

    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: 'Calificación registrada exitosamente',
      arbitro: result.data
    });
  } catch (error) {
    console.error('Error al calificar árbitro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ============================================
// VERIFICAR PARTIDOS
// ============================================
export async function verificarPartidos(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as any).id;
    const result = await authService.verificarPartidos(userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al verificar partidos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ============================================
// PARTIDOS PENDIENTES DE CALIFICACIÓN
// ============================================
export async function getPartidosPendientes(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as any).id;
    const pendientes = await authService.getPartidosPendientesCalificacion(userId);

    res.status(200).json({ pendientes });
  } catch (error) {
    console.error('Error al obtener pendientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
