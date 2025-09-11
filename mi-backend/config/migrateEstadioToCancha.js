/**
 * Script de migración para cambiar todas las referencias de "Estadio Golwin" a "Cancha Golwin"
 * Este script se ejecuta una sola vez para asegurar la consistencia en la terminología
 */
const mongoose = require('mongoose');
const Cancha = require('../models/Cancha');
const Game = require('../models/Game');

async function migrarEstadioACancha() {
    try {
        console.log('🔄 Iniciando migración de "Estadio Golwin" a "Cancha Golwin"...');

        // 1. Actualizar la cancha Golwin si existe
        const canchaGolwin = await Cancha.findOne({ nombre: 'Estadio Golwin' });
        if (canchaGolwin) {
            console.log('✅ Encontrada cancha con nombre "Estadio Golwin", actualizando a "Cancha Golwin"');
            canchaGolwin.nombre = 'Cancha Golwin';
            canchaGolwin.email = 'info@canchagolwin.com';
            canchaGolwin.descripcion = 'Cancha principal para partidos de fútbol 7';
            await canchaGolwin.save();
            console.log('✅ Cancha actualizada correctamente');
            
            // 2. Buscar cualquier otra referencia en otros documentos que puedan tener el nombre "Estadio Golwin"
            // Esto es por si hay algún campo de texto que no sea un ObjectId
            const partidosConEstadioGolwin = await Game.find({ 
                $or: [
                    { location: /Estadio Golwin/i },
                    { name: /Estadio Golwin/i }
                ]
            });
            
            if (partidosConEstadioGolwin.length > 0) {
                console.log(`🔍 Encontrados ${partidosConEstadioGolwin.length} partidos con referencias a "Estadio Golwin"`);
                
                for (const partido of partidosConEstadioGolwin) {
                    if (partido.location && partido.location.includes('Estadio Golwin')) {
                        partido.location = partido.location.replace('Estadio Golwin', 'Cancha Golwin');
                    }
                    if (partido.name && partido.name.includes('Estadio Golwin')) {
                        partido.name = partido.name.replace('Estadio Golwin', 'Cancha Golwin');
                    }
                    await partido.save();
                }
                
                console.log('✅ Partidos actualizados correctamente');
            } else {
                console.log('ℹ️ No se encontraron partidos con referencias textuales a "Estadio Golwin"');
            }
            
            console.log('✅ Migración completada con éxito');
        } else {
            console.log('ℹ️ No se encontró ninguna cancha con nombre "Estadio Golwin", no es necesaria la migración');
        }
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    }
}

module.exports = migrarEstadioACancha;
