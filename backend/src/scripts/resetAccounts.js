import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const resetAllAccounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Reset all user accounts - remove locks and reset attempts
    const result = await User.updateMany(
      {},
      {
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { isActive: true }
      }
    );
    
    console.log(`✅ Reset ${result.modifiedCount} user accounts`);
    console.log('All accounts unlocked and login attempts reset');
    
    // Show all users
    const users = await User.find({}, 'email firstName lastName role').limit(10);
    console.log('\n📋 Sample users (use password: password123):');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Done! All accounts are now accessible.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

resetAllAccounts();
