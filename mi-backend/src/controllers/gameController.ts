import { Request, Response } from 'express';
import * as gameService from '../services/gameService';
import * as emailService from '../services/emailService';

// ============================================
// CREAR PARTIDO
// ============================================
export async function createGame(req: Request, res: Response): Promise<void> {
  try {
    const { name, date, time, location, canchaId, ubicacionId } = req.body;
    const userId = (req.user as any).id;

    // Validar fecha
    const validation = gameService.validateGameDate(date, time);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    // Verificar duplicados
    const duplicateCheck = await gameService.checkDuplicateTeams(name, date, userId);
    if (!duplicateCheck.valid) {
      res.status(400).json({ message: duplicateCheck.message });
      return;
    }

    const newGame = await gameService.createGame({
      name, date, time, location, ubicacionId, canchaId, creadorId: userId
    });

    res.status(201).json(newGame);
  } catch (error: any) {
    console.error('Error crear partido:', error.message);
    res.status(500).json({ message: 'Error al crear el partido' });
  }
}

// ============================================
// OBTENER PARTIDOS
// ============================================
export async function getGames(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as any;
    const canchaFilter = req.query.cancha as string | undefined;
    
    const games = await gameService.getGames(user, canchaFilter);
    res.status(200).json(games);
  } catch (error: any) {
    console.error('Error al obtener partidos:', error.message);
    res.status(500).json({ message: 'Error al obtener los partidos' });
  }
}

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as any;
    
    if (!user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const stats = await gameService.getStats(user.id);
    res.json(stats);
  } catch (err: any) {
    console.error("Error en /games/stats:", err.message);
    res.status(500).json({ total: 0, upcoming: 0, needsReferee: 0, error: err.message });
  }
}

// ============================================
// OBTENER PARTIDO POR ID
// ============================================
export async function getGameById(req: Request, res: Response): Promise<void> {
  try {
    const game = await gameService.getGameById(req.params.id);
    
    if (!game) {
      res.status(404).json({ message: 'Partido no encontrado' });
      return;
    }

    res.status(200).json(game);
  } catch (error) {
    console.error('Error al obtener partido:', error);
    res.status(500).json({ message: 'Error al obtener el partido' });
  }
}

// ============================================
// ELIMINAR PARTIDO
// ============================================
export async function deleteGame(req: Request, res: Response): Promise<void> {
  try {
    const gameId = req.params.id;

    if (!gameId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const result = await gameService.deleteGame(gameId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({ message: 'Partido eliminado correctamente' });

    // Enviar emails en segundo plano
    if (result.game) {
      emailService.sendCancellationEmails(result.game);
    }
  } catch (error: any) {
    console.error('Error eliminar:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al eliminar el partido' });
    }
  }
}

// ============================================
// ACTUALIZAR PARTIDO
// ============================================
export async function updateGame(req: Request, res: Response): Promise<void> {
  try {
    const { name, date, time, location, canchaId, ubicacionId } = req.body;
    const gameId = req.params.id;

    const result = await gameService.updateGame(gameId, { name, date, time, location, canchaId, ubicacionId });
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({ updatedGame: result.game });
  } catch (error) {
    console.error('Error al actualizar el partido:', error);
    res.status(500).json({ message: 'Error al actualizar el partido' });
  }
}

// ============================================
// POSTULARSE A PARTIDO
// ============================================
export async function applyToGame(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    const result = await gameService.applyToGame(id, userId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({ message: 'Postulación exitosa' });
  } catch (error) {
    console.error('Error al postularse:', error);
    res.status(500).json({ message: 'Error al postularse' });
  }
}

