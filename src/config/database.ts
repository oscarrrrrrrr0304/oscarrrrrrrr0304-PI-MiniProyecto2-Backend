import mongoose from 'mongoose';

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