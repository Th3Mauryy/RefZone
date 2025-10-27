/**
 * Script para crear índices en la base de datos
 * Ejecutar una sola vez para optimizar queries
 * Comando: node scripts/createIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Game = require('../models/Game');

async function createIndexes() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión exitosa\n');

        console.log('📊 Creando índices para User...');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        console.log('✅ Índices de User creados\n');

        console.log('📊 Creando índices para Game...');
        await Game.collection.createIndex({ creadorId: 1 });
        await Game.collection.createIndex({ arbitro: 1 });
        await Game.collection.createIndex({ date: 1, time: 1 });
        await Game.collection.createIndex({ estado: 1 });
        await Game.collection.createIndex({ 'postulados': 1 });
        await Game.collection.createIndex({ canchaId: 1 });
        console.log('✅ Índices de Game creados\n');

        console.log('🎉 Todos los índices creados exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear índices:', error);
        process.exit(1);
    }
}

createIndexes();
