/**
 * @fileoverview MongoDB database connection configuration.
 * @module config/database
 */

import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB database.
 * Uses the URI defined in the MONGODB_URI environment variable.
 * 
 * @async
 * @returns {Promise<void>} Promise that resolves when connection is successful
 * @throws {Error} If MONGODB_URI is not defined or if connection fails
 * 
 * @example
 * await connectDB();
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

export default connectDB;