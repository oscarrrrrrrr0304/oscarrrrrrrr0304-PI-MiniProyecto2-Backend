/**
 * @fileoverview Routes for operations with Pexels videos.
 * @module routes/videos
 */

import { Router } from 'express';
import {
  fetchVideosFromPexels,
  getAllVideos,
  getVideoById,
  toggleLike,
  getLikedVideos,
  getPopularVideos,
  addOrUpdateRating,
  getUserRating,
  addComment,
  getComments,
  deleteComment
} from '../controllers/videoController';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * Ruta para obtener videos de Pexels y guardarlos en la BD.
 * @route GET /api/videos/fetch
 * @param {string} query - Término de búsqueda (opcional, default: 'nature')
 * @param {number} page - Número de página (opcional, default: 1)
 * @param {number} per_page - Videos por página (opcional, default: 15)
 * @returns {Object} Videos de Pexels guardados en la BD
 */
router.get('/fetch', fetchVideosFromPexels);

/**
 * Ruta para obtener videos con más likes.
 * @route GET /api/videos/popular
 * @param {number} limit - Cantidad de videos a retornar (opcional, default: 10)
 * @returns {Object} Videos más populares
 */
router.get('/popular', getPopularVideos);

/**
 * Ruta para obtener videos a los que el usuario dio like.
 * @route GET /api/videos/liked
 * @access Protegida - Requiere token JWT
 * @returns {Object} Videos liked por el usuario
 */
router.get('/liked', auth, getLikedVideos);

/**
 * Ruta para obtener todos los videos de la BD.
 * @route GET /api/videos
 * @param {number} page - Número de página (opcional, default: 1)
 * @param {number} limit - Videos por página (opcional, default: 20)
 * @returns {Object} Lista paginada de videos
 */
router.get('/', getAllVideos);

/**
 * Ruta para obtener un video específico por ID.
 * @route GET /api/videos/:id
 * @param {string} id - ID del video en MongoDB
 * @returns {Object} Datos del video
 */
router.get('/:id', getVideoById);

/**
 * Ruta para dar/quitar like a un video.
 * @route POST /api/videos/:videoId/like
 * @access Protegida - Requiere token JWT
 * @param {string} videoId - ID del video en MongoDB
 * @returns {Object} Estado del like y contador actualizado
 */
router.post('/:videoId/like', auth, toggleLike);

/**
 * Ruta para agregar o actualizar la calificación de un video.
 * @route POST /api/videos/:videoId/rating
 * @access Protegida - Requiere token JWT
 * @param {string} videoId - ID del video en MongoDB
 * @body {number} rating - Calificación (1-5)
 * @returns {Object} Calificación promedio actualizada
 */
router.post('/:videoId/rating', auth, addOrUpdateRating);

/**
 * Ruta para obtener la calificación del usuario para un video.
 * @route GET /api/videos/:videoId/rating
 * @access Protegida - Requiere token JWT
 * @param {string} videoId - ID del video en MongoDB
 * @returns {Object} Calificación del usuario y promedio
 */
router.get('/:videoId/rating', auth, getUserRating);

/**
 * Ruta para agregar un comentario a un video.
 * @route POST /api/videos/:videoId/comments
 * @access Protegida - Requiere token JWT
 * @param {string} videoId - ID del video en MongoDB
 * @body {string} text - Texto del comentario
 * @returns {Object} Comentario agregado
 */
router.post('/:videoId/comments', auth, addComment);

/**
 * Ruta para obtener comentarios de un video.
 * @route GET /api/videos/:videoId/comments
 * @param {string} videoId - ID del video en MongoDB
 * @param {number} page - Número de página (opcional, default: 1)
 * @param {number} limit - Comentarios por página (opcional, default: 20)
 * @returns {Object} Lista paginada de comentarios
 */
router.get('/:videoId/comments', getComments);

/**
 * Ruta para eliminar un comentario.
 * @route DELETE /api/videos/:videoId/comments/:commentId
 * @access Protegida - Requiere token JWT
 * @param {string} videoId - ID del video en MongoDB
 * @param {string} commentId - ID del comentario
 * @returns {Object} Confirmación de eliminación
 */
router.delete('/:videoId/comments/:commentId', auth, deleteComment);

export default router;
