import { Router } from 'express';
import { verifyToken } from '../middleware';
import * as canchaController from '../controllers/canchaController';

const router = Router();

// ============================================
// RUTAS DE CANCHAS
// ============================================

// Rutas públicas
router.get('/', canchaController.getAllCanchas);
router.get('/:id', canchaController.getCanchaById);

// Rutas protegidas
router.get('/user/assigned', verifyToken, canchaController.getCanchaAsignada);

export default router;
