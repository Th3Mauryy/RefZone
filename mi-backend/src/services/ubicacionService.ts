import Ubicacion from '../models/Ubicacion';
import Game from '../models/Game';

// ============================================
// TIPOS
// ============================================
export interface UbicacionData {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  googleMapsUrl?: string;
  canchaId?: string;
  organizadorId: string;
}

export interface UbicacionUpdateData {
  nombre?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  googleMapsUrl?: string;
}

// ============================================
// VALIDACIONES
// ============================================
export function validarCoordenadasInput(latitud: any, longitud: any): { valid: boolean; lat?: number; lng?: number; message?: string } {
  if (!latitud || !longitud) {
    return { valid: false, message: 'Debes marcar la ubicación en el mapa (latitud y longitud requeridas)' };
  }
  
  const lat = parseFloat(latitud);
  const lng = parseFloat(longitud);
  
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, message: 'Coordenadas inválidas. Por favor marca la ubicación en el mapa correctamente' };
  }
  
  return { valid: true, lat, lng };
}

export function validarNombre(nombre: any): { valid: boolean; message?: string } {
  if (!nombre?.trim()) {
    return { valid: false, message: 'El nombre de la cancha es requerido' };
  }
  return { valid: true };
}

export function validarDireccion(direccion: any): { valid: boolean; message?: string } {
  if (!direccion || direccion.trim().length < 10) {
    return { valid: false, message: 'La dirección debe tener al menos 10 caracteres' };
  }
  return { valid: true };
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Obtiene ubicaciones filtradas
 */
export async function getUbicaciones(userId?: string, role?: string) {
  interface UbicacionQuery {
    activa: boolean;
    organizadorId?: string;
  }
  
  const query: UbicacionQuery = { activa: true };
  
  if (role === 'organizador' && userId) {
    query.organizadorId = userId;
  }
  
  return await Ubicacion.find(query)
    .select('-__v')
    .sort({ nombre: 1 })
    .lean();
}

/**
 * Crea una nueva ubicación
 */
export async function createUbicacion(data: UbicacionData) {
  const { nombre, direccion, latitud, longitud, googleMapsUrl, canchaId, organizadorId } = data;
  
  return await Ubicacion.create({
    nombre: nombre.trim(),
    direccion: direccion.trim(),
    latitud,
    longitud,
    googleMapsUrl: googleMapsUrl || `https://www.google.com/maps?q=${latitud},${longitud}`,
    organizadorId,
    canchaId,
    activa: true
  });
}

/**
 * Actualiza una ubicación existente
 */
export async function updateUbicacion(
  ubicacionId: string,
  organizadorId: string,
  data: UbicacionUpdateData
): Promise<{ success: boolean; ubicacion?: any; message?: string; status?: number }> {
  const { nombre, direccion, latitud, longitud, googleMapsUrl } = data;
  
  // Buscar la ubicación
  const ubicacion = await Ubicacion.findOne({
    _id: ubicacionId,
    organizadorId
  });
  
  if (!ubicacion) {
    return { success: false, message: 'Ubicación no encontrada o no tienes permiso para editarla', status: 404 };
  }
  
  // Validaciones
  if (nombre !== undefined && !nombre.trim()) {
    return { success: false, message: 'El nombre de la cancha no puede estar vacío', status: 400 };
  }
  
  if (direccion !== undefined && direccion.trim().length < 10) {
    return { success: false, message: 'La dirección debe tener al menos 10 caracteres', status: 400 };
  }
  
  if (latitud !== undefined || longitud !== undefined) {
    if (!latitud || !longitud) {
      return { success: false, message: 'Debes proporcionar tanto latitud como longitud', status: 400 };
    }
    
    const coordValidation = validarCoordenadasInput(latitud, longitud);
    if (!coordValidation.valid) {
      return { success: false, message: coordValidation.message, status: 400 };
    }
  }
  
  // Guardar nombre anterior
  const nombreAnterior = nombre ? ubicacion.nombre : null;
  
  // Actualizar campos
  if (nombre) ubicacion.nombre = nombre.trim();
  if (direccion !== undefined) ubicacion.direccion = direccion.trim();
  if (latitud !== undefined) ubicacion.latitud = latitud;
  if (longitud !== undefined) ubicacion.longitud = longitud;
  if (googleMapsUrl !== undefined) ubicacion.googleMapsUrl = googleMapsUrl;
  
  await ubicacion.save();
  
  // Actualizar partidos relacionados
  if (nombre) {
    await actualizarPartidosConUbicacion(ubicacionId, nombre.trim(), nombreAnterior);
  }
  
  return { success: true, ubicacion };
}

/**
 * Actualiza los partidos que usan una ubicación
 */
async function actualizarPartidosConUbicacion(
  ubicacionId: string,
  nuevoNombre: string,
  nombreAnterior: string | null
): Promise<void> {
  console.log(`🔄 Actualizando de "${nombreAnterior}" → "${nuevoNombre}"`);
  
  // Actualizar partidos con ubicacionId
  const actualizacionPorId = await Game.updateMany(
    { ubicacionId },
    { $set: { location: nuevoNombre } }
  );
  
  // Actualizar partidos con nombre antiguo sin ubicacionId
  const actualizacionPorNombre = nombreAnterior ? await Game.updateMany(
    { 
      location: nombreAnterior,
      $or: [
        { ubicacionId: null },
        { ubicacionId: { $exists: false } }
      ]
    },
    { 
      $set: { 
        location: nuevoNombre,
        ubicacionId
      } 
    }
  ) : { modifiedCount: 0 };
  
  const totalActualizados = actualizacionPorId.modifiedCount + actualizacionPorNombre.modifiedCount;
  
  console.log(`✅ Ubicación actualizada: ${ubicacionId} → "${nuevoNombre}"`);
  console.log(`📊 Partidos con ubicacionId actualizados: ${actualizacionPorId.modifiedCount}`);
  console.log(`📊 Partidos con nombre antiguo actualizados: ${actualizacionPorNombre.modifiedCount}`);
  console.log(`🎯 Total partidos actualizados: ${totalActualizados}`);
}

/**
 * Desactiva una ubicación (soft delete)
 */
export async function deleteUbicacion(
  ubicacionId: string,
  organizadorId: string
): Promise<{ success: boolean; message?: string; status?: number }> {
  const ubicacion = await Ubicacion.findOne({
    _id: ubicacionId,
    organizadorId
  });
  
  if (!ubicacion) {
    return { success: false, message: 'Ubicación no encontrada o no tienes permiso para eliminarla', status: 404 };
  }
  
  ubicacion.activa = false;
  await ubicacion.save();
  
  return { success: true, message: 'Ubicación eliminada exitosamente' };
}
