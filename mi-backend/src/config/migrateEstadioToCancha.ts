/**
 * Script de migración para cambiar todas las referencias de "Estadio Golwin" a "Cancha Golwin"
 */
import Cancha from '../models/Cancha';
import Game from '../models/Game';

async function migrarEstadioACancha(): Promise<void> {
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
            
            // 2. Buscar cualquier otra referencia
            const partidosConEstadioGolwin = await Game.find({ 
                $or: [
                    { location: /Estadio Golwin/i },
                    { name: /Estadio Golwin/i }
                ]
            });
            
            if (partidosConEstadioGolwin.length > 0) {
                console.log(`🔍 Encontrados ${partidosConEstadioGolwin.length} partidos con referencias a "Estadio Golwin"`);
                
                for (const partido of partidosConEstadioGolwin) {
                    const p = partido as any;
                    if (p.location && p.location.includes('Estadio Golwin')) {
                        p.location = p.location.replace('Estadio Golwin', 'Cancha Golwin');
                    }
                    if (p.name && p.name.includes('Estadio Golwin')) {
                        p.name = p.name.replace('Estadio Golwin', 'Cancha Golwin');
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

export default migrarEstadioACancha;
