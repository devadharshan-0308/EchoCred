import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../config/logger.js';
import { seedUsers } from '../seeders/userSeeder.js';

dotenv.config();

const migrateToAtlas = async () => {
  try {
    logger.info('🚀 Starting migration to MongoDB Atlas...');
    
    // Connect to Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      retryWrites: true,
      w: 'majority'
    });
    
    logger.info('✅ Connected to MongoDB Atlas');
    
    // Check if database is empty
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`📊 Found ${collections.length} collections in Atlas database`);
    
    // Seed users if database is empty
    if (collections.length === 0) {
      logger.info('🌱 Database is empty, seeding with initial data...');
      const seedResult = await seedUsers();
      
      if (seedResult.success) {
        logger.info(`✅ Successfully seeded ${seedResult.users.length} users with certificates`);
      } else {
        logger.error('❌ Failed to seed users:', seedResult.error);
      }
    } else {
      logger.info('📋 Database already contains data, skipping seeding');
    }
    
    // Verify connection and data
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    logger.info(`👥 Total users in Atlas database: ${userCount}`);
    
    logger.info('🎉 Migration to MongoDB Atlas completed successfully!');
    
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      logger.error('🔐 Authentication failed - check username/password in connection string');
    } else if (error.message.includes('network')) {
      logger.error('🌐 Network error - check internet connection and Atlas network access');
    } else if (error.message.includes('timeout')) {
      logger.error('⏰ Connection timeout - Atlas may be unreachable');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  }
};

// Run migration
migrateToAtlas();
