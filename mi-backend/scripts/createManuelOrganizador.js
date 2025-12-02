// scripts/createManuelOrganizador.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Cancha = require('../models/Cancha');
require('dotenv').config();

/**
 * Script para crear cuenta de organizador para Manuel Vázquez
 * Datos:
 * - Nombre: Manuel Vázquez
 * - Email: manuelvazgraz@gmail.com
 * - Teléfono: 314 160 6163
 * - Estadio: Unidad Deportiva Jaime "Tubo" Gomez
 */

async function createManuelOrganizador() {
    try {
        // Conectar a MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mi-base-de-datos';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado a MongoDB');

        // Datos del nuevo organizador
        const email = 'manuelvazgraz@gmail.com';
        const password = 'Tubo2069!'; // Contraseña personalizada
        const nombre = 'Manuel Vázquez';
        const contacto = '314 160 6163';
        const nombreCancha = 'Unidad Deportiva Jaime "Tubo" Gomez';

        // Verificar si el usuario ya existe
        let existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (existingUser) {
            console.log('⚠️  El usuario con email', email, 'ya existe. Actualizando datos...');
        }

        // Crear o buscar la cancha
        let cancha = await Cancha.findOne({ nombre: nombreCancha });
        
        if (!cancha) {
            cancha = new Cancha({
                nombre: nombreCancha,
                direccion: 'Guadalajara, Jalisco',
                telefono: contacto,
                email: email,
                descripcion: 'Unidad deportiva para partidos de fútbol',
                activa: true
            });
            await cancha.save();
            console.log('✅ Cancha creada:', nombreCancha);
        } else {
            console.log('ℹ️  Cancha ya existía:', nombreCancha);
        }

        // Crear o actualizar el organizador
        if (existingUser) {
            // Actualizar datos del usuario existente
            existingUser.nombre = nombre;
            existingUser.contacto = contacto;
            existingUser.canchaAsignada = cancha._id;
            existingUser.role = 'organizador';
            existingUser.experiencia = 'admin'; // Para organizadores
            
            await existingUser.save({ validateBeforeSave: false });
            console.log('✅ ¡Organizador actualizado exitosamente!');
        } else {
            // Crear nuevo organizador
            const newOrganizer = new User({
                email: email,
                password: password,
                nombre: nombre,
                edad: 30,
                contacto: contacto,
                experiencia: 'admin', // Para organizadores
                role: 'organizador',
                canchaAsignada: cancha._id,
                imagenPerfil: null
            });

            await newOrganizer.save();
            existingUser = newOrganizer;
            console.log('✅ ¡Organizador creado exitosamente!');
        }
        
        console.log('\n📋 Detalles de la cuenta:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Nombre:', nombre);
        console.log('📧 Email:', email);
        console.log('🔑 Contraseña:', password);
        console.log('📱 Teléfono:', contacto);
        console.log('🏟️  Cancha:', nombreCancha);
        console.log('🆔 Cancha ID:', cancha._id);
        console.log('👔 Role:', 'organizador');
        console.log('🆔 Usuario ID:', existingUser._id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error al crear el organizador:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada');
    }
}

// Ejecutar el script
createManuelOrganizador();
