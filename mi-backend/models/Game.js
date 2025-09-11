const mongoose = require('mongoose');

// Cambiar los campos requeridos o añadir valores por defecto
const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  arbitro: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  postulados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  estado: { type: String, default: 'programado' },
  canchaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cancha', default: null }
  // Otros campos que puedas tener...
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
