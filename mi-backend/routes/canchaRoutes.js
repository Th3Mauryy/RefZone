const express = require('express');
const router = express.Router();
const Cancha = require('../models/Cancha');

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

module.exports = router;