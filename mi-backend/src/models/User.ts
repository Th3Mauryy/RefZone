import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserDocument, ICalificacion } from '../types';

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

const calificacionSchema = new Schema<ICalificacion>({
  organizadorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  partidoId: { 
    type: Schema.Types.ObjectId,
    required: true 
  },
  estrellas: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5 
  },
  comentario: { 
    type: String, 
    default: '' 
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  }
});

const userSchema = new Schema<IUserDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  nombre: { 
    type: String, 
    required: true 
  },
  edad: { 
    type: Number, 
    required: true 
  },
  contacto: { 
    type: String, 
    required: true 
  },
  experiencia: { 
    type: String, 
    required: true 
  },
  imagenPerfil: { 
    type: String, 
    default: null 
  },
  role: { 
    type: String, 
    default: 'arbitro', 
    index: true 
  },
  canchaAsignada: { 
    type: Schema.Types.ObjectId, 
    ref: 'Cancha',
    default: null 
  },
  calificacionPromedio: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5 
  },
  totalCalificaciones: { 
    type: Number, 
    default: 0 
  },
  calificaciones: [calificacionSchema]
}, { timestamps: true });

// Índices
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

/**
 * Compara la contraseña proporcionada con la contraseña hasheada del usuario
 */
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Genera un token JWT para autenticación del usuario
 */
userSchema.methods.generateAuthToken = function(): string {
  const token = jwt.sign(
    { _id: this._id, role: this.role }, 
    process.env.JWT_SECRET || 'secure-jwt-fallback', 
    { expiresIn: '1h' }
  );
  return token;
};

// Encriptar la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Verificar si la contraseña ya está encriptada
  if (this.password.startsWith('$2b$')) {
    console.log('Contraseña ya está encriptada. No se volverá a encriptar.');
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Contraseña encriptada:', this.password);
  next();
});

// Normalizar datos antes de guardar
userSchema.pre('save', function(next) {
  if (this.isModified('contacto')) {
    this.contacto = this.contacto.trim();
  }
  if (this.isModified('email')) {
    this.email = this.email.trim().toLowerCase();
  }
  if (this.isModified('nombre')) {
    this.nombre = this.nombre.trim();
  }
  console.log('Datos normalizados:', { 
    contacto: this.contacto, 
    email: this.email, 
    nombre: this.nombre 
  });
  next();
});

const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);

export default User;
