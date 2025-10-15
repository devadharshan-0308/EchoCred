import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixEmployerPasswords = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employerEmails = [
      'hr.manager@techcorp.com',
      'recruiter@innovate.com',
      'admin@futureskills.gov.in',
      'certify@aicte.ac.in'
    ];

    for (const email of employerEmails) {
      const user = await User.findOne({ email });
      if (user) {
        // Set the password using the model's setter (which will hash it)
        user.password = 'password123';
        await user.save();
        console.log(`✅ Fixed password for: ${email}`);
      } else {
        console.log(`⚠️  User not found: ${email}`);
      }
    }

    console.log('\n🧪 Testing login after fix...');
    
    // Test login
    try {
      const user = await User.findByCredentials('hr.manager@techcorp.com', 'password123');
      console.log('✅ Login test successful!');
      console.log(`  - User: ${user.firstName} ${user.lastName}`);
      console.log(`  - Role: ${user.role}`);
    } catch (error) {
      console.log('❌ Login test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

fixEmployerPasswords();
