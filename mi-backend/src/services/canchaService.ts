import Cancha from '../models/Cancha';
import User from '../models/User';

/**
 * Obtiene todas las canchas
 */
export async function getAllCanchas() {
  return await Cancha.find();
}

/**
 * Obtiene una cancha por ID
 */
export async function getCanchaById(id: string) {
  return await Cancha.findById(id);
}

/**
 * Obtiene la cancha asignada a un usuario
 */
export async function getCanchaAsignada(userId: string) {
  const user = await User.findById(userId)
    .populate('canchaAsignada')
    .lean()
    .exec();
  
  if (!user) return null;
  
  return user.canchaAsignada;
}

/**
 * Crea una nueva cancha
 */
export async function createCancha(data: {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
}) {
  const cancha = new Cancha(data);
  return await cancha.save();
}

/**
 * Actualiza una cancha
 */
export async function updateCancha(id: string, data: Partial<{
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}>) {
  return await Cancha.findByIdAndUpdate(id, data, { new: true });
}

/**
 * Elimina una cancha
 */
export async function deleteCancha(id: string) {
  return await Cancha.findByIdAndDelete(id);
}
