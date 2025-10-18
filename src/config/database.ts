/**
 * @fileoverview Configuración de la conexión a la base de datos MongoDB.
 * @module config/database
 */

import mongoose from 'mongoose';

/**
 * Establece la conexión con la base de datos MongoDB.
 * Utiliza la URI definida en la variable de entorno MONGODB_URI.
 * 
 * @async
 * @returns {Promise<void>} Promesa que se resuelve cuando la conexión es exitosa
 * @throws {Error} Si MONGODB_URI no está definido o si falla la conexión
 * 
 * @example
 * await connectDB();
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definido en las variables de entorno');
    }

    await mongoose.connect(mongoUri);
    console.log('Base de datos conectada exitosamente');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

export default connectDB;