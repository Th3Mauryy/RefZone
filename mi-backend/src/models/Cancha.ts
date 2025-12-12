import mongoose, { Schema, Model } from 'mongoose';
import { ICanchaDocument } from '../types';

const canchaSchema = new Schema<ICanchaDocument>({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  direccion: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  logo: {
    type: String,
    default: null
  },
  descripcion: {
    type: String,
    trim: true
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

const Cancha: Model<ICanchaDocument> = mongoose.model<ICanchaDocument>('Cancha', canchaSchema);

export default Cancha;
