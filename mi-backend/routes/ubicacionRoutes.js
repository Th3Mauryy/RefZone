const express = require('express');
const router = express.Router();
const Ubicacion = require('../models/Ubicacion');
const verifyToken = require('../middleware/authMiddleware');

// Obtener ubicaciones - OPTIMIZADO
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = { activa: true };
        
        if (req.user.role === 'organizador') {
            query.organizadorId = req.user.id;
        }
        
        const ubicaciones = await Ubicacion.find(query)
            .select('-__v')
            .sort({ nombre: 1 })
            .lean();
        
        res.status(200).json(ubicaciones);
    } catch (error) {
        console.error('Error obtener ubicaciones:', error.message);
        res.status(500).json({ message: 'Error al obtener ubicaciones' });
    }
});

// Crear ubicación - OPTIMIZADO
router.post('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'organizador') {
            return res.status(403).json({ message: 'Solo organizadores pueden crear ubicaciones' });
        }
        
        const { nombre, direccion, latitud, longitud, googleMapsUrl, canchaId } = req.body;
        
        // Validaciones (CP-034, CP-035)
        if (!nombre?.trim()) {
            return res.status(400).json({ message: 'El nombre de la cancha es requerido' });
        }
        
        if (!direccion || direccion.trim().length < 10) {
            return res.status(400).json({ message: 'La dirección debe tener al menos 10 caracteres' });
        }
        
        if (!latitud || !longitud) {
            return res.status(400).json({ message: 'Debes marcar la ubicación en el mapa (latitud y longitud requeridas)' });
        }
        
        // Validar que las coordenadas sean números válidos
        const lat = parseFloat(latitud);
        const lng = parseFloat(longitud);
        
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ message: 'Coordenadas inválidas. Por favor marca la ubicación en el mapa correctamente' });
        }
        
        const nuevaUbicacion = await Ubicacion.create({
            nombre: nombre.trim(),
            direccion: direccion.trim(),
            latitud: lat,
            longitud: lng,
            googleMapsUrl: googleMapsUrl || `https://www.google.com/maps?q=${lat},${lng}`,
            organizadorId: req.user.id,
            canchaId: canchaId || req.user.canchaAsignada,
            activa: true
        });
        
        res.status(201).json(nuevaUbicacion);
    } catch (error) {
        console.error('Error crear ubicación:', error.message);
        res.status(500).json({ message: 'Error al crear ubicación' });
    }
});

// Actualizar una ubicación
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { nombre, direccion, latitud, longitud, googleMapsUrl } = req.body;
        const ubicacionId = req.params.id;
        const organizadorId = req.user.id;
        
        // Buscar la ubicación y verificar que pertenezca al organizador
        const ubicacion = await Ubicacion.findOne({
            _id: ubicacionId,
            organizadorId: organizadorId
        });
        
        if (!ubicacion) {
            return res.status(404).json({ message: 'Ubicación no encontrada o no tienes permiso para editarla' });
        }
        
        // Validaciones (CP-036)
        if (nombre !== undefined && !nombre.trim()) {
            return res.status(400).json({ message: 'El nombre de la cancha no puede estar vacío' });
        }
        
        if (direccion !== undefined && direccion.trim().length < 10) {
            return res.status(400).json({ message: 'La dirección debe tener al menos 10 caracteres' });
        }
        
        if ((latitud !== undefined || longitud !== undefined)) {
            if (!latitud || !longitud) {
                return res.status(400).json({ message: 'Debes proporcionar tanto latitud como longitud' });
            }
            
            const lat = parseFloat(latitud);
            const lng = parseFloat(longitud);
            
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({ message: 'Coordenadas inválidas' });
            }
        }
        
        // Guardar el nombre anterior ANTES de actualizar
        const nombreAnterior = nombre ? ubicacion.nombre : null;

        // Actualizar campos
        if (nombre) ubicacion.nombre = nombre.trim();
        if (direccion !== undefined) ubicacion.direccion = direccion.trim();
        if (latitud !== undefined) ubicacion.latitud = parseFloat(latitud);
        if (longitud !== undefined) ubicacion.longitud = parseFloat(longitud);
        if (googleMapsUrl !== undefined) ubicacion.googleMapsUrl = googleMapsUrl;
        
        await ubicacion.save();
        
        // 🔄 ACTUALIZAR PARTIDOS: Actualizar location en todos los partidos que usan esta ubicacionId O el nombre anterior
        if (nombre) {
            const Game = require('../models/Game');
            
            console.log(`🔄 Actualizando de "${nombreAnterior}" → "${nombre.trim()}"`);
            
            // Actualizar partidos que tienen el ubicacionId (nuevos partidos)
            const actualizacionPorId = await Game.updateMany(
                { ubicacionId: ubicacionId },
                { $set: { location: nombre.trim() } }
            );
            
            // Actualizar partidos que tienen el nombre antiguo pero NO tienen ubicacionId (partidos viejos)
            const actualizacionPorNombre = nombreAnterior ? await Game.updateMany(
                { 
                    location: nombreAnterior,
                    $or: [
                        { ubicacionId: null },
                        { ubicacionId: { $exists: false } }
                    ]
                },
                { 
                    $set: { 
                        location: nombre.trim(),
                        ubicacionId: ubicacionId // También asignar el ID para futuros cambios
                    } 
                }
            ) : { modifiedCount: 0 };
            
            const totalActualizados = actualizacionPorId.modifiedCount + actualizacionPorNombre.modifiedCount;
            
            console.log(`✅ Ubicación actualizada: ${ubicacion._id} → "${nombre.trim()}"`);
            console.log(`📊 Partidos con ubicacionId actualizados: ${actualizacionPorId.modifiedCount}`);
            console.log(`📊 Partidos con nombre antiguo actualizados: ${actualizacionPorNombre.modifiedCount}`);
            console.log(`🎯 Total partidos actualizados: ${totalActualizados}`);
        }
        
        res.status(200).json(ubicacion);
    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({ message: 'Error al actualizar ubicación', error: error.message });
    }
});

// Eliminar (desactivar) una ubicación
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const ubicacionId = req.params.id;
        const organizadorId = req.user.id;
        
        // Buscar la ubicación y verificar que pertenezca al organizador
        const ubicacion = await Ubicacion.findOne({
            _id: ubicacionId,
            organizadorId: organizadorId
        });
        
        if (!ubicacion) {
            return res.status(404).json({ message: 'Ubicación no encontrada o no tienes permiso para eliminarla' });
        }
        
        // Desactivar en lugar de eliminar
        ubicacion.activa = false;
        await ubicacion.save();
        
        res.status(200).json({ message: 'Ubicación eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar ubicación:', error);
        res.status(500).json({ message: 'Error al eliminar ubicación', error: error.message });
    }
});

module.exports = router;
