/**
 * @fileoverview JWT authentication middleware to protect routes.
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

/**
 * Interface that extends Express Request to include authenticated user information.
 * @interface AuthRequest
 * @extends {Request}
 */
export interface AuthRequest extends Request {
  /** Authenticated user obtained from JWT token */
  user?: IUser;
}

/**
 * Authentication middleware that verifies JWT token in Authorization header.
 * If token is valid, attaches the user to the request object.
 * 
 * @async
 * @param {AuthRequest} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
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

