import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { seedUsers } from '../seeders/userSeeder.js';
import logger from '../config/logger.js';

dotenv.config();

const runSeeder = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database for seeding');

    // Run user seeder
    const result = await seedUsers();
    
    if (result.success) {
      logger.info('✅ User seeding completed successfully');
      console.log('✅ Users seeded:', result.users);
    } else {
      logger.error('❌ User seeding failed:', result.error);
      console.error('❌ Seeding failed:', result.error);
    }

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeder execution failed:', error);
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

runSeeder();
