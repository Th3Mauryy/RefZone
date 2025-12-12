import Game from '../models/Game';
import HistorialPartido from '../models/HistorialPartido';
import User from '../models/User';
import { IGame, IHistorialPartido } from '../types';

interface PartidoBasico {
    date: string;
    time: string;
    name?: string;
}

interface PartidoPendiente {
    nombre: string;
    fecha: string;
    hora?: string;
}

interface PartidosVerificados {
    finalizados: any[];
    porCalificar: { [key: string]: any[] };
}

/**
 * Verifica si un partido ha finalizado (1 HORA después de su hora de inicio)
 */
export function haFinalizadoPartido(partido: PartidoBasico): boolean {
    try {
        let fechaPartido: Date;
        
        // Detectar formato de fecha (DD/MM/YYYY o YYYY-MM-DD)
        if (partido.date.includes('/')) {
            const [dia, mes, ano] = partido.date.split('/').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else if (partido.date.includes('-')) {
            const [ano, mes, dia] = partido.date.split('-').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else {
            console.error('Formato de fecha desconocido:', partido.date);
            return false;
        }
        
        // Agregar 1 HORA a la fecha del partido
        const fechaFinalizacion = new Date(fechaPartido.getTime() + 60 * 60 * 1000);
        
        // Comparar con fecha actual EN ZONA HORARIA DE MÉXICO
        const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        
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
 */
export function haIniciado(partido: PartidoBasico): boolean {
    try {
        let fechaPartido: Date;
        
        // Detectar formato de fecha (DD/MM/YYYY o YYYY-MM-DD)
        if (partido.date.includes('/')) {
            const [dia, mes, ano] = partido.date.split('/').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else if (partido.date.includes('-')) {
            const [ano, mes, dia] = partido.date.split('-').map(Number);
            const [hora, minutos] = partido.time.split(':').map(Number);
            fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
        } else {
            console.error('Formato de fecha desconocido:', partido.date);
            return false;
        }
        
        // Comparar con fecha actual EN ZONA HORARIA DE MÉXICO
        const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        
        return ahora >= fechaPartido;
    } catch (error) {
        console.error('Error al verificar inicio de partido:', error);
        return false;
    }
}

/**
 * Mueve un partido finalizado al historial
 */
export async function moverAHistorial(partido: any): Promise<any> {
    try {
        // Extraer mes y año de la fecha del partido
        let dia: number, mes: number, ano: number;
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
 */
export async function verificarYFinalizarPartidos(): Promise<PartidosVerificados> {
    try {
        // Buscar todos los partidos activos
        const partidos = await Game.find({}).populate('arbitro', 'nombre email');
        
        console.log(`🔍 Verificando ${partidos.length} partidos activos...`);
        const ahora = new Date();
        console.log(`⏰ Fecha/hora actual del servidor: ${ahora.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
        
        const finalizados: any[] = [];
        const noFinalizados: PartidoPendiente[] = [];
        
        for (const partido of partidos) {
            const p = partido as any;
            console.log(`\n📌 Analizando partido: "${p.name}"`);
            console.log(`   📅 Fecha: ${p.date} | Hora: ${p.time}`);
            console.log(`   👤 Árbitro: ${p.arbitro ? p.arbitro.nombre : 'Sin asignar'}`);
            console.log(`   🏟️ Cancha ID: ${p.canchaId || 'Sin cancha'}`);
            
            const finalizó = haFinalizadoPartido(p);
            console.log(`   ✅ ¿Ha finalizado?: ${finalizó ? 'SÍ' : 'NO'}`);
            
            if (finalizó) {
                console.log(`   ⏰ Moviendo al historial...`);
                try {
                    const historial = await moverAHistorial(p);
                    finalizados.push(historial);
                    console.log(`   ✅ Movido exitosamente al historial`);
                } catch (error) {
                    const err = error as Error;
                    console.error(`   ❌ Error al mover al historial:`, err.message);
                }
            } else {
                noFinalizados.push({
                    nombre: p.name,
                    fecha: p.date,
                    hora: p.time
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
                    console.log(`   - ${p.nombre} (${p.fecha} ${p.hora})`);
                });
            }
        }
        
        // Obtener partidos pendientes de calificación (SOLO finalizados automáticamente, NO cancelados)
        const pendientesCalificacion = await HistorialPartido.find({
            arbitro: { $ne: null },
            calificado: false,
            estado: 'Finalizado'
        }).populate('arbitro', 'nombre email imagenPerfil calificacionPromedio totalCalificaciones');
        
        console.log(`\n📋 Total de partidos en historial pendientes de calificar: ${pendientesCalificacion.length}`);
        
        if (pendientesCalificacion.length === 0) {
            console.log('ℹ️ No hay partidos en el historial que cumplan:');
            console.log('   - Tener árbitro asignado');
            console.log('   - No estar calificados');
            console.log('   - Estado: Finalizado (no cancelados)');
        }
        
        // Agrupar por cancha/organizador
        const porOrganizador: { [key: string]: any[] } = {};
        for (const partido of pendientesCalificacion) {
            const p = partido as any;
            const canchaId = p.canchaId ? p.canchaId.toString() : 'sin-cancha';
            console.log(`\n📌 Partido pendiente de calificación:`);
            console.log(`   🏆 Nombre: ${p.nombre}`);
            console.log(`   🏟️ Cancha ID: ${canchaId}`);
            console.log(`   👤 Árbitro: ${p.arbitroNombre}`);
            console.log(`   📅 Fecha: ${p.fecha} ${p.hora}`);
            
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

export default {
    haFinalizadoPartido,
    haIniciado,
    moverAHistorial,
    verificarYFinalizarPartidos
};
