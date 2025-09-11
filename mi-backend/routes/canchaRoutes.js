const express = require('express');
const router = express.Router();
const Cancha = require('../models/Cancha');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// Obtener todas las canchas
router.get('/', async (req, res) => {
    try {
        const canchas = await Cancha.find();
        res.json(canchas);
    } catch (error) {
        console.error('Error al obtener canchas:', error);
        res.status(500).json({ message: 'Error al obtener canchas' });
    }
});

// Obtener una cancha por ID
router.get('/:id', async (req, res) => {
    try {
        const cancha = await Cancha.findById(req.params.id);
        if (!cancha) {
            return res.status(404).json({ message: 'Cancha no encontrada' });
        }
        res.json(cancha);
    } catch (error) {
        console.error('Error al obtener cancha:', error);
        res.status(500).json({ message: 'Error al obtener cancha' });
    }
});

// Obtener todas las canchas
router.get('/user/assigned', verifyToken, async (req, res) => {
    try {
        // Usar .lean() para obtener un objeto JS puro
        const user = await User.findById(req.user.id)
            .populate('canchaAsignada')
            .lean()
            .exec();
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        if (!user.canchaAsignada) {
            return res.status(200).json({ hasCancha: false });
        }
        
        res.json({
            hasCancha: true,
            cancha: user.canchaAsignada
        });
    } catch (error) {
        console.error('Error al obtener cancha asignada:', error);
        res.status(500).json({ message: 'Error al obtener cancha asignada' });
    }
});

module.exports = router;