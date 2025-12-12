import { Router } from 'express';
import { verifyToken } from '../middleware';
import * as ubicacionController from '../controllers/ubicacionController';

const router = Router();

// ============================================
// RUTAS DE UBICACIONES
// ============================================

// Todas las rutas requieren autenticación
router.get('/', verifyToken, ubicacionController.getUbicaciones);
router.post('/', verifyToken, ubicacionController.createUbicacion);
router.put('/:id', verifyToken, ubicacionController.updateUbicacion);
router.delete('/:id', verifyToken, ubicacionController.deleteUbicacion);

export default router;
