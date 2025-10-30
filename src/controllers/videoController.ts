/**
 * @fileoverview Video controller that handles operations with Pexels API and likes.
 * @module controllers/videoController
 */

import { Request, Response } from 'express';
import { Video } from '../models/Video';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Interface for Pexels API response.
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
    tags: string[];
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
 * Fetches videos from Pexels API and saves them to database.
 * If 'query' is provided, searches by that term.
 * If no 'query' is provided, fetches popular videos.
 * 
 * @async
 * @param {Request} req - Express request with optional query for search
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/fetch?query=nature&page=1&per_page=15 (search by term)
 * GET /api/videos/fetch?page=1&per_page=15 (popular videos)
 */
export const fetchVideosFromPexels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, page = '1', per_page = '15' } = req.query;
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'API Key de Pexels no configurada' });
      return;
    }

    // If there's a query, use search endpoint; otherwise, use popular endpoint
    let url: string;
    if (query && query !== '') {
      url = `https://api.pexels.com/videos/search?query=${query}&page=${page}&per_page=${per_page}`;
    } else {
      url = `https://api.pexels.com/videos/popular?page=${page}&per_page=${per_page}`;
    }

    // Make request to Pexels API
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

    // Save videos to database (or update if they already exist)
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
          tags: video.tags || [],
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
 * Gets all videos stored in the database.
 * 
 * @async
 * @param {Request} req - Express request with optional pagination
 * @param {Response} res - Express response
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
 * Gets a specific video by its MongoDB ID.
 * 
 * @async
 * @param {Request} req - Express request with id in params
 * @param {Response} res - Express response
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
 * Toggles like on a video (add or remove).
 * Updates video's like counter and user's liked videos list.
 * 
 * @async
 * @param {AuthRequest} req - Express request with videoId in params
 * @param {Response} res - Express response
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

    // Check if user already liked the video
    const alreadyLiked = user.moviesLiked.some(
      (id) => id.toString() === videoId
    );

    if (alreadyLiked) {
      // Remove like
      user.moviesLiked = user.moviesLiked.filter(
        (id) => id.toString() !== videoId
      );
      video.likesCount = Math.max(0, video.likesCount - 1);
      
      await user.save();
      await video.save();

      res.json({
        message: 'Like removed',
        liked: false,
        likesCount: video.likesCount
      });
    } else {
      // Add like
      user.moviesLiked.push(video._id as any);
      video.likesCount += 1;
      
      await user.save();
      await video.save();

      res.json({
        message: 'Like added',
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
 * Gets videos that the user has liked.
 * 
 * @async
 * @param {AuthRequest} req - Express request
 * @param {Response} res - Express response
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
 * Gets the most popular videos (with most likes).
 * 
 * @async
 * @param {Request} req - Express request with optional limit
 * @param {Response} res - Express response
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

/**
 * Adds or updates a rating for a video.
 * If the user already rated the video, updates the existing rating.
 * 
 * @async
 * @param {AuthRequest} req - Express request with videoId in params and rating in body
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/videos/:videoId/rating
 * Headers: { "Authorization": "Bearer <token>" }
 * Body: { "rating": 5 }
 */
export const addOrUpdateRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { rating } = req.body;
    const userId = req.user?._id;

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'La calificación debe ser un número entre 1 y 5' });
      return;
    }

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    // Check if user already rated this video
    const existingRatingIndex = video.ratings.findIndex(
      (r) => r.userId.toString() === userId?.toString()
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      video.ratings[existingRatingIndex].rating = rating;
      video.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      video.ratings.push({
        userId: userId as any,
        rating,
        createdAt: new Date()
      });
    }

    // Calculate average rating
    const totalRatings = video.ratings.reduce((sum, r) => sum + r.rating, 0);
    video.averageRating = totalRatings / video.ratings.length;

    await video.save();

    res.json({
      message: existingRatingIndex !== -1 ? 'Calificación actualizada' : 'Calificación agregada',
      averageRating: video.averageRating,
      totalRatings: video.ratings.length,
      userRating: rating
    });
  } catch (error: any) {
    console.error('Error agregando/actualizando calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Gets user's rating for a specific video.
 * 
 * @async
 * @param {AuthRequest} req - Express request with videoId in params
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/:videoId/rating
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const getUserRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    const userRating = video.ratings.find(
      (r) => r.userId.toString() === userId?.toString()
    );

    res.json({
      userRating: userRating ? userRating.rating : null,
      averageRating: video.averageRating,
      totalRatings: video.ratings.length
    });
  } catch (error: any) {
    console.error('Error obteniendo calificación del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Deletes user's rating for a specific video.
 * 
 * @async
 * @param {AuthRequest} req - Express request with videoId in params
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * DELETE /api/videos/:videoId/rating
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const deleteRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    const ratingIndex = video.ratings.findIndex(
      (r) => r.userId.toString() === userId?.toString()
    );

    if (ratingIndex === -1) {
      res.status(404).json({ error: 'No has calificado este video' });
      return;
    }

    // Remove rating
    video.ratings.splice(ratingIndex, 1);

    // Recalculate average rating
    if (video.ratings.length > 0) {
      const totalRatings = video.ratings.reduce((sum, r) => sum + r.rating, 0);
      video.averageRating = totalRatings / video.ratings.length;
    } else {
      video.averageRating = 0;
    }

    await video.save();

    res.json({
      message: 'Calificación eliminada exitosamente',
      averageRating: video.averageRating,
      totalRatings: video.ratings.length
    });
  } catch (error: any) {
    console.error('Error eliminando calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Adds a comment to a video.
 * 
 * @async
 * @param {AuthRequest} req - Express request with videoId in params and text in body
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/videos/:videoId/comments
 * Headers: { "Authorization": "Bearer <token>" }
 * Body: { "text": "Great video!" }
 */
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { text } = req.body;
    const userId = req.user?._id;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: 'El texto del comentario es requerido' });
      return;
    }

    if (text.length > 1000) {
      res.status(400).json({ error: 'El comentario no puede exceder 1000 caracteres' });
      return;
    }

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

    // Add comment
    const newComment = {
      userId: userId as any,
      userName: user.name,
      text: text.trim(),
      createdAt: new Date()
    };

    video.comments.push(newComment as any);
    await video.save();

    res.status(201).json({
      message: 'Comentario agregado exitosamente',
      comment: newComment,
      totalComments: video.comments.length
    });
  } catch (error: any) {
    console.error('Error agregando comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Gets all comments for a video.
 * 
 * @async
 * @param {Request} req - Express request with videoId in params
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/:videoId/comments
 */
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    // Sort comments by date (newest first)
    const sortedComments = video.comments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate comments
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = sortedComments.slice(startIndex, endIndex);

    res.json({
      comments: paginatedComments,
      currentPage: page,
      totalPages: Math.ceil(video.comments.length / limit),
      totalComments: video.comments.length
    });
  } catch (error: any) {
    console.error('Error obteniendo comentarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Edits a comment from a video.
 * Only the comment author can edit their own comment.
 * 
 * @async
 * @param {AuthRequest} req - Express request with videoId and commentId in params, and text in body
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * PUT /api/videos/:videoId/comments/:commentId
 * Headers: { "Authorization": "Bearer <token>" }
 * Body: { "text": "Updated comment text" }
 */
export const editComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user?._id;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: 'El texto del comentario es requerido' });
      return;
    }

    if (text.length > 1000) {
      res.status(400).json({ error: 'El comentario no puede exceder 1000 caracteres' });
      return;
    }

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    const commentIndex = video.comments.findIndex(
      (c: any) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      res.status(404).json({ error: 'Comentario no encontrado' });
      return;
    }

    // Check if user is the comment author
    if (video.comments[commentIndex].userId.toString() !== userId?.toString()) {
      res.status(403).json({ error: 'No tienes permiso para editar este comentario' });
      return;
    }

    // Update comment text
    video.comments[commentIndex].text = text.trim();
    await video.save();

    res.json({
      message: 'Comentario editado exitosamente',
      comment: video.comments[commentIndex],
      totalComments: video.comments.length
    });
  } catch (error: any) {
    console.error('Error editando comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Deletes a comment from a video.
 * Only the comment author can delete their own comment.
 * 
 * @async
 * @param {AuthRequest} req - Express request with videoId and commentId in params
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * DELETE /api/videos/:videoId/comments/:commentId
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId, commentId } = req.params;
    const userId = req.user?._id;

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    const commentIndex = video.comments.findIndex(
      (c: any) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      res.status(404).json({ error: 'Comentario no encontrado' });
      return;
    }

    // Check if user is the comment author
    if (video.comments[commentIndex].userId.toString() !== userId?.toString()) {
      res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
      return;
    }

    video.comments.splice(commentIndex, 1);
    await video.save();

    res.json({
      message: 'Comentario eliminado exitosamente',
      totalComments: video.comments.length
    });
  } catch (error: any) {
    console.error('Error eliminando comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Gets rating statistics for a video.
 * Returns the average rating, total ratings, and rating distribution (1-5 stars).
 * 
 * @async
 * @param {Request} req - Express request with videoId in params
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/videos/:videoId/rating/stats
 */
export const getRatingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video no encontrado' });
      return;
    }

    // Calculate rating distribution (how many 1-star, 2-star, etc.)
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    video.ratings.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    // Calculate percentage for each rating
    const totalRatings = video.ratings.length;
    const distributionPercentage = {
      1: totalRatings > 0 ? ((distribution[1] / totalRatings) * 100).toFixed(1) : '0.0',
      2: totalRatings > 0 ? ((distribution[2] / totalRatings) * 100).toFixed(1) : '0.0',
      3: totalRatings > 0 ? ((distribution[3] / totalRatings) * 100).toFixed(1) : '0.0',
      4: totalRatings > 0 ? ((distribution[4] / totalRatings) * 100).toFixed(1) : '0.0',
      5: totalRatings > 0 ? ((distribution[5] / totalRatings) * 100).toFixed(1) : '0.0'
    };

    res.json({
      averageRating: video.averageRating,
      totalRatings: totalRatings,
      distribution: distribution,
      distributionPercentage: distributionPercentage
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de calificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
