const Game = require('../models/Game');
const HistorialPartido = require('../models/HistorialPartido');

/**
 * Verifica si un partido ha finalizado (1 HORA después de su hora de inicio)
 * @param {Object} partido - Objeto del partido con fecha y hora
 * @returns {Boolean} - True si el partido finalizó hace más de 1 hora
 */
function haFinalizadoPartido(partido) {
    try {
        let fechaPartido;
        
        // Detectar formato de fecha (DD/MM/YYYY o YYYY-MM-DD)
        if (partido.date.includes('/')) {
            // Formato DD/MM/YYYY
            const [dia, mes, ano] = partido.date.split('/').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else if (partido.date.includes('-')) {
            // Formato YYYY-MM-DD
            const [ano, mes, dia] = partido.date.split('-').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else {
            console.error('Formato de fecha desconocido:', partido.date);
            return false;
        }
        
        // Agregar 1 HORA a la fecha del partido
        const fechaFinalizacion = new Date(fechaPartido.getTime() + 60 * 60 * 1000);
        
        // Comparar con fecha actual
        const ahora = new Date();
        
        console.log(`🕐 Verificando finalización de partido "${partido.name}":`, {
            fechaOriginal: partido.date,
            fechaPartido: fechaPartido.toLocaleString('es-MX'),
            fechaFinalizacion: fechaFinalizacion.toLocaleString('es-MX'),
            ahora: ahora.toLocaleString('es-MX'),
            haFinalizado: ahora >= fechaFinalizacion
        });
        
        return ahora >= fechaFinalizacion;
    } catch (error) {
        console.error('Error al verificar finalización de partido:', error);
        return false;
    }
}

/**
 * Verifica si un partido ya ha iniciado (llegó a su fecha/hora)
 * @param {Object} partido - Objeto del partido con fecha y hora
 * @returns {Boolean} - True si el partido ya inició
 */
function haIniciado(partido) {
    try {
        let fechaPartido;
        
        // Detectar formato de fecha (DD/MM/YYYY o YYYY-MM-DD)
        if (partido.date.includes('/')) {
            // Formato DD/MM/YYYY
            const [dia, mes, ano] = partido.date.split('/').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else if (partido.date.includes('-')) {
            // Formato YYYY-MM-DD
            const [ano, mes, dia] = partido.date.split('-').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else {
            console.error('Formato de fecha desconocido:', partido.date);
            return false;
        }
        
        // Comparar con fecha actual
        const ahora = new Date();
        
        return ahora >= fechaPartido;
    } catch (error) {
        console.error('Error al verificar inicio de partido:', error);
        return false;
    }
}

/**
 * Mueve un partido finalizado al historial
 * @param {Object} partido - Partido a mover al historial
 * @returns {Object} - Registro del historial creado
 */
async function moverAHistorial(partido) {
    try {
        // Extraer mes y año de la fecha del partido
        let dia, mes, ano;
        if (partido.date.includes('/')) {
            [dia, mes, ano] = partido.date.split('/').map(Number);
        } else if (partido.date.includes('-')) {
            [ano, mes, dia] = partido.date.split('-').map(Number);
        } else {
            throw new Error('Formato de fecha desconocido: ' + partido.date);
        }
        
        // Obtener nombre del árbitro si existe
        let arbitroNombre = 'Sin asignar';
        if (partido.arbitro) {
            const arbitroData = typeof partido.arbitro === 'object' ? partido.arbitro : null;
            if (arbitroData && arbitroData.nombre) {
                arbitroNombre = arbitroData.nombre;
            } else {
                // Si no está poblado, buscar el árbitro
                const User = require('../models/User');
                const arbitro = await User.findById(partido.arbitro);
                if (arbitro) {
                    arbitroNombre = arbitro.nombre;
                }
            }
        }
        
        // Crear registro en historial
        const historial = new HistorialPartido({
            originalId: partido._id,
            nombre: partido.name,
            fecha: partido.date,
            hora: partido.time,
            ubicacion: partido.location,
            arbitro: partido.arbitro || null,
            arbitroNombre: arbitroNombre,
            canchaId: partido.canchaId,
            estado: 'Finalizado',
            razonEliminacion: 'automatica',
            mesPartido: mes,
            anoPartido: ano,
            calificado: false
        });
        
        await historial.save();
        
        // Eliminar el partido de la colección activa
        await Game.findByIdAndDelete(partido._id);
        
        console.log(`✅ Partido "${partido.name}" movido al historial automáticamente`);
        
        return historial;
    } catch (error) {
        console.error('Error al mover partido al historial:', error);
        throw error;
    }
}

/**
 * Verifica todos los partidos y mueve los finalizados al historial
 * Retorna los partidos pendientes de calificación por organizador
 * @returns {Object} - { finalizados: Array, porCalificar: Object }
 */
async function verificarYFinalizarPartidos() {
    try {
        // Buscar todos los partidos activos
        const partidos = await Game.find({}).populate('arbitro', 'nombre email');
        
        console.log(`🔍 Verificando ${partidos.length} partidos activos...`);
        const ahora = new Date();
        console.log(`⏰ Fecha/hora actual del servidor: ${ahora.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
        
        const finalizados = [];
        const noFinalizados = [];
        
        for (const partido of partidos) {
            // Log detallado de cada partido
            console.log(`\n📌 Analizando partido: "${partido.name}"`);
            console.log(`   📅 Fecha: ${partido.date} | Hora: ${partido.time}`);
            console.log(`   👤 Árbitro: ${partido.arbitro ? partido.arbitro.nombre : 'Sin asignar'}`);
            console.log(`   🏟️ Cancha ID: ${partido.canchaId || 'Sin cancha'}`);
            
            const finalizó = haFinalizadoPartido(partido);
            console.log(`   ✅ ¿Ha finalizado?: ${finalizó ? 'SÍ' : 'NO'}`);
            
            if (finalizó) {
                console.log(`   ⏰ Moviendo al historial...`);
                try {
                    const historial = await moverAHistorial(partido);
                    finalizados.push(historial);
                    console.log(`   ✅ Movido exitosamente al historial`);
                } catch (error) {
                    console.error(`   ❌ Error al mover al historial:`, error.message);
                }
            } else {
                noFinalizados.push({
                    nombre: partido.name,
                    fecha: partido.date,
                    hora: partido.time
                });
            }
        }
        
        if (finalizados.length > 0) {
            console.log(`\n🎯 ${finalizados.length} partido(s) finalizado(s) automáticamente`);
        } else {
            console.log(`\n⏳ Ningún partido finalizado en esta verificación`);
            if (noFinalizados.length > 0) {
                console.log(`📋 Partidos que aún no finalizan (necesitan 1 hora después de inicio):`);
                noFinalizados.forEach(p => {
                    console.log(`   - ${p.nombre} (${p.fecha} ${p.time})`);
                });
            }
        }
        
        // Obtener partidos pendientes de calificación (SOLO finalizados automáticamente, NO cancelados)
        const pendientesCalificacion = await HistorialPartido.find({
            arbitro: { $ne: null },
            calificado: false,
            estado: 'Finalizado' // CRÍTICO: Excluir partidos cancelados
        }).populate('arbitro', 'nombre email imagenPerfil calificacionPromedio totalCalificaciones');
        
        console.log(`\n📋 Total de partidos en historial pendientes de calificar: ${pendientesCalificacion.length}`);
        
        if (pendientesCalificacion.length === 0) {
            console.log('ℹ️ No hay partidos en el historial que cumplan:');
            console.log('   - Tener árbitro asignado');
            console.log('   - No estar calificados');
            console.log('   - Estado: Finalizado (no cancelados)');
        }
        
        // Agrupar por cancha/organizador
        const porOrganizador = {};
        for (const partido of pendientesCalificacion) {
            const canchaId = partido.canchaId ? partido.canchaId.toString() : 'sin-cancha';
            console.log(`\n📌 Partido pendiente de calificación:`);
            console.log(`   🏆 Nombre: ${partido.nombre}`);
            console.log(`   🏟️ Cancha ID: ${canchaId}`);
            console.log(`   👤 Árbitro: ${partido.arbitroNombre}`);
            console.log(`   📅 Fecha: ${partido.fecha} ${partido.hora}`);
            
            if (!porOrganizador[canchaId]) {
                porOrganizador[canchaId] = [];
            }
            porOrganizador[canchaId].push(partido);
        }
        
        console.log(`\n📊 Resumen por cancha:`);
        Object.keys(porOrganizador).forEach(id => {
            console.log(`   🏟️ Cancha ${id}: ${porOrganizador[id].length} partido(s) pendiente(s)`);
        });
        
        return {
            finalizados,
            porCalificar: porOrganizador
        };
    } catch (error) {
        console.error('❌ Error en verificarYFinalizarPartidos:', error);
        throw error;
    }
}

module.exports = {
    haFinalizadoPartido,
    haIniciado,
    moverAHistorial,
    verificarYFinalizarPartidos
};
