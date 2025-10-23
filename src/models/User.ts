/**
 * @fileoverview Modelo de Usuario con validaciones y métodos de autenticación.
 * @module models/User
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * Interface que define la estructura de un documento de usuario.
 * @interface IUser
 * @extends {Document}
 */
export interface IUser extends Document {
  /** Nombre completo del usuario */
  name: string;
  /** Correo electrónico único del usuario */
  email: string;
  /** Contraseña hasheada del usuario */
  password: string;
  /** Edad del usuario */
  age: number;
  /** Array de IDs de videos favoritos del usuario */
  favoriteVideos: string[];
  /** Token hasheado para reseteo de contraseña (opcional) */
  resetPasswordToken?: string;
  /** Fecha de expiración del token de reseteo (opcional) */
  resetPasswordExpires?: Date;
  /** Fecha de creación del documento */
  createdAt: Date;
  /** Fecha de última actualización del documento */
  updatedAt: Date;
  /**
   * Compara una contraseña en texto plano con la contraseña hasheada del usuario.
   * @param password - Contraseña en texto plano a comparar
   * @returns Promesa que resuelve a true si las contraseñas coinciden
   */
  comparePassword(password: string): Promise<boolean>;
}

/**
 * Schema de Mongoose para el modelo de Usuario.
 * Incluye validaciones y configuración de timestamps automáticos.
 */
const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  age: {
    type: Number,
    required: [true, 'La edad es requerida'],
    min: [0, 'La edad no puede ser negativa'],
    max: [120, 'La edad no puede ser mayor a 120 años']
  },
  favoriteVideos: {
    type: [String],
    default: []
  },
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  resetPasswordExpires: {
    type: Date,
    default: undefined
  }
}, {
  timestamps: true
});

/**
 * Middleware de Mongoose que hashea la contraseña antes de guardar el documento.
 * Solo se ejecuta si la contraseña ha sido modificada.
 */
userSchema.pre('save', async function(next: any) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Método de instancia para comparar una contraseña en texto plano con la hasheada.
 * @param password - Contraseña en texto plano a verificar
 * @returns Promesa que resuelve a true si las contraseñas coinciden
 */
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

/**
 * Modelo de Mongoose para la colección de usuarios.
 * @type {mongoose.Model<IUser>}
 */
const User = mongoose.model<IUser>('User', userSchema);
export { User };