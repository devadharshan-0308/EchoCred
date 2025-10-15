import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const testAllLogins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Get all users
    const users = await User.find({}, 'firstName lastName email role isActive').sort({ email: 1 });
    
    console.log(`\n🔍 TESTING LOGIN FOR ALL ${users.length} USERS...\n`);
    console.log('=' .repeat(80));
    console.log('EMAIL'.padEnd(35) + 'STATUS'.padEnd(15) + 'RESPONSE');
    console.log('=' .repeat(80));
    
    let successCount = 0;
    let failCount = 0;
    
    for (const user of users) {
      try {
        // Test login via API
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: user.email,
          password: 'password123'
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        if (response.data.success) {
          console.log(`${user.email.padEnd(35)}✅ SUCCESS`.padEnd(15) + `Token generated`);
          successCount++;
        } else {
          console.log(`${user.email.padEnd(35)}❌ FAILED`.padEnd(15) + `${response.data.message}`);
          failCount++;
        }
      } catch (error) {
        console.log(`${user.email.padEnd(35)}❌ ERROR`.padEnd(15) + `${error.response?.data?.message || error.message}`);
        failCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('=' .repeat(80));
    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Successful logins: ${successCount}`);
    console.log(`❌ Failed logins: ${failCount}`);
    console.log(`📋 Total users tested: ${users.length}`);
    
    if (successCount === users.length) {
      console.log(`\n🎉 ALL ${users.length} USERS CAN LOGIN SUCCESSFULLY!`);
      console.log(`🔑 Password for all users: password123`);
    } else {
      console.log(`\n⚠️ ${failCount} users have login issues that need to be fixed.`);
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Testing completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
};

testAllLogins();
