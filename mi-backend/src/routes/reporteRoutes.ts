import { Router } from 'express';
import { verifyToken } from '../middleware';
import * as reporteController from '../controllers/reporteController';

const router = Router();

console.log('Inicializando rutas de reportes...');

// ============================================
// RUTAS DE REPORTES
// ============================================
router.get('/reporte-datos', verifyToken, reporteController.getReporteDatos);
router.get('/reporte-pdf', verifyToken, reporteController.getReportePDF);
router.get('/test', reporteController.testReportes);

console.log('Rutas de reportes registradas');

export default router;
