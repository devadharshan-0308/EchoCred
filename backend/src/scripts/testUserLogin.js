import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const testUserLogin = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testEmail = 'hr.manager@techcorp.com';
    const testPassword = 'password123';

    console.log(`\n🔍 Testing login for: ${testEmail}`);

    // First, check if user exists
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found in database');
    console.log('📋 User details:');
    console.log(`  - Name: ${user.firstName} ${user.lastName}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Active: ${user.isActive}`);
    console.log(`  - Locked: ${user.isLocked || false}`);

    // Test password comparison
    try {
      const user = await User.findByCredentials(testEmail, testPassword);
      console.log('✅ Login successful!');
      console.log(`  - User ID: ${user._id}`);
      console.log(`  - Role: ${user.role}`);
    } catch (error) {
      console.log('❌ Login failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

testUserLogin();
