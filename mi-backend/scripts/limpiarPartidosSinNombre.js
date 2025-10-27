const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const Game = require('../models/Game');

async function limpiarPartidosSinNombre() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Buscar todos los partidos sin nombre o con nombre genérico
        const partidosSinNombre = await Game.find({
            $or: [
                { name: 'Partido sin nombre' },
                { name: '' },
                { name: null }
            ]
        }).select('_id name date time location creadorId arbitro');

        console.log(`📊 Partidos encontrados: ${partidosSinNombre.length}`);

        if (partidosSinNombre.length === 0) {
            console.log('✨ No hay partidos sin nombre para eliminar');
            await mongoose.connection.close();
            return;
        }

        // Mostrar resumen
        console.log('\n📋 Resumen de partidos a eliminar:');
        partidosSinNombre.forEach((partido, index) => {
            console.log(`${index + 1}. ID: ${partido._id} | Fecha: ${partido.date} | Hora: ${partido.time} | Ubicación: ${partido.location}`);
        });

        console.log('\n⚠️  ADVERTENCIA: Estos partidos serán eliminados permanentemente.');
        console.log('💡 Tip: Presiona Ctrl+C para cancelar en los próximos 5 segundos...\n');

        // Esperar 5 segundos antes de eliminar
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Eliminar los partidos
        const resultado = await Game.deleteMany({
            $or: [
                { name: 'Partido sin nombre' },
                { name: '' },
                { name: null }
            ]
        });

        console.log(`\n✅ Se eliminaron ${resultado.deletedCount} partidos sin nombre`);
        console.log('🎉 Limpieza completada exitosamente\n');

    } catch (error) {
        console.error('❌ Error al limpiar partidos:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Conexión cerrada');
        process.exit(0);
    }
}

// Ejecutar script
limpiarPartidosSinNombre();
