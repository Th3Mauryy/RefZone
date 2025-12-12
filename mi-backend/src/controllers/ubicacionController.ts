import { Request, Response } from 'express';
import * as ubicacionService from '../services/ubicacionService';

/**
 * Obtiene ubicaciones del organizador
 */
export async function getUbicaciones(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as any)?.id;
    const role = (req.user as any)?.role;
    
    const ubicaciones = await ubicacionService.getUbicaciones(userId, role);
    res.status(200).json(ubicaciones);
  } catch (error) {
    const err = error as Error;
    console.error('Error obtener ubicaciones:', err.message);
    res.status(500).json({ message: 'Error al obtener ubicaciones' });
  }
}

/**
 * Crea una nueva ubicación
 */
export async function createUbicacion(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as any;
    
    if (user?.role !== 'organizador') {
      res.status(403).json({ message: 'Solo organizadores pueden crear ubicaciones' });
      return;
    }
    
    const { nombre, direccion, latitud, longitud, googleMapsUrl, canchaId } = req.body;
    
    // Validaciones
    const nombreValidation = ubicacionService.validarNombre(nombre);
    if (!nombreValidation.valid) {
      res.status(400).json({ message: nombreValidation.message });
      return;
    }
    
    const direccionValidation = ubicacionService.validarDireccion(direccion);
    if (!direccionValidation.valid) {
      res.status(400).json({ message: direccionValidation.message });
      return;
    }
    
    const coordValidation = ubicacionService.validarCoordenadasInput(latitud, longitud);
    if (!coordValidation.valid) {
      res.status(400).json({ message: coordValidation.message });
      return;
    }
    
    const nuevaUbicacion = await ubicacionService.createUbicacion({
      nombre,
      direccion,
      latitud: coordValidation.lat!,
      longitud: coordValidation.lng!,
      googleMapsUrl,
      canchaId: canchaId || user.canchaAsignada,
      organizadorId: user.id
    });
    
    res.status(201).json(nuevaUbicacion);
  } catch (error) {
    const err = error as Error;
    console.error('Error crear ubicación:', err.message);
    res.status(500).json({ message: 'Error al crear ubicación' });
  }
}

/**
 * Actualiza una ubicación existente
 */
export async function updateUbicacion(req: Request, res: Response): Promise<void> {
  try {
    const ubicacionId = req.params.id;
    const organizadorId = (req.user as any)?.id;
    const { nombre, direccion, latitud, longitud, googleMapsUrl } = req.body;
    
    const result = await ubicacionService.updateUbicacion(
      ubicacionId,
      organizadorId,
      { nombre, direccion, latitud, longitud, googleMapsUrl }
    );
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }
    
    res.status(200).json(result.ubicacion);
  } catch (error) {
    const err = error as Error;
    console.error('Error al actualizar ubicación:', err);
    res.status(500).json({ message: 'Error al actualizar ubicación', error: err.message });
  }
}

/**
 * Elimina (desactiva) una ubicación
 */
export async function deleteUbicacion(req: Request, res: Response): Promise<void> {
  try {
    const ubicacionId = req.params.id;
    const organizadorId = (req.user as any)?.id;
    
    const result = await ubicacionService.deleteUbicacion(ubicacionId, organizadorId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }
    
    res.status(200).json({ message: result.message });
  } catch (error) {
    const err = error as Error;
    console.error('Error al eliminar ubicación:', err);
    res.status(500).json({ message: 'Error al eliminar ubicación', error: err.message });
  }
}
