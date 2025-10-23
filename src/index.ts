/**
 * @fileoverview Punto de entrada principal de la aplicación Express.
 * Configura middleware, rutas y conexión a la base de datos.
 * @module index
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Lista de orígenes permitidos para CORS.
 * Incluye localhost para desarrollo y la URL del frontend para producción.
 * @type {string[]}
 */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://klipz.vercel.app',
  process.env.FRONTEND_URL || 'https://pi-mini-proyecto2-frontend.vercel.app'
].filter(Boolean); // Filtrar valores undefined

/**
 * Configuración de CORS para permitir requests desde orígenes específicos.
 * Incluye validación de origen y configuración de métodos y headers permitidos.
 */
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `El origen ${origin} del CORS no está permitido para acceder a este recurso.`;
      console.error(msg);
      console.log('Orígenes permitidos:', allowedOrigins);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/** Middleware para parsear JSON en el body de las peticiones */
app.use(express.json());
/** Middleware para parsear datos de formularios URL-encoded */
app.use(express.urlencoded({ extended: true }));

/**
 * Ruta raíz que muestra información básica de la API.
 * @route GET /
 * @returns {Object} Información de la API y endpoints disponibles
 */
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ 
    message: 'API funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

/** Rutas de autenticación */
app.use('/api/auth', authRoutes);
/** Rutas de usuarios */
app.use('/api/users', userRoutes);

/**
 * Middleware para manejar rutas no encontradas (404).
 * @param {express.Request} req - Request de Express
 * @param {express.Response} res - Response de Express
 */
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada'
  });
});

/**
 * Middleware global de manejo de errores.
 * Captura y maneja todos los errores no capturados en la aplicación.
 * 
 * @param {any} error - Error capturado
 * @param {express.Request} req - Request de Express
 * @param {express.Response} res - Response de Express
 * @param {express.NextFunction} next - NextFunction de Express
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

/**
 * Función asíncrona que inicia el servidor Express.
 * Conecta a la base de datos antes de iniciar el servidor.
 * 
 * @async
 * @function startServer
 * @throws {Error} Si falla la conexión a la base de datos o al iniciar el servidor
 */
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS configurado para:`, allowedOrigins);
      console.log(`Email configurado: ${process.env.EMAIL_USER ? 'SÍ' : 'NO'}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();