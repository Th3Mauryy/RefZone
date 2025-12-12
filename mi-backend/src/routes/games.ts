import { Router } from 'express';
import { verifyToken } from '../middleware';
import * as gameController from '../controllers/gameController';

const router: Router = Router();

// ============================================
// RUTAS DE PARTIDOS
// ============================================

// Estadísticas (DEBE estar ANTES de /:id)
router.get('/stats', verifyToken, gameController.getStats);

// CRUD básico
router.post('/', verifyToken, gameController.createGame);
router.get('/', verifyToken, gameController.getGames);
router.get('/:id', verifyToken, gameController.getGameById);
router.put('/:id', verifyToken, gameController.updateGame);
router.delete('/:id', verifyToken, gameController.deleteGame);

// Postulaciones
router.post('/:id/apply', verifyToken, gameController.applyToGame);
router.post('/:id/cancel-application', verifyToken, gameController.cancelApplication);
router.post('/cancel-postulation', gameController.cancelPostulationBody);
router.get('/:id/postulados', gameController.getPostulados);

// Gestión de árbitros
router.post('/:id/assign', verifyToken, gameController.assignReferee);
router.post('/:id/unassign', verifyToken, gameController.unassignReferee);
router.post('/:id/substitute', verifyToken, gameController.substituteReferee);

// Historial de árbitro
router.get('/arbitro/:arbitroId/historial', verifyToken, gameController.getArbitroHistorial);
router.get('/arbitro/:arbitroId/info', verifyToken, gameController.getArbitroInfo);

export default router;
