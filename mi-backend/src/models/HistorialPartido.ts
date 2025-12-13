import mongoose, { Schema, Model } from 'mongoose';
import { IHistorialPartidoDocument } from '../types';

const historialPartidoSchema = new Schema<IHistorialPartidoDocument>({
  originalId: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
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
  arbitro: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  arbitroNombre: {
    type: String,
    default: 'Sin asignar'
  },
  canchaId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Cancha',
    default: null
  },
  estado: { 
    type: String, 
    enum: ['Finalizado', 'Cancelado'], 
    required: true 
  },
  razonEliminacion: {
    type: String,
    enum: ['automatica', 'manual'],
    default: 'automatica'
  },
  fechaEliminacion: {
    type: Date,
    default: Date.now
  },
  mesPartido: {
    type: Number,
    required: true
  },
  anoPartido: {
    type: Number,
    required: true
  },
  calificado: {
    type: Boolean,
    default: false
  },
  calificacionArbitro: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  comentarioCalificacion: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
historialPartidoSchema.index({ canchaId: 1, mesPartido: 1, anoPartido: 1 });
historialPartidoSchema.index({ fechaEliminacion: -1 });
historialPartidoSchema.index({ originalId: 1 });

const HistorialPartido: Model<IHistorialPartidoDocument> = mongoose.model<IHistorialPartidoDocument>(
  'HistorialPartido', 
  historialPartidoSchema
);

export default HistorialPartido;
