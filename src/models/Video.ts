/**
 * @fileoverview Pexels video model with information and like counting.
 * @module models/Video
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface for the Pexels user who uploaded the video.
 * @interface PexelsUser
 */
export interface PexelsUser {
  /** User ID on Pexels */
  id: number;
  /** User's name */
  name: string;
  /** User's profile URL on Pexels */
  url: string;
}

/**
 * Interface for video files in different qualities.
 * @interface VideoFile
 */
export interface VideoFile {
  /** Video file ID */
  id: number;
  /** Video quality (hd, sd, hls) */
  quality: string;
  /** File type (video/mp4, etc.) */
  file_type: string;
  /** Video width (can be null) */
  width: number | null;
  /** Video height (can be null) */
  height: number | null;
  /** Video download link */
  link: string;
}

/**
 * Interface for video preview images.
 * @interface VideoPicture
 */
export interface VideoPicture {
  /** Image ID */
  id: number;
  /** Preview image URL */
  picture: string;
  /** Image number */
  nr: number;
}

/**
 * Interface for video ratings.
 * @interface Rating
 */
export interface Rating {
  /** User ID who gave the rating */
  userId: mongoose.Types.ObjectId;
  /** Rating value (1-5) */
  rating: number;
  /** Date when the rating was given */
  createdAt: Date;
}

/**
 * Interface for video comments.
 * @interface Comment
 */
export interface Comment {
  /** User ID who made the comment */
  userId: mongoose.Types.ObjectId;
  /** User's name */
  userName: string;
  /** Comment text */
  text: string;
  /** Date when the comment was made */
  createdAt: Date;
}

/**
 * Interface that defines the structure of a video document.
 * @interface IVideo
 * @extends {Document}
 */
export interface IVideo extends Document {
  /** Unique video ID on Pexels */
  pexelsId: number;
  /** Video width in pixels */
  width: number;
  /** Video height in pixels */
  height: number;
  /** Video page URL on Pexels */
  url: string;
  /** Video preview image URL */
  image: string;
  /** Video duration in seconds */
  duration: number;
  /** Tags associated with the video */
  tags: string[];
  /** Pexels user who uploaded the video */
  user: PexelsUser;
  /** Video files in different qualities */
  video_files: VideoFile[];
  /** Video preview images */
  video_pictures: VideoPicture[];
  /** Number of likes the video has received */
  likesCount: number;
  /** Ratings given to the video */
  ratings: Rating[];
  /** Average rating (calculated) */
  averageRating: number;
  /** Comments on the video */
  comments: Comment[];
  /** Document creation date */
  createdAt: Date;
  /** Last document update date */
  updatedAt: Date;
}

/**
 * Nested schema for Pexels user.
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
 * Nested schema for video files.
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
 * Nested schema for preview images.
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
 * Nested schema for ratings.
 */
const ratingSchema = new Schema<Rating>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * Nested schema for comments.
 */
const commentSchema = new Schema<Comment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: [true, 'El texto del comentario es requerido'],
    maxlength: [1000, 'El comentario no puede exceder 1000 caracteres']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

/**
 * Mongoose schema for Video model.
 * Includes validations and automatic timestamps configuration.
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
  tags: {
    type: [String],
    default: []
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
  },
  ratings: {
    type: [ratingSchema],
    default: []
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'La calificación promedio no puede ser negativa'],
    max: [5, 'La calificación promedio no puede ser mayor a 5']
  },
  comments: {
    type: [commentSchema],
    default: []
  }
}, {
  timestamps: true
});

/**
 * Index for faster searches by Pexels ID.
 */
videoSchema.index({ pexelsId: 1 });

/**
 * Mongoose model for the videos collection.
 * @type {mongoose.Model<IVideo>}
 */
const Video = mongoose.model<IVideo>('Video', videoSchema);
export { Video };