// ============================================
// CANCELAR POSTULACIÓN
// ============================================
export async function cancelApplication(req: Request, res: Response): Promise<void> {
  try {
    const gameId = req.params.id;
    const userId = (req.user as any).id;

    const result = await gameService.cancelApplication(gameId, userId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({ message: 'Postulación cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar postulación:', error);
    res.status(500).json({ message: 'Error al cancelar postulación' });
  }
}

// ============================================
// ASIGNAR ÁRBITRO
// ============================================
export async function assignReferee(req: Request, res: Response): Promise<void> {
  try {
    const { arbitroId } = req.body;
    const gameId = req.params.id;

    if (!arbitroId) {
      res.status(400).json({ message: 'ID del árbitro no proporcionado' });
      return;
    }

    const result = await gameService.assignReferee(gameId, arbitroId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({ message: 'Árbitro asignado correctamente' });

    // Email en segundo plano
    if (result.referee && result.game) {
      emailService.sendAssignmentEmail(result.referee, result.game);
    }
  } catch (error: any) {
    console.error('Error asignar:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al asignar árbitro' });
    }
  }
}

// ============================================
// DESASIGNAR ÁRBITRO
// ============================================
export async function unassignReferee(req: Request, res: Response): Promise<void> {
  try {
    const { razon } = req.body;
    const gameId = req.params.id;

    if (!razon || razon.trim().length < 10) {
      res.status(400).json({ message: 'La razón debe tener al menos 10 caracteres.' });
      return;
    }

    const result = await gameService.unassignReferee(gameId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: 'Árbitro desasignado correctamente.',
      arbitroRemovido: result.arbitro?.nombre
    });

    // Email asíncrono
    if (result.arbitro && result.game) {
      emailService.sendUnassignmentEmail(result.arbitro, result.game, razon);
    }
  } catch (error) {
    console.error('Error al desasignar árbitro:', error);
    res.status(500).json({ message: 'Error al desasignar árbitro.' });
  }
}

// ============================================
// SUSTITUIR ÁRBITRO
// ============================================
export async function substituteReferee(req: Request, res: Response): Promise<void> {
  try {
    const { nuevoArbitroId, razon } = req.body;
    const gameId = req.params.id;

    if (!nuevoArbitroId) {
      res.status(400).json({ message: 'ID del nuevo árbitro es requerido.' });
      return;
    }

    if (!razon || razon.trim().length < 10) {
      res.status(400).json({ message: 'La razón debe tener al menos 10 caracteres.' });
      return;
    }

    const result = await gameService.substituteReferee(gameId, nuevoArbitroId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: 'Árbitro sustituido correctamente',
      nuevoArbitro: { nombre: result.nuevoArbitro?.nombre, email: result.nuevoArbitro?.email }
    });

    // Emails en segundo plano
    if (result.game && result.arbitroAnterior && result.nuevoArbitro) {
      emailService.sendSubstitutionEmails(result.game, result.arbitroAnterior, result.nuevoArbitro, razon);
    }
  } catch (error: any) {
    console.error('Error sustituir:', error.message);
    res.status(500).json({ message: 'Error al sustituir árbitro' });
  }
}

// ============================================
// OBTENER POSTULADOS
// ============================================
export async function getPostulados(req: Request, res: Response): Promise<void> {
  try {
    const postulados = await gameService.getPostulados(req.params.id);
    
    if (postulados === null) {
      res.status(404).json({ message: 'Partido no encontrado.' });
      return;
    }

    res.status(200).json({ postulados });
  } catch (error) {
    console.error('Error al obtener postulados:', error);
    res.status(500).json({ message: 'Error al obtener postulados.' });
  }
}

// ============================================
// HISTORIAL DE ÁRBITRO
// ============================================
export async function getArbitroHistorial(req: Request, res: Response): Promise<void> {
  try {
    const { arbitroId } = req.params;

    if (!arbitroId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: 'ID de árbitro inválido' });
      return;
    }

    const result = await gameService.getArbitroHistorial(arbitroId);
    
    if (!result) {
      res.status(404).json({ message: 'Árbitro no encontrado' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener el historial del árbitro' });
  }
}

// ============================================
// INFO DETALLADA DE ÁRBITRO
// ============================================
export async function getArbitroInfo(req: Request, res: Response): Promise<void> {
  try {
    const { arbitroId } = req.params;

    if (!arbitroId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: 'ID de árbitro inválido' });
      return;
    }

    const result = await gameService.getArbitroInfo(arbitroId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener el historial del árbitro' });
  }
}

// ============================================
// CANCELAR POSTULACIÓN (BODY)
// ============================================
export async function cancelPostulationBody(req: Request, res: Response): Promise<void> {
  const { gameId, userId } = req.body;

  if (!gameId || !userId) {
    res.status(400).json({ message: 'Datos incompletos: gameId y userId son requeridos.' });
    return;
  }

  try {
    const result = await gameService.cancelApplication(gameId, userId);
    
    if (!result.success) {
      res.status(result.status || 400).json({ message: result.message });
      return;
    }

    res.json({ message: 'Postulación cancelada con éxito.' });
  } catch (error) {
    console.error('Error al cancelar postulación:', error);
    res.status(500).json({ message: 'Error interno al cancelar la postulación.' });
  }
}
