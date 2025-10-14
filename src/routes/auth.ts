import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

// Ruta de registro
router.post('/register', register);

// Ruta de login
router.post('/login', login);

// Ruta para obtener el perfil del usuario (requiere autenticación)
router.get('/profile', auth, getProfile);

export default router; 