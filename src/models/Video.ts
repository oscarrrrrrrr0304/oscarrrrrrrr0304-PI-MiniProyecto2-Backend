/**
 * @fileoverview Modelo de Video de Pexels con información y conteo de likes.
 * @module models/Video
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface para el usuario de Pexels que subió el video.
 * @interface PexelsUser
 */
export interface PexelsUser {
  /** ID del usuario en Pexels */
  id: number;
  /** Nombre del usuario */
  name: string;
  /** URL del perfil del usuario en Pexels */
  url: string;
}

/**
 * Interface para los archivos de video en diferentes calidades.
 * @interface VideoFile
 */
export interface VideoFile {
  /** ID del archivo de video */
  id: number;
  /** Calidad del video (hd, sd, hls) */
  quality: string;
  /** Tipo de archivo (video/mp4, etc.) */
  file_type: string;
  /** Ancho del video (puede ser null) */
  width: number | null;
  /** Altura del video (puede ser null) */
  height: number | null;
  /** Link de descarga del video */
  link: string;
}

/**
 * Interface para las imágenes de preview del video.
 * @interface VideoPicture
 */
export interface VideoPicture {
  /** ID de la imagen */
  id: number;
  /** URL de la imagen de preview */
  picture: string;
  /** Número de la imagen */
  nr: number;
}

/**
 * Interface que define la estructura de un documento de video.
 * @interface IVideo
 * @extends {Document}
 */
export interface IVideo extends Document {
  /** ID único del video en Pexels */
  pexelsId: number;
  /** Ancho del video en píxeles */
  width: number;
  /** Altura del video en píxeles */
  height: number;
  /** URL de la página del video en Pexels */
  url: string;
  /** URL de la imagen de preview del video */
  image: string;
  /** Duración del video en segundos */
  duration: number;
  /** Usuario de Pexels que subió el video */
  user: PexelsUser;
  /** Archivos de video en diferentes calidades */
  video_files: VideoFile[];
  /** Imágenes de preview del video */
  video_pictures: VideoPicture[];
  /** Contador de likes que ha recibido el video */
  likesCount: number;
  /** Fecha de creación del documento */
  createdAt: Date;
  /** Fecha de última actualización del documento */
  updatedAt: Date;
}

/**
 * Schema anidado para el usuario de Pexels.
 */
const pexelsUserSchema = new Schema<PexelsUser>({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * Schema anidado para los archivos de video.
 */
const videoFileSchema = new Schema<VideoFile>({
  id: {
    type: Number,
    required: true
  },
  quality: {
    type: String,
    required: true
  },
  file_type: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    default: null
  },
  height: {
    type: Number,
    default: null
  },
  link: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * Schema anidado para las imágenes de preview.
 */
const videoPictureSchema = new Schema<VideoPicture>({
  id: {
    type: Number,
    required: true
  },
  picture: {
    type: String,
    required: true
  },
  nr: {
    type: Number,
    required: true
  }
}, { _id: false });

/**
 * Schema de Mongoose para el modelo de Video.
 * Incluye validaciones y configuración de timestamps automáticos.
 */
const videoSchema = new Schema<IVideo>({
  pexelsId: {
    type: Number,
    required: [true, 'El ID de Pexels es requerido'],
    unique: true,
    index: true
  },
  width: {
    type: Number,
    required: [true, 'El ancho es requerido'],
    min: [0, 'El ancho no puede ser negativo']
  },
  height: {
    type: Number,
    required: [true, 'La altura es requerida'],
    min: [0, 'La altura no puede ser negativa']
  },
  url: {
    type: String,
    required: [true, 'La URL es requerida']
  },
  image: {
    type: String,
    required: [true, 'La imagen es requerida']
  },
  duration: {
    type: Number,
    required: [true, 'La duración es requerida'],
    min: [0, 'La duración no puede ser negativa']
  },
  user: {
    type: pexelsUserSchema,
    required: [true, 'El usuario es requerido']
  },
  video_files: {
    type: [videoFileSchema],
    required: [true, 'Los archivos de video son requeridos']
  },
  video_pictures: {
    type: [videoPictureSchema],
    required: [true, 'Las imágenes de preview son requeridas']
  },
  likesCount: {
    type: Number,
    default: 0,
    min: [0, 'El conteo de likes no puede ser negativo']
  }
}, {
  timestamps: true
});

/**
 * Índice para búsquedas más rápidas por ID de Pexels.
 */
videoSchema.index({ pexelsId: 1 });

/**
 * Modelo de Mongoose para la colección de videos.
 * @type {mongoose.Model<IVideo>}
 */
const Video = mongoose.model<IVideo>('Video', videoSchema);
export { Video };
