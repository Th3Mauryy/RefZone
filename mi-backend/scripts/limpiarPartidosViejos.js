/**
 * Script para limpiar partidos viejos que no fueron eliminados automáticamente
 * Ejecutar con: node scripts/limpiarPartidosViejos.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const Cancha = require('../models/Cancha');
const HistorialPartido = require('../models/HistorialPartido');

async function limpiarPartidosViejos() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');
        
        const ahora = new Date();
        console.log(`📅 Fecha y hora actual: ${ahora.toLocaleString('es-ES')}\n`);
        
        // Obtener todos los partidos
        const partidos = await Game.find()
            .populate('arbitro', 'nombre email')
            .populate('canchaId', 'nombre');
        
        console.log(`🎮 Total de partidos encontrados: ${partidos.length}\n`);
        
        let eliminados = 0;
        let errores = 0;
        
        for (const partido of partidos) {
            try {
                // Construir la fecha y hora del partido
                let fechaPartido;
                
                if (typeof partido.date === 'string' && typeof partido.time === 'string') {
                    fechaPartido = new Date(`${partido.date}T${partido.time}`);
                } else {
                    console.log(`⚠️ Formato de fecha inválido en partido: ${partido.name}`);
                    continue;
                }
                
                // Verificar si es una fecha válida
                if (isNaN(fechaPartido)) {
                    console.log(`⚠️ Fecha inválida en partido: ${partido.name}`);
                    continue;
                }
                
                // Agregar 1 hora a la fecha del partido
                const fechaEliminacion = new Date(fechaPartido.getTime() + (60 * 60 * 1000));
                
                // Si ya pasó 1 hora desde el partido, eliminarlo
                if (ahora >= fechaEliminacion) {
                    console.log(`🗑️ Eliminando partido: "${partido.name}"`);
                    console.log(`   📅 Fecha: ${partido.date} ${partido.time}`);
                    console.log(`   🏟️ Cancha: ${partido.canchaId?.nombre || 'Sin cancha'}`);
                    console.log(`   👤 Árbitro: ${partido.arbitro?.nombre || 'Sin asignar'}`);
                    
                    // Extraer mes y año de la fecha
                    const [year, month] = partido.date.split('-').map(Number);
                    
                    // Guardar en historial
                    const historialPartido = new HistorialPartido({
                        originalId: partido._id,
                        nombre: partido.name,
                        fecha: partido.date,
                        hora: partido.time,
                        ubicacion: partido.location,
                        arbitro: partido.arbitro ? partido.arbitro._id : null,
                        arbitroNombre: partido.arbitro ? partido.arbitro.nombre : 'Sin asignar',
                        estado: 'Finalizado',
                        canchaId: partido.canchaId?._id || null,
                        razonEliminacion: 'automatica',
                        mesPartido: month,
                        anoPartido: year
                    });
                    
                    await historialPartido.save();
                    await Game.findByIdAndDelete(partido._id);
                    
                    console.log(`   ✅ Movido al historial y eliminado\n`);
                    eliminados++;
                } else {
                    const tiempoRestante = fechaEliminacion - ahora;
                    const horasRestantes = Math.floor(tiempoRestante / (60 * 60 * 1000));
                    const minutosRestantes = Math.floor((tiempoRestante % (60 * 60 * 1000)) / (60 * 1000));
                    
                    console.log(`⏳ Partido futuro: "${partido.name}"`);
                    console.log(`   📅 Fecha: ${partido.date} ${partido.time}`);
                    console.log(`   ⏰ Se eliminará en: ${horasRestantes}h ${minutosRestantes}m\n`);
                }
            } catch (error) {
                console.error(`❌ Error procesando partido "${partido.name}":`, error.message);
                errores++;
            }
        }
        
        console.log('\n═══════════════════════════════════════');
        console.log('📊 RESUMEN DE LIMPIEZA');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Partidos eliminados: ${eliminados}`);
        console.log(`❌ Errores encontrados: ${errores}`);
        console.log(`📝 Partidos restantes: ${partidos.length - eliminados}`);
        console.log('═══════════════════════════════════════\n');
        
    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Desconectado de MongoDB');
        process.exit(0);
    }
}

// Ejecutar el script
limpiarPartidosViejos();
