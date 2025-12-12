import mongoose from 'mongoose';
import Game from '../models/Game';
import User from '../models/User';
import HistorialPartido from '../models/HistorialPartido';
import { haIniciado } from './partidoService';

// ============================================
// INTERFACES
// ============================================
interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface ServiceResult {
  success: boolean;
  message?: string;
  status?: number;
  game?: any;
  referee?: any;
  arbitro?: any;
  arbitroAnterior?: any;
  nuevoArbitro?: any;
}

interface CreateGameData {
  name: string;
  date: string;
  time: string;
  location: string;
  ubicacionId?: string;
  canchaId?: string;
  creadorId: string;
}

interface UpdateGameData {
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  canchaId?: string;
  ubicacionId?: string;
}

// ============================================
// VALIDACIONES
// ============================================
export function validateGameDate(date: string, time: string): ValidationResult {
  const gameDateTime = new Date(`${date}T${time}`);
  const now = new Date();

  if (gameDateTime < now) {
    return { valid: false, message: 'No se puede crear un partido con fecha pasada' };
  }

  const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  if (gameDateTime < twoHoursFromNow) {
    return { valid: false, message: 'El partido debe programarse con al menos 2 horas de anticipación' };
  }

  return { valid: true };
}

export async function checkDuplicateTeams(name: string, date: string, userId: string): Promise<ValidationResult> {
  if (!name || !date) return { valid: true };

  const nameNormalized = name.trim().toLowerCase();
  const partidosDelDia = await Game.find({ creadorId: userId, date }).select('name').lean();

  for (const partido of partidosDelDia) {
    const partidoNameNormalized = partido.name.trim().toLowerCase();
    const equiposNuevos = nameNormalized.split(/\s*vs\s*/).map((e: string) => e.trim());
    const equiposExistentes = partidoNameNormalized.split(/\s*vs\s*/).map((e: string) => e.trim());

    const equipoRepetido = equiposNuevos.find((equipo: string) => equiposExistentes.includes(equipo));

    if (equipoRepetido) {
      return {
        valid: false,
        message: `Ya existe un partido con el equipo "${equipoRepetido}" programado para el ${date}.`
      };
    }
  }

  return { valid: true };
}

// ============================================
// CRUD PARTIDOS
// ============================================
export async function createGame(data: CreateGameData) {
  return Game.create({
    ...data,
    estado: 'programado'
  });
}

export async function getGames(user: any, canchaFilter?: string) {
  let query: any = {};

  if (user.role === 'organizador') {
    query.creadorId = user.id;
  }

  if (canchaFilter && canchaFilter !== 'todas' && user.role === 'arbitro') {
    if (canchaFilter.match(/^[0-9a-fA-F]{24}$/)) {
      query.canchaId = canchaFilter;
    }
  }

  return Game.find(query)
    .select('-__v')
    .populate('arbitro', 'nombre email imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones')
    .populate('canchaId', 'nombre direccion')
    .populate('creadorId', 'nombre email')
    .lean()
    .sort({ date: 1, time: 1 });
}

export async function getGameById(gameId: string) {
  return Game.findById(gameId)
    .populate('arbitro', 'nombre email imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones')
    .populate('postulados', 'nombre email imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones')
    .populate('canchaId', 'nombre direccion telefono email logo')
    .populate('ubicacionId', 'nombre direccion latitud longitud googleMapsUrl')
    .populate('creadorId', 'nombre email');
}

export async function getStats(creadorId: string) {
  const total = await Game.countDocuments({ creadorId });
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0];

  const upcoming = await Game.countDocuments({
    creadorId,
    $or: [
      { date: { $gt: today } },
      { date: { $eq: today }, time: { $gte: currentTime } }
    ]
  });

  const needsReferee = await Game.countDocuments({
    creadorId,
    $or: [{ arbitro: null }, { arbitro: { $exists: false } }]
  });

  return { total, upcoming, needsReferee };
}

export async function deleteGame(gameId: string): Promise<ServiceResult> {
  const game = await Game.findById(gameId)
    .select('name date time location arbitro postulados canchaId')
    .populate('postulados', 'email nombre')
    .populate('arbitro', 'email nombre')
    .lean();

  if (!game) {
    return { success: false, message: 'Partido no encontrado', status: 404 };
  }

  if (haIniciado(game)) {
    return { success: false, message: 'No se puede eliminar un partido que ya ha iniciado', status: 403 };
  }

  // Guardar en historial
  const [year, month] = game.date.split('-').map(Number);
  await HistorialPartido.create({
    originalId: game._id,
    nombre: game.name,
    fecha: game.date,
    hora: game.time,
    ubicacion: game.location,
    arbitro: (game.arbitro as any)?._id || null,
    arbitroNombre: (game.arbitro as any)?.nombre || 'Sin asignar',
    estado: 'Cancelado',
    canchaId: game.canchaId || null,
    razonEliminacion: 'manual',
    mesPartido: month,
    anoPartido: year
  });

  await Game.findByIdAndDelete(gameId);
  return { success: true, game };
}

