import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { auth, adminAuth } from '../middleware/auth';

const router = Router();

// Obtener todos los usuarios (solo admin)
router.get('/', adminAuth, getAllUsers);

// Obtener usuario por ID (requiere autenticación)
router.get('/:id', auth, getUserById);

// Actualizar usuario (admin o el mismo usuario)
router.put('/:id', auth, updateUser);

// Eliminar usuario (solo admin)
router.delete('/:id', adminAuth, deleteUser);

export default router;