/**
 * @fileoverview Controlador de videos que maneja operaciones con la API de Pexels y likes.
 * @module controllers/videoController
 */

import { Request, Response } from 'express';
import { Video } from '../models/Video';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Interfaz para la respuesta de la API de Pexels.
 */
interface PexelsVideoResponse {
  page: number;
  per_page: number;
  total_results: number;
  url: string;
  videos: Array<{
    id: number;
    width: number;
    height: number;
    url: string;
    image: string;
    duration: number;
    user: {
      id: number;
      name: string;
      url: string;
    };
    video_files: Array<{
      id: number;
      quality: string;
      file_type: string;
      width: number | null;
      height: number | null;
      link: string;
    }>;
    video_pictures: Array<{
      id: number;
      picture: string;
      nr: number;
    }>;
  }>;
}

/**
 * Obtiene videos de la API de Pexels y los guarda en la base de datos.
 * Si se proporciona 'query', busca por ese término.
 * Si no se proporciona 'query', trae los videos populares.
 * 
 * @async
 * @param {Request} req - Request de Express con query opcional para búsqueda
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/fetch?query=nature&page=1&per_page=15 (buscar por término)
 * GET /api/videos/fetch?page=1&per_page=15 (videos populares)
 */
export const fetchVideosFromPexels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, page = '1', per_page = '15' } = req.query;
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'API Key de Pexels no configurada' });
      return;
    }

    // Si hay query, usar el endpoint de búsqueda; si no, usar el de populares
    let url: string;
    if (query && query !== '') {
      url = `https://api.pexels.com/videos/search?query=${query}&page=${page}&per_page=${per_page}`;
    } else {
      url = `https://api.pexels.com/videos/popular?page=${page}&per_page=${per_page}`;
    }

    // Hacer request a la API de Pexels
    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey
      }
    });

    if (!response.ok) {
      res.status(response.status).json({ 
        error: 'Error al obtener videos de Pexels',
        status: response.status
      });
      return;
    }

    const data = await response.json() as PexelsVideoResponse;

    // Guardar videos en la base de datos (o actualizar si ya existen)
    const savedVideos = [];
    for (const video of data.videos) {
      const existingVideo = await Video.findOne({ pexelsId: video.id });
      
      if (existingVideo) {
        savedVideos.push(existingVideo);
      } else {
        const newVideo = new Video({
          pexelsId: video.id,
          width: video.width,
          height: video.height,
          url: video.url,
          image: video.image,
          duration: video.duration,
          user: video.user,
          video_files: video.video_files,
          video_pictures: video.video_pictures,
          likesCount: 0
        });
        
        const saved = await newVideo.save();
        savedVideos.push(saved);
      }
    }

    res.json({
      message: query 
        ? `Videos de búsqueda "${query}" obtenidos y guardados exitosamente`
        : 'Videos populares obtenidos y guardados exitosamente',
      page: data.page,
      per_page: data.per_page,
      total_results: data.total_results,
      videos: savedVideos,
      totalSaved: savedVideos.length
    });
  } catch (error: any) {
    console.error('Error obteniendo videos de Pexels:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene todos los videos almacenados en la base de datos.
 * 
 * @async
 * @param {Request} req - Request de Express con paginación opcional
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos?page=1&limit=20
 */
export const getAllVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments();

    res.json({
      videos,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalVideos: total
    });
  } catch (error: any) {
    console.error('Error obteniendo videos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene un video específico por su ID de MongoDB.
 * 
 * @async
 * @param {Request} req - Request de Express con id en params
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/:id
 */
export const getVideoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    res.json({ video });
  } catch (error: any) {
    console.error('Error obteniendo video:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Da o quita like a un video.
 * Actualiza el contador de likes del video y la lista de videos liked del usuario.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express con videoId en params
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/videos/:videoId/like
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar si el usuario ya dio like al video
    const alreadyLiked = user.moviesLiked.some(
      (id) => id.toString() === videoId
    );

    if (alreadyLiked) {
      // Quitar like
      user.moviesLiked = user.moviesLiked.filter(
        (id) => id.toString() !== videoId
      );
      video.likesCount = Math.max(0, video.likesCount - 1);
      
      await user.save();
      await video.save();

      res.json({
        message: 'Like removido',
        liked: false,
        likesCount: video.likesCount
      });
    } else {
      // Agregar like
      user.moviesLiked.push(video._id as any);
      video.likesCount += 1;
      
      await user.save();
      await video.save();

      res.json({
        message: 'Like agregado',
        liked: true,
        likesCount: video.likesCount
      });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene los videos a los que el usuario dio like.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/liked
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const getLikedVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId).populate('moviesLiked');
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      videos: user.moviesLiked,
      total: user.moviesLiked.length
    });
  } catch (error: any) {
    console.error('Error obteniendo videos liked:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene los videos más populares (con más likes).
 * 
 * @async
 * @param {Request} req - Request de Express con limit opcional
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/popular?limit=10
 */
export const getPopularVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const videos = await Video.find()
      .sort({ likesCount: -1 })
      .limit(limit);

    res.json({
      videos,
      total: videos.length
    });
  } catch (error: any) {
    console.error('Error obteniendo videos populares:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