export async function updateGame(gameId: string, data: UpdateGameData): Promise<ServiceResult> {
  const game = await Game.findById(gameId).select('date time');
  
  if (!game) {
    return { success: false, message: 'Partido no encontrado.', status: 404 };
  }

  if (haIniciado(game)) {
    return { success: false, message: 'No se puede modificar un partido que ya ha iniciado', status: 403 };
  }

  if (data.date && data.time) {
    const gameDateTime = new Date(`${data.date}T${data.time}`);
    if (gameDateTime < new Date()) {
      return { success: false, message: 'No se puede actualizar un partido con fecha y hora pasadas.', status: 400 };
    }
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.date) updateData.date = data.date;
  if (data.time) updateData.time = data.time;
  if (data.location) updateData.location = data.location;
  if (data.canchaId) updateData.canchaId = data.canchaId;
  if (data.ubicacionId) updateData.ubicacionId = data.ubicacionId;

  const updatedGame = await Game.findByIdAndUpdate(gameId, updateData, { new: true });
  return { success: true, game: updatedGame };
}

// ============================================
// POSTULACIONES
// ============================================
export async function applyToGame(gameId: string, userId: string): Promise<ServiceResult> {
  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return { success: false, message: 'ID de partido inválido', status: 400 };
  }

  const game = await Game.findById(gameId);
  if (!game) {
    return { success: false, message: 'Partido no encontrado', status: 404 };
  }

  if (game.arbitro) {
    return { success: false, message: 'Este partido ya tiene un árbitro asignado', status: 400 };
  }

  const isAlreadyApplied = game.postulados.some(
    (postuladoId: any) => postuladoId.toString() === userId.toString()
  );

  if (isAlreadyApplied) {
    return { success: false, message: 'Ya estás postulado para este partido', status: 400 };
  }

  if (game.postulados.length >= 5) {
    return { success: false, message: 'El límite de postulantes ha sido alcanzado', status: 400 };
  }

  await Game.findByIdAndUpdate(gameId, { $addToSet: { postulados: userId } }, { new: true });
  return { success: true };
}

export async function cancelApplication(gameId: string, userId: string): Promise<ServiceResult> {
  const game = await Game.findById(gameId);
  if (!game) {
    return { success: false, message: 'Partido no encontrado', status: 404 };
  }

  if (haIniciado(game)) {
    return { success: false, message: 'No puedes cancelar la postulación de un partido que ya ha iniciado', status: 403 };
  }

  const wasPostulado = game.postulados.some((p: any) => p.toString() === userId);
  if (!wasPostulado) {
    return { success: false, message: 'No estás postulado en este partido', status: 400 };
  }

  await Game.findByIdAndUpdate(gameId, { $pull: { postulados: userId } });
  return { success: true };
}

export async function getPostulados(gameId: string) {
  const game = await Game.findById(gameId)
    .populate('postulados', 'nombre email _id imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones');

  return game ? game.postulados : null;
}

// ============================================
// GESTIÓN DE ÁRBITROS
// ============================================
export async function assignReferee(gameId: string, arbitroId: string): Promise<ServiceResult> {
  const game = await Game.findById(gameId).select('name date time location arbitro postulados').lean();
  
  if (!game) {
    return { success: false, message: 'Partido no encontrado', status: 404 };
  }

  if (haIniciado(game)) {
    return { success: false, message: 'No se puede asignar un árbitro a un partido que ya ha iniciado', status: 403 };
  }

  if (!game.postulados || !game.postulados.some((p: any) => p.toString() === arbitroId)) {
    return { success: false, message: 'El árbitro no está postulado', status: 400 };
  }

  await Game.findByIdAndUpdate(gameId, {
    arbitro: arbitroId,
    $pull: { postulados: arbitroId }
  });

  const referee = await User.findById(arbitroId).select('nombre email').lean();
  if (!referee) {
    return { success: false, message: 'Árbitro no encontrado', status: 404 };
  }

  return { success: true, referee, game };
}

export async function unassignReferee(gameId: string): Promise<ServiceResult> {
  const game = await Game.findById(gameId).populate('arbitro', 'nombre email');

  if (!game) {
    return { success: false, message: 'Partido no encontrado.', status: 404 };
  }

  if (haIniciado(game)) {
    return { success: false, message: 'No se puede desasignar al árbitro de un partido que ya ha iniciado', status: 403 };
  }

  if (!game.arbitro) {
    return { success: false, message: 'No hay árbitro asignado para desasignar.', status: 400 };
  }

  const arbitroRemovido = game.arbitro as any;

  if (!game.postulados.some((p: any) => p.toString() === arbitroRemovido._id.toString())) {
    game.postulados.push(arbitroRemovido._id);
  }

  game.arbitro = null;
  await game.save();

  return { success: true, arbitro: arbitroRemovido, game };
}

