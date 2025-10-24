/**
 * @fileoverview Routes for user CRUD operations.
 * @module routes/users
 */

import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  addFavorite,
  removeFavorite,
  getFavorites
} from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * Ruta para obtener todos los usuarios.
 * @route GET /api/users
 * @access Protegida - Requiere token JWT
 * @returns {Object} Lista de usuarios
 */
router.get('/', auth, getAllUsers);

/**
 * Ruta para obtener los videos favoritos del usuario autenticado.
 * @route GET /api/users/favorites
 * @access Protegida - Requiere token JWT
 * @returns {Object} Lista de IDs de videos favoritos
 */
router.get('/favorites', auth, getFavorites);

/**
 * Ruta para agregar un video a favoritos.
 * @route POST /api/users/favorites
 * @access Protegida - Requiere token JWT
 * @param {string} videoId - ID del video a agregar
 * @returns {Object} Lista actualizada de favoritos
 */
router.post('/favorites', auth, addFavorite);

/**
 * Ruta para eliminar un video de favoritos.
 * @route DELETE /api/users/favorites/:videoId
 * @access Protegida - Requiere token JWT
 * @param {string} videoId - ID del video a eliminar
 * @returns {Object} Lista actualizada de favoritos
 */
router.delete('/favorites/:videoId', auth, removeFavorite);

/**
 * Ruta para obtener un usuario por ID.
 * @route GET /api/users/:id
 * @access Protegida - Requiere token JWT
 * @param {string} id - ID del usuario
 * @returns {Object} Datos del usuario
 */
router.get('/:id', auth, getUserById);

/**
 * Ruta para actualizar un usuario.
 * @route PUT /api/users/:id
 * @access Protegida - Requiere token JWT
 * @param {string} id - ID del usuario
 * @param {string} name - Nuevo nombre (opcional)
 * @param {string} email - Nuevo email (opcional)
 * @param {number} age - Nueva edad (opcional)
 * @returns {Object} Datos del usuario actualizado
 */
router.put('/:id', auth, updateUser);

/**
 * Ruta para eliminar un usuario.
 * @route DELETE /api/users/:id
 * @access Protegida - Requiere token JWT
 * @param {string} id - ID del usuario
 * @returns {Object} Mensaje de confirmación
 */
router.delete('/:id', auth, deleteUser);

export default router;