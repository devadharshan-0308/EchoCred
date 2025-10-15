import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixVercettiUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    const email = 'vercetti@example.com';
    
    // Find the user
    let user = await User.findOne({ email });
    
    if (user) {
      console.log(`Found user: ${user.firstName} ${user.lastName}`);
      console.log(`Current password hash: ${user.password.substring(0, 20)}...`);
      
      // Reset password to standard test password
      user.password = 'password123';
      await user.save();
      
      console.log('✅ Password reset to: password123');
      
      // Test login
      const testUser = await User.findByCredentials(email, 'password123');
      console.log(`✅ Login test successful for ${testUser.email}`);
      
    } else {
      console.log(`❌ User ${email} not found`);
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
};

fixVercettiUser();
