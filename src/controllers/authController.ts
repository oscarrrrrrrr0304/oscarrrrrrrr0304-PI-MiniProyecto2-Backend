/**
 * @fileoverview Controlador de autenticación que maneja registro, login, perfil y recuperación de contraseña.
 * @module controllers/authController
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../config/email';

/**
 * Registra un nuevo usuario en el sistema.
 * Valida que el email no esté ya registrado, crea el usuario y genera un token JWT.
 * 
 * @async
 * @param {Request} req - Request de Express con name, email, password y age en el body
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/auth/register
 * Body: { "name": "Juan", "email": "juan@ejemplo.com", "password": "123456", "age": 25 }
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, age } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'El usuario ya existe con este email' });
      return;
    }

    const user = new User({
      name,
      email,
      password,
      age
    });

    await user.save();

    const jwtSecret = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Inicia sesión de un usuario existente.
 * Verifica las credenciales y genera un token JWT válido por 7 días.
 * 
 * @async
 * @param {Request} req - Request de Express con email y password en el body
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/auth/login
 * Body: { "email": "juan@ejemplo.com", "password": "123456" }
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Solicita el reseteo de contraseña para un usuario.
 * Genera un token de reseteo, lo guarda en la base de datos y envía un email al usuario.
 * El token expira en 1 hora.
 * 
 * @async
 * @param {Request} req - Request de Express con email en el body
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/auth/forgot-password
 * Body: { "email": "juan@ejemplo.com" }
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'El email es requerido' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Por seguridad, no revelar si el usuario existe o no
      res.json({ message: 'Si el email existe, recibirás un correo con instrucciones' });
      return;
    }

    // Generar token de reseteo
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Guardar token hasheado y fecha de expiración (1 hora)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save();

    // Enviar email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.json({ message: 'Si el email existe, recibirás un correo con instrucciones' });
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
      
      // En desarrollo: mostrar el token en consola si el email falla
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n TOKEN DE RESETEO (solo en desarrollo):');
        console.log('Token:', resetToken);
        console.log('Email:', user.email);
        console.log(`URL completa: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}\n`);
      }
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      res.status(500).json({ 
        error: 'Error al enviar el correo electrónico',
        message: 'Por favor, configura las credenciales de email en el archivo .env'
      });
    }
  } catch (error: any) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Resetea la contraseña de un usuario utilizando un token válido.
 * Valida el token, actualiza la contraseña y genera un nuevo token JWT para login automático.
 * 
 * @async
 * @param {Request} req - Request de Express con token y newPassword en el body
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * POST /api/auth/reset-password
 * Body: { "token": "abc123token", "newPassword": "nuevaPassword123" }
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    // Hashear el token para compararlo con el guardado en la base de datos
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ error: 'Token inválido o expirado' });
      return;
    }

    // Actualizar contraseña
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generar nuevo token JWT para login automático
    const jwtSecret = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
    const jwtToken = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });

    res.json({
      message: 'Contraseña actualizada exitosamente',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age
      }
    });
  } catch (error: any) {
    console.error('Error en reset password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene el perfil del usuario autenticado.
 * Requiere un token JWT válido en el header Authorization.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express con usuario autenticado
 * @param {Response} res - Response de Express
 * @returns {Promise<void>}
 * 
 * @example
 * GET /api/auth/profile
 * Headers: { "Authorization": "Bearer <token>" }
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};