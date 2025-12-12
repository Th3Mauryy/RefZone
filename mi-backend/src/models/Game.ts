import mongoose, { Schema, Model } from 'mongoose';
import { IGameDocument } from '../types';

const gameSchema = new Schema<IGameDocument>({
  name: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  ubicacionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Ubicacion', 
    default: null 
  },
  arbitro: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    default: null, 
    index: true 
  },
  postulados: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  }],
  estado: { 
    type: String, 
    default: 'programado', 
    index: true 
  },
  canchaId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Cancha', 
    default: null, 
    index: true 
  },
  creadorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    default: null, 
    index: true 
  }
}, { timestamps: true });

// Índices compuestos para optimizar queries comunes
gameSchema.index({ creadorId: 1, date: 1 });
gameSchema.index({ canchaId: 1, date: 1 });
gameSchema.index({ date: 1, time: 1 });
gameSchema.index({ ubicacionId: 1 });

const Game: Model<IGameDocument> = mongoose.model<IGameDocument>('Game', gameSchema);

export default Game;
