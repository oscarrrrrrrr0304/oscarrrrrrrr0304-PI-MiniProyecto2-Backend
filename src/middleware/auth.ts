/**
 * @fileoverview Middleware de autenticación JWT para proteger rutas.
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

/**
 * Interface que extiende Request de Express para incluir información del usuario autenticado.
 * @interface AuthRequest
 * @extends {Request}
 */
export interface AuthRequest extends Request {
  /** Usuario autenticado obtenido del token JWT */
  user?: IUser;
}

/**
 * Middleware de autenticación que verifica el token JWT en el header Authorization.
 * Si el token es válido, adjunta el usuario al objeto request.
 * 
 * @async
 * @param {AuthRequest} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función next de Express
 * @returns {Promise<void>}
 * 
 * @example
 * router.get('/protected', auth, protectedController);
 */
export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({ error: 'Token inválido.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

