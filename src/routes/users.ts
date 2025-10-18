/**
 * @fileoverview Rutas para operaciones CRUD de usuarios.
 * @module routes/users
 */

import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
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