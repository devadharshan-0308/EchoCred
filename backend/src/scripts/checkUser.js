import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAndCreateUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    const email = 'john.learner@example.com';
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log(`✅ User ${email} already exists:`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
    } else {
      console.log(`❌ User ${email} does not exist. Creating...`);
      
      // Create the user
      user = new User({
        firstName: 'John',
        lastName: 'Learner',
        email: email,
        password: 'password123',
        role: 'learner',
        isActive: true
      });
      
      await user.save();
      console.log(`✅ User ${email} created successfully!`);
    }
    
    // Test login
    console.log('\n🔍 Testing login...');
    const foundUser = await User.findByCredentials(email, 'password123');
    console.log(`✅ Login test successful for ${foundUser.email}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
};

checkAndCreateUser();
