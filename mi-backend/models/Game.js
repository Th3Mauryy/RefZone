const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    name: String,
    date: Date,
    time: String,
    location: String,
    arbitro: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postulados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    canchaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cancha',
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['activo', 'finalizado', 'cancelado'], 
        default: 'activo' 
    },
    creadoPor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
