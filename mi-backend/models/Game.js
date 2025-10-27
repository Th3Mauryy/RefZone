const mongoose = require('mongoose');

// Schema optimizado con índices para queries rápidas
const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  ubicacionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ubicacion', default: null }, // NUEVO: Referencia a ubicación
  arbitro: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  postulados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  estado: { type: String, default: 'programado', index: true },
  canchaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cancha', default: null, index: true },
  creadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }
}, { timestamps: true });

// Índices compuestos para optimizar queries comunes
gameSchema.index({ creadorId: 1, date: 1 });
gameSchema.index({ canchaId: 1, date: 1 });
gameSchema.index({ date: 1, time: 1 });
gameSchema.index({ ubicacionId: 1 }); // NUEVO: Índice para ubicación

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