export async function substituteReferee(gameId: string, nuevoArbitroId: string): Promise<ServiceResult> {
  const game = await Game.findById(gameId)
    .populate('arbitro', 'nombre email')
    .populate('postulados', 'nombre email _id');

  if (!game) {
    return { success: false, message: 'Partido no encontrado.', status: 404 };
  }

  if (haIniciado(game)) {
    return { success: false, message: 'No se puede sustituir al árbitro de un partido que ya ha iniciado', status: 403 };
  }

  if (!game.arbitro) {
    return { success: false, message: 'No hay árbitro asignado para sustituir.', status: 400 };
  }

  const nuevoArbitro = await User.findById(nuevoArbitroId);
  if (!nuevoArbitro) {
    return { success: false, message: 'Nuevo árbitro no encontrado.', status: 404 };
  }

  const arbitroAnterior = game.arbitro as any;
  game.arbitro = nuevoArbitroId as any;
  game.postulados = game.postulados.filter((p: any) => p._id.toString() !== nuevoArbitroId.toString()) as any;

  if (!game.postulados.some((p: any) => p._id.toString() === arbitroAnterior._id.toString())) {
    game.postulados.push(arbitroAnterior._id);
  }

  await game.save();

  return { success: true, game, arbitroAnterior, nuevoArbitro };
}

// ============================================
// HISTORIAL ÁRBITRO
// ============================================
export async function getArbitroHistorial(arbitroId: string) {
  const arbitro = await User.findById(arbitroId)
    .select('nombre email imagenPerfil calificacionPromedio totalCalificaciones calificaciones')
    .populate('calificaciones.organizadorId', 'nombre')
    .lean();

  if (!arbitro) return null;

  const historialPartidos = await HistorialPartido.find({
    arbitro: arbitroId,
    estado: 'Finalizado'
  })
    .select('nombre fecha hora ubicacion originalId calificado')
    .sort({ fechaEliminacion: -1 })
    .limit(20)
    .lean();

  const historialConCalificaciones = historialPartidos.map((partido: any) => {
    const calificacion = (arbitro as any).calificaciones?.find(
      (c: any) => String(c.partidoId) === String(partido._id)
    );

    return {
      _id: partido.originalId,
      nombre: partido.nombre,
      fecha: partido.fecha,
      hora: partido.hora,
      ubicacion: partido.ubicacion,
      calificacion: calificacion?.estrellas || null,
      comentario: calificacion?.comentario || null,
      organizador: calificacion?.organizadorId?.nombre || null
    };
  });

  return {
    arbitro: {
      nombre: (arbitro as any).nombre || 'Árbitro',
      email: (arbitro as any).email,
      imagenPerfil: (arbitro as any).imagenPerfil,
      calificacionPromedio: (arbitro as any).calificacionPromedio || 0,
      totalCalificaciones: (arbitro as any).totalCalificaciones || 0
    },
    historial: historialConCalificaciones
  };
}

export async function getArbitroInfo(arbitroId: string) {
  const historial = await HistorialPartido.find({
    arbitro: arbitroId,
    estado: 'Finalizado'
  })
    .select('nombre fecha hora ubicacion canchaId estado mesPartido anoPartido')
    .populate('canchaId', 'nombre')
    .sort({ anoPartido: -1, mesPartido: -1, fecha: -1 })
    .limit(20)
    .lean();

  const partidosActuales = await Game.find({ arbitro: arbitroId })
    .select('name date time location canchaId')
    .populate('canchaId', 'nombre')
    .sort({ date: -1 })
    .limit(10)
    .lean();

  const arbitro = await User.findById(arbitroId)
    .select('nombre calificacionPromedio totalCalificaciones')
    .lean();

  return {
    arbitro: {
      nombre: (arbitro as any)?.nombre || 'Árbitro',
      calificacionPromedio: (arbitro as any)?.calificacionPromedio || 0,
      totalCalificaciones: (arbitro as any)?.totalCalificaciones || 0
    },
    historialFinalizados: historial.map((h: any) => ({
      nombre: h.nombre,
      fecha: h.fecha,
      hora: h.hora,
      ubicacion: h.ubicacion,
      cancha: h.canchaId?.nombre || 'N/A',
      estado: h.estado
    })),
    partidosRecientes: partidosActuales.map((p: any) => ({
      nombre: p.name,
      fecha: p.date,
      hora: p.time,
      ubicacion: p.location,
      cancha: p.canchaId?.nombre || 'N/A'
    })),
    totalPartidos: historial.length + partidosActuales.length
  };
}
