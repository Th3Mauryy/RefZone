const mongoose = require('mongoose');

const historialPartidoSchema = new mongoose.Schema({
    // Datos originales del partido
    name: String,
    date: Date,
    time: String,
    location: String,
    arbitro: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    postulados: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    canchaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cancha',
        required: true 
    },
    creadoPor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    
    // Datos del historial
    estadoFinal: { 
        type: String, 
        enum: ['finalizado', 'cancelado'], 
        required: true 
    },
    razonEliminacion: {
        type: String,
        enum: ['manual', 'automatica'], // manual = organizador, automatica = sistema
        required: true
    },
    fechaOriginalCreacion: {
        type: Date,
        required: true
    },
    fechaEliminacion: {
        type: Date,
        default: Date.now
    },
    
    // Datos adicionales para reportes
    mesPartido: {
        type: Number, // 1-12
        required: true
    },
    anoPartido: {
        type: Number, // 2025, 2026, etc.
        required: true
    }
}, {
    timestamps: true
});

// Índices para búsquedas eficientes
historialPartidoSchema.index({ canchaId: 1, mesPartido: 1, anoPartido: 1 });
historialPartidoSchema.index({ fechaEliminacion: -1 });

module.exports = mongoose.model('HistorialPartido', historialPartidoSchema);
