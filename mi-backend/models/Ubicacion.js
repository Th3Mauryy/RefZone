const mongoose = require('mongoose');

const ubicacionSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    direccion: {
        type: String,
        required: false,
        trim: true
    },
    latitud: {
        type: Number,
        required: false
    },
    longitud: {
        type: Number,
        required: false
    },
    googleMapsUrl: {
        type: String,
        required: false
    },
    organizadorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    canchaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cancha',
        required: true,
        index: true
    },
    activa: {
        type: Boolean,
        default: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índice compuesto para búsquedas eficientes
ubicacionSchema.index({ organizadorId: 1, canchaId: 1 });

module.exports = mongoose.model('Ubicacion', ubicacionSchema);
