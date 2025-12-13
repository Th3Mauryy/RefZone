import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Game from '../models/Game';
import HistorialPartido from '../models/HistorialPartido';
import { verificarYFinalizarPartidos } from './partidoService';

const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// ============================================
// INTERFACES
// ============================================
interface ServiceResult {
  success: boolean;
  message?: string;
  status?: number;
  data?: any;
}

interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  edad: number;
  contacto: string;
  experiencia: string;
  imagenPerfil?: string | null;
}

interface LoginResult {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  redirect?: string;
}

// ============================================
// VALIDACIONES
// ============================================
export function validateRegistration(data: Partial<RegisterData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email || !data.password || !data.nombre) {
    errors.push('Email, contraseña y nombre son requeridos');
  }

  if (data.edad !== undefined) {
    if (isNaN(data.edad) || data.edad < 18 || data.edad > 50) {
      errors.push('La edad debe ser entre 18 y 50');
    }
  }

  if (data.contacto && !/^\d{10}$/.test(data.contacto)) {
    errors.push('El contacto debe tener 10 dígitos');
  }

  if (data.experiencia && data.experiencia.trim().length < 10) {
    errors.push('La experiencia debe tener al menos 10 caracteres');
  }

  // Validación de contraseña fuerte
  if (data.password) {
    if (data.password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    } else if (!/[A-Z]/.test(data.password)) {
      errors.push('La contraseña debe incluir al menos una mayúscula');
    } else if (!/[0-9]/.test(data.password)) {
      errors.push('La contraseña debe incluir al menos un número');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePasswordChange(newPassword: string): { valid: boolean; message?: string } {
  if (newPassword.length < 8) {
    return { valid: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { valid: false, message: 'La nueva contraseña debe incluir al menos una mayúscula' };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { valid: false, message: 'La nueva contraseña debe incluir al menos un número' };
  }
  return { valid: true };
}

// ============================================
// REGISTRO
// ============================================
export async function registerUser(data: RegisterData): Promise<ServiceResult> {
  const normalizedEmail = data.email.trim().toLowerCase();
  
  // Verificar email duplicado
  const existingUser = await User.findOne({ email: normalizedEmail }).select('_id').lean();
  if (existingUser) {
    return { success: false, message: 'El email ya está registrado', status: 409 };
  }

  const newUser = new User({
    email: normalizedEmail,
    password: data.password,
    nombre: data.nombre.trim(),
    edad: data.edad,
    contacto: data.contacto,
    experiencia: data.experiencia || '',
    imagenPerfil: data.imagenPerfil || null,
    role: 'arbitro'
  });

  await newUser.save();

  return {
    success: true,
    data: { id: newUser._id, nombre: newUser.nombre, email: newUser.email }
  };
}

// ============================================
// LOGIN
// ============================================
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail })
    .select('_id email password role nombre imagenPerfil')
    .lean();

  if (!user) {
    return { success: false, message: 'Credenciales inválidas' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { success: false, message: 'Credenciales inválidas' };
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    success: true,
    token,
    redirect: user.role === 'organizador' ? '/dashboard-organizador' : '/dashboard',
    user: {
      id: user._id,
      nombre: user.nombre,
      role: user.role,
      imagenPerfil: user.imagenPerfil
    }
  };
}

// ============================================
// SESIÓN
// ============================================
export async function checkSession(userId: string) {
  const user = await User.findById(userId)
    .select('_id nombre email role imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones canchaAsignada')
    .populate('canchaAsignada', 'nombre direccion telefono email logo descripcion')
    .lean();

  return user;
}

// ============================================
// PERFIL
// ============================================
export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
}

export async function updateProfile(
  userId: string, 
  data: { email?: string; contacto?: string; experiencia?: string; imagenPerfil?: string },
  passwordData?: { currentPassword: string; newPassword: string }
): Promise<ServiceResult> {
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, message: 'Usuario no encontrado', status: 404 };
  }

  // Verificar cambio de contraseña
  if (passwordData) {
    const isPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
    if (!isPasswordValid) {
      return { success: false, message: 'La contraseña actual es incorrecta', status: 401 };
    }
    user.password = passwordData.newPassword;
  }

  // Verificar email único
  if (data.email && data.email !== user.email) {
    const existingUser = await User.findOne({ email: data.email.trim().toLowerCase() });
    if (existingUser) {
      return { success: false, message: 'El email ya está en uso por otro usuario', status: 400 };
    }
    user.email = data.email.trim().toLowerCase();
  }

  if (data.contacto) user.contacto = data.contacto;
  if (data.experiencia) user.experiencia = data.experiencia;
  if (data.imagenPerfil) user.imagenPerfil = data.imagenPerfil;

  await user.save();

  const { password, ...userWithoutPassword } = user.toObject();
  return { success: true, data: userWithoutPassword };
}

// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================
export async function generatePasswordResetToken(email: string): Promise<ServiceResult> {
  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, message: 'Usuario no encontrado', status: 404 };
  }

  const token = user.generateAuthToken();
  const recoveryLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetear?token=${token}`;

  return { success: true, data: { token, recoveryLink, nombre: user.nombre } };
}

export async function resetPassword(token: string, newPassword: string): Promise<ServiceResult> {
  try {
    const decoded = jwt.verify(token, jwtSecret) as { _id: string };
    const user = await User.findById(decoded._id);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado', status: 404 };
    }

    user.password = newPassword;
    await user.save();

    return { success: true };
  } catch {
    return { success: false, message: 'Token inválido o expirado', status: 400 };
  }
}

// ============================================
// ESTADÍSTICAS DEL ÁRBITRO
// ============================================
export async function getUserStats(userId: string) {
  const totalApplications = await Game.countDocuments({ 'postulados': userId });
  const acceptedGames = await Game.countDocuments({ 'arbitro': userId });
  const pendingApplications = await Game.countDocuments({
    'postulados': userId,
    'arbitro': { $exists: false }
  });

  return {
    totalApplications,
    acceptedGames,
    pendingApplications
  };
}

// ============================================
// CALIFICACIONES
// ============================================
export async function calificarArbitro(
  organizadorId: string,
  partidoId: string,
  arbitroId: string,
  estrellas: number,
  comentario?: string
): Promise<ServiceResult> {
  if (estrellas < 1 || estrellas > 5) {
    return { success: false, message: 'La calificación debe ser entre 1 y 5 estrellas', status: 400 };
  }

  const partido = await HistorialPartido.findById(partidoId);
  if (!partido) {
    return { success: false, message: 'Partido no encontrado en el historial', status: 404 };
  }

  if (partido.calificado) {
    return { success: false, message: 'Este partido ya fue calificado', status: 400 };
  }

  if (!partido.arbitro || partido.arbitro.toString() !== arbitroId) {
    return { success: false, message: 'El árbitro no coincide con el partido', status: 400 };
  }

  const arbitro = await User.findById(arbitroId);
  if (!arbitro) {
    return { success: false, message: 'Árbitro no encontrado', status: 404 };
  }

  const yaCalificado = arbitro.calificaciones.some(
    (cal: any) => cal.partidoId.toString() === partidoId
  );

  if (yaCalificado) {
    return { success: false, message: 'Ya calificaste a este árbitro por este partido', status: 400 };
  }

  arbitro.calificaciones.push({
    organizadorId,
    partidoId,
    estrellas,
    comentario: comentario || '',
    fecha: new Date()
  } as any);

  const totalEstrellas = arbitro.calificaciones.reduce((sum: number, cal: any) => sum + cal.estrellas, 0);
  const totalCalificaciones = arbitro.calificaciones.length;
  arbitro.calificacionPromedio = totalEstrellas / totalCalificaciones;
  arbitro.totalCalificaciones = totalCalificaciones;

  await arbitro.save();

  partido.calificado = true;
  partido.calificacionArbitro = estrellas;
  partido.comentarioCalificacion = comentario || '';
  await partido.save();

  return {
    success: true,
    data: {
      id: arbitro._id,
      nombre: arbitro.nombre,
      calificacionPromedio: arbitro.calificacionPromedio,
      totalCalificaciones: arbitro.totalCalificaciones
    }
  };
}

// ============================================
// VERIFICAR PARTIDOS PENDIENTES
// ============================================
export async function getPartidosPendientesCalificacion(userId: string) {
  const user = await User.findById(userId).select('canchaAsignada');
  if (!user || !user.canchaAsignada) {
    return [];
  }

  const candidatos = await HistorialPartido.find({
    canchaId: user.canchaAsignada,
    arbitro: { $ne: null },
    calificado: false,
    estado: 'Finalizado'
  })
    .populate('arbitro', 'nombre email imagenPerfil calificacionPromedio totalCalificaciones')
    .sort({ fechaEliminacion: -1 });

  // Filtrar solo los que ya finalizaron (1 hora después)
  return candidatos.filter(partido => {
    try {
      let fechaPartido: Date;

      if (partido.fecha.includes('/')) {
        const [dia, mes, ano] = partido.fecha.split('/').map(Number);
        const [hora, minutos] = partido.hora.split(':').map(Number);
        fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
      } else if (partido.fecha.includes('-')) {
        const [ano, mes, dia] = partido.fecha.split('-').map(Number);
        const [hora, minutos] = partido.hora.split(':').map(Number);
        fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
      } else {
        return false;
      }

      const fechaFinalizacion = new Date(fechaPartido.getTime() + 60 * 60 * 1000);
      const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

      return ahora >= fechaFinalizacion;
    } catch {
      return false;
    }
  });
}

export async function verificarPartidos(userId: string) {
  const resultado = await verificarYFinalizarPartidos();

  const user = await User.findById(userId).select('canchaAsignada');
  if (!user || !user.canchaAsignada) {
    return { finalizados: resultado.finalizados.length, pendientesCalificacion: [] };
  }

  const canchaId = user.canchaAsignada.toString();
  const pendientes = resultado.porCalificar[canchaId] || [];

  return {
    finalizados: resultado.finalizados.length,
    pendientesCalificacion: pendientes
  };
}

// ============================================
// LISTAR USUARIOS
// ============================================
export async function listUsers() {
  return User.find().select('-password -__v').lean();
}
