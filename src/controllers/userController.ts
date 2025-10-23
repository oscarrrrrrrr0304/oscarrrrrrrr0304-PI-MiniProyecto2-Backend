/**
 * @fileoverview Controlador de usuarios que maneja operaciones CRUD sobre usuarios.
 * @module controllers/userController
 */

import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Obtiene todos los usuarios registrados en el sistema.
 * Excluye las contraseñas de los resultados.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express con usuario autenticado
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/users
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.json({
      message: 'Usuarios obtenidos exitosamente',
      users,
      total: users.length
    });
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene un usuario específico por su ID.
 * Excluye la contraseña del resultado.
 * 
 * @async
 * @param {Request} req - Request de Express con id en params
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/users/:id
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      message: 'Usuario obtenido exitosamente',
      user
    });
  } catch (error: any) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Actualiza los datos de un usuario.
 * Solo el propio usuario puede actualizar sus datos.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express con id en params y name, email, age en body
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * PUT /api/users/:id
 * Headers: { "Authorization": "Bearer <token>" }
 * Body: { "name": "Nuevo Nombre", "email": "nuevo@email.com", "age": 30 }
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;

    if ((req.user?._id as any).toString() !== id) {
      res.status(403).json({ error: 'No tienes permisos para actualizar este usuario' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, age },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      message: 'Usuario actualizado exitosamente',
      user
    });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Elimina un usuario del sistema.
 * Solo el propio usuario puede eliminarse a sí mismo.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express con id en params
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * DELETE /api/users/:id
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if ((req.user?._id as any).toString() !== id) {
      res.status(403).json({ error: 'No tienes permisos para eliminar este usuario' });
      return;
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Agrega un video a los favoritos del usuario.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express con videoId en body
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/users/favorites
 * Headers: { "Authorization": "Bearer <token>" }
 * Body: { "videoId": "abc123" }
 */
export const addFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.body;
    const userId = req.user?._id;

    if (!videoId) {
      res.status(400).json({ error: 'El ID del video es requerido' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar si el video ya está en favoritos
    if (user.favoriteVideos.includes(videoId)) {
      res.status(400).json({ error: 'El video ya está en favoritos' });
      return;
    }

    user.favoriteVideos.push(videoId);
    await user.save();

    res.json({
      message: 'Video agregado a favoritos',
      favoriteVideos: user.favoriteVideos
    });
  } catch (error: any) {
    console.error('Error agregando favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Elimina un video de los favoritos del usuario.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express con videoId en params
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * DELETE /api/users/favorites/:videoId
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const removeFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Filtrar el video de favoritos
    const initialLength = user.favoriteVideos.length;
    user.favoriteVideos = user.favoriteVideos.filter(id => id !== videoId);

    if (user.favoriteVideos.length === initialLength) {
      res.status(404).json({ error: 'El video no está en favoritos' });
      return;
    }

    await user.save();

    res.json({
      message: 'Video eliminado de favoritos',
      favoriteVideos: user.favoriteVideos
    });
  } catch (error: any) {
    console.error('Error eliminando favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene la lista de videos favoritos del usuario.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/users/favorites
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId).select('favoriteVideos');
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      favoriteVideos: user.favoriteVideos,
      total: user.favoriteVideos.length
    });
  } catch (error: any) {
    console.error('Error obteniendo favoritos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};