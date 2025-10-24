/**
 * @fileoverview Main entry point of the Express application.
 * Configures middleware, routes and database connection.
 * @module index
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import videoRoutes from './routes/videos';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * List of allowed origins for CORS.
 * Includes localhost for development and frontend URL for production.
 * @type {string[]}
 */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://klipz.vercel.app',
  process.env.FRONTEND_URL || 'https://pi-mini-proyecto2-frontend.vercel.app'
].filter(Boolean); // Filter undefined values

/**
 * CORS configuration to allow requests from specific origins.
 * Includes origin validation and configuration of allowed methods and headers.
 */
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The origin ${origin} is not allowed by CORS to access this resource.`;
      console.error(msg);
      console.log('Allowed origins:', allowedOrigins);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/** Middleware to parse JSON in request body */
app.use(express.json());
/** Middleware to parse URL-encoded form data */
app.use(express.urlencoded({ extended: true }));

/**
 * Root route that displays basic API information.
 * @route GET /
 * @returns {Object} API information and available endpoints
 */
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ 
    message: 'API working correctly',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      videos: '/api/videos'
    }
  });
});

/** Authentication routes */
app.use('/api/auth', authRoutes);
/** User routes */
app.use('/api/users', userRoutes);
/** Video routes */
app.use('/api/videos', videoRoutes);

/**
 * Middleware to handle 404 - Not Found routes.
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'Route not found'
  });
});

/**
 * Global error handling middleware.
 * Catches and handles all uncaught errors in the application.
 * 
 * @param {any} error - Caught error
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

/**
 * Async function that starts the Express server.
 * Connects to the database before starting the server.
 * 
 * @async
 * @function startServer
 * @throws {Error} If database connection or server start fails
 */
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS configured for:`, allowedOrigins);
      console.log(`Email configured: ${process.env.EMAIL_USER ? 'YES' : 'NO'}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();