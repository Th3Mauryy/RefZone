import { Request, Response } from 'express';
import * as canchaService from '../services/canchaService';

/**
 * Obtiene todas las canchas
 */
export async function getAllCanchas(_req: Request, res: Response): Promise<void> {
  try {
    const canchas = await canchaService.getAllCanchas();
    res.json(canchas);
  } catch (error) {
    console.error('Error al obtener canchas:', error);
    res.status(500).json({ message: 'Error al obtener canchas' });
  }
}

/**
 * Obtiene una cancha por ID
 */
export async function getCanchaById(req: Request, res: Response): Promise<void> {
  try {
    const cancha = await canchaService.getCanchaById(req.params.id);
    if (!cancha) {
      res.status(404).json({ message: 'Cancha no encontrada' });
      return;
    }
    res.json(cancha);
  } catch (error) {
    console.error('Error al obtener cancha:', error);
    res.status(500).json({ message: 'Error al obtener cancha' });
  }
}

/**
 * Obtiene la cancha asignada al usuario autenticado
 */
export async function getCanchaAsignada(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const cancha = await canchaService.getCanchaAsignada(userId);
    
    if (!cancha) {
      res.status(200).json({ hasCancha: false });
      return;
    }
    
    res.json({
      hasCancha: true,
      cancha
    });
  } catch (error) {
    console.error('Error al obtener cancha asignada:', error);
    res.status(500).json({ message: 'Error al obtener cancha asignada' });
  }
}
