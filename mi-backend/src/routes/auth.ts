/// <reference path="../types/express.d.ts" />
import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import * as authController from '../controllers/authController';
import { verifyToken } from '../middleware';
import { loginLimiter, passwordRecoveryLimiter, registerLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

// ============================================
// CONFIGURACIÓN DE CLOUDINARY
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'usuarios_perfil',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: `perfil_${Date.now()}`,
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y GIF.'));
    }
  },
});

// ============================================
// RUTAS PÚBLICAS
// ============================================
router.post('/registro', registerLimiter, upload.single('imagenPerfil'), authController.register);
router.post('/register', registerLimiter, upload.single('imagenPerfil'), authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/recuperar', passwordRecoveryLimiter, authController.recoverPassword);
router.post('/resetear', authController.resetPassword);

// ============================================
// RUTAS PROTEGIDAS
// ============================================
router.get('/check-session', verifyToken, authController.checkSession);
router.post('/logout', verifyToken, authController.logout);
router.get('/usuarios', verifyToken, authController.listUsers);
router.get('/perfil/:id', verifyToken, authController.getProfile);
router.put('/editar-perfil', verifyToken, upload.single('imagenPerfil'), authController.editProfile);
router.get('/stats', verifyToken, authController.getStats);
router.post('/calificar-arbitro', verifyToken, authController.calificarArbitro);
router.get('/verificar-partidos', verifyToken, authController.verificarPartidos);
router.get('/partidos-pendientes-calificacion', verifyToken, authController.getPartidosPendientes);

export default router;
