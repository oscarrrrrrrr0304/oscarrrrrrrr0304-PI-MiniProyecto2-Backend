/**
 * @fileoverview User model with validations and authentication methods.
 * @module models/User
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * Interface that defines the structure of a user document.
 * @interface IUser
 * @extends {Document}
 */
export interface IUser extends Document {
  /** User's full name */
  name: string;
  /** User's unique email address */
  email: string;
  /** User's hashed password */
  password: string;
  /** User's age */
  age: number;
  /** Array of user's favorite video IDs (deprecated - use moviesLiked) */
  favoriteVideos: string[];
  /** Array of MongoDB IDs of videos that the user liked */
  moviesLiked: mongoose.Types.ObjectId[];
  /** Hashed token for password reset (optional) */
  resetPasswordToken?: string;
  /** Expiration date for reset token (optional) */
  resetPasswordExpires?: Date;
  /** Document creation date */
  createdAt: Date;
  /** Last document update date */
  updatedAt: Date;
  /**
   * Compares a plain text password with the user's hashed password.
   * @param password - Plain text password to compare
   * @returns Promise that resolves to true if passwords match
   */
  comparePassword(password: string): Promise<boolean>;
}

/**
 * Mongoose schema for User model.
 * Includes validations and automatic timestamps configuration.
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
  moviesLiked: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
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
 * Mongoose middleware that hashes the password before saving the document.
 * Only executes if password has been modified.
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
 * Instance method to compare a plain text password with the hashed one.
 * @param password - Plain text password to verify
 * @returns Promise that resolves to true if passwords match
 */
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

/**
 * Mongoose model for the users collection.
 * @type {mongoose.Model<IUser>}
 */
const User = mongoose.model<IUser>('User', userSchema);
export { User };