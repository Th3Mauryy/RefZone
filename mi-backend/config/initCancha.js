const Cancha = require('../models/Cancha');
const User = require('../models/User');

async function crearCanchaGolwin() {
    try {
        // Verificar si ya existe la cancha Golwin
        const canchaExistente = await Cancha.findOne({ nombre: 'Cancha Golwin' });
        
        if (!canchaExistente) {
            // Crear cancha Golwin
            const nuevaCancha = new Cancha({
                nombre: 'Cancha Golwin',
                direccion: 'Av. Deportiva #123, Ciudad',
                telefono: '+52 123 456 7890',
                email: 'info@canchagolwin.com',
                descripcion: 'Cancha principal para partidos de fútbol 7',
                activa: true
            });
            
            await nuevaCancha.save();
            console.log('✅ Cancha Golwin creada exitosamente');
            
            // Asignar cancha al organizador existente
            const organizador = await User.findOne({ 
                email: 'organizador@gmail.com',
                role: 'organizador' 
            });
            
            if (organizador) {
                organizador.canchaAsignada = nuevaCancha._id;
                await organizador.save({ validateBeforeSave: false }); // Evitar validación de campos requeridos
                console.log('✅ Organizador asignado a Cancha Golwin');
            } else {
                console.log('⚠️ No se encontró el organizador para asignar');
            }
            
        } else {
            console.log('ℹ️ Cancha Golwin ya existe');
            
            // Verificar si el organizador ya tiene cancha asignada
            const organizador = await User.findOne({ 
                email: 'organizador@gmail.com',
                role: 'organizador' 
            });
            
            if (organizador && !organizador.canchaAsignada) {
                organizador.canchaAsignada = canchaExistente._id;
                await organizador.save({ validateBeforeSave: false }); // Evitar validación de campos requeridos
                console.log('✅ Organizador asignado a Cancha Golwin existente');
            }
        }
        
    } catch (error) {
        console.error('❌ Error al crear cancha Golwin:', error);
    }
}

module.exports = crearCanchaGolwin;
