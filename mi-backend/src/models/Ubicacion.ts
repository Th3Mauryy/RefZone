import mongoose, { Schema, Model } from 'mongoose';
import { IUbicacionDocument } from '../types';

const ubicacionSchema = new Schema<IUbicacionDocument>({
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  canchaId: {
    type: Schema.Types.ObjectId,
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

const Ubicacion: Model<IUbicacionDocument> = mongoose.model<IUbicacionDocument>('Ubicacion', ubicacionSchema);

export default Ubicacion;
