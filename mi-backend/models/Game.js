const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    name: String,
    date: Date,
    time: String,
    location: String,
    arbitro: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // CORREGIDO
    postulados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // CORREGIDO
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
