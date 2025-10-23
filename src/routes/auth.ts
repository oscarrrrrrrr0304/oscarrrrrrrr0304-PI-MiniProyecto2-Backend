/**
 * @fileoverview Rutas de autenticación para registro, login, perfil y recuperación de contraseña.
 * @module routes/auth
 */

import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  forgotPassword, 
  resetPassword,
  changePassword
} from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * Ruta para registrar un nuevo usuario.
 * @route POST /api/auth/register
 * @param {string} name - Nombre del usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @param {number} age - Edad del usuario
 * @returns {Object} Token JWT y datos del usuario
 */
router.post('/register', register);

/**
 * Ruta para iniciar sesión.
 * @route POST /api/auth/login
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Token JWT y datos del usuario
 */
router.post('/login', login);

/**
 * Ruta para obtener el perfil del usuario autenticado.
 * @route GET /api/auth/profile
 * @access Protegida - Requiere token JWT
 * @returns {Object} Datos del usuario
 */
router.get('/profile', auth, getProfile);

/**
 * Ruta para cambiar la contraseña del usuario autenticado desde el perfil.
 * @route POST /api/auth/change-password
 * @access Protegida - Requiere token JWT
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Object} Mensaje de confirmación
 */
router.post('/change-password', auth, changePassword);

/**
 * Ruta para solicitar el reseteo de contraseña.
 * @route POST /api/auth/forgot-password
 * @param {string} email - Email del usuario
 * @returns {Object} Mensaje de confirmación
 */
router.post('/forgot-password', forgotPassword);

/**
 * Ruta para resetear la contraseña usando un token.
 * @route POST /api/auth/reset-password
 * @param {string} token - Token de reseteo
 * @param {string} newPassword - Nueva contraseña
 * @returns {Object} Token JWT y datos del usuario
 */
router.post('/reset-password', resetPassword);

export default router; 