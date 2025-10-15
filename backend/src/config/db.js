import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased for cloud
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    logger.info(`MongoDB Atlas Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB Atlas connection failed:', error.message);
    console.error('Full error:', error);
    logger.error('MongoDB Atlas connection failed:', error.message);
    
    // Specific error handling for Atlas
    if (error.message.includes('authentication failed')) {
      logger.error('Authentication failed - check username/password in connection string');
    } else if (error.message.includes('network')) {
      logger.error('Network error - check internet connection and Atlas network access');
    } else if (error.message.includes('timeout')) {
      logger.error('Connection timeout - Atlas may be unreachable');
    }
    
    throw error; // Re-throw to be caught by server initialization
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error during database disconnection:', error);
    process.exit(1);
  }
});

export default connectDB;
