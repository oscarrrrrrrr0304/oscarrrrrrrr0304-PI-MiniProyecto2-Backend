import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

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

