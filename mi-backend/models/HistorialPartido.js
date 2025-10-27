const mongoose = require('mongoose');

const historialPartidoSchema = new mongoose.Schema({
    // ID original del partido eliminado
    originalId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    
    // Datos originales del partido
    nombre: { 
        type: String, 
        required: true 
    },
    fecha: { 
        type: String, 
        required: true 
    },
    hora: { 
        type: String, 
        required: true 
    },
    ubicacion: { 
        type: String, 
        required: true 
    },
    
    // Árbitro asignado (puede ser null)
    arbitro: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },
    arbitroNombre: {
        type: String,
        default: 'Sin asignar'
    },
    
    // Cancha del partido (opcional para partidos antiguos)
    canchaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cancha',
        default: null
    },
    
    // Estado final del partido
    estado: { 
        type: String, 
        enum: ['Finalizado', 'Cancelado'], 
        required: true 
    },
    
    // Razón de eliminación
    razonEliminacion: {
        type: String,
        enum: ['automatica', 'manual'], // automatica = cron job, manual = organizador
        default: 'automatica'
    },
    
    // Fecha de eliminación
    fechaEliminacion: {
        type: Date,
        default: Date.now
    },
    
    // Datos adicionales para reportes
    mesPartido: {
        type: Number, // 1-12 (extraído de fecha)
        required: true
    },
    anoPartido: {
        type: Number, // 2025, 2026, etc. (extraído de fecha)
        required: true
    },
    
    // Indica si el organizador ya calificó al árbitro de este partido
    calificado: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para búsquedas eficientes
historialPartidoSchema.index({ canchaId: 1, mesPartido: 1, anoPartido: 1 });
historialPartidoSchema.index({ fechaEliminacion: -1 });
historialPartidoSchema.index({ originalId: 1 });

module.exports = mongoose.model('HistorialPartido', historialPartidoSchema);
