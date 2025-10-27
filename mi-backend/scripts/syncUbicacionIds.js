const mongoose = require('mongoose');
require('dotenv').config();

const Game = require('../models/Game');
const Ubicacion = require('../models/Ubicacion');

async function syncUbicacionIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todas las ubicaciones
        const ubicaciones = await Ubicacion.find({ activa: true });
        console.log(`📍 ${ubicaciones.length} ubicaciones encontradas`);

        // Obtener todos los partidos sin ubicacionId
        const partidosSinUbicacionId = await Game.find({ 
            $or: [
                { ubicacionId: null },
                { ubicacionId: { $exists: false } }
            ]
        });
        
        console.log(`🎮 ${partidosSinUbicacionId.length} partidos sin ubicacionId`);

        let actualizados = 0;

        for (const partido of partidosSinUbicacionId) {
            // Buscar ubicación que coincida con el nombre del partido
            const ubicacion = ubicaciones.find(
                ub => ub.nombre.toLowerCase().trim() === partido.location.toLowerCase().trim()
            );

            if (ubicacion) {
                partido.ubicacionId = ubicacion._id;
                await partido.save();
                console.log(`✅ Partido "${partido.name}" vinculado con ubicación "${ubicacion.nombre}"`);
                actualizados++;
            } else {
                console.log(`⚠️ Partido "${partido.name}" - No se encontró ubicación para "${partido.location}"`);
            }
        }

        console.log(`\n🎯 Resultado: ${actualizados} partidos actualizados`);
        
        await mongoose.disconnect();
        console.log('✅ Desconectado de MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

syncUbicacionIds();
