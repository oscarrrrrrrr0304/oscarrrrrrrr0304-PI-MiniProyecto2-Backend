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