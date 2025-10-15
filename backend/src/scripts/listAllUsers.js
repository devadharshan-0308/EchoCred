import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const listAllUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Get all users
    const users = await User.find({}, 'firstName lastName email role isActive').sort({ email: 1 });
    
    console.log(`\n📋 FOUND ${users.length} USERS IN DATABASE:\n`);
    console.log('=' .repeat(80));
    console.log('EMAIL'.padEnd(35) + 'NAME'.padEnd(25) + 'ROLE'.padEnd(12) + 'ACTIVE');
    console.log('=' .repeat(80));
    
    users.forEach((user, index) => {
      const email = user.email.padEnd(35);
      const name = `${user.firstName} ${user.lastName}`.padEnd(25);
      const role = user.role.padEnd(12);
      const active = user.isActive ? '✅' : '❌';
      
      console.log(`${email}${name}${role}${active}`);
    });
    
    console.log('=' .repeat(80));
    console.log(`\n🔑 DEFAULT PASSWORD FOR ALL TEST USERS: password123`);
    console.log(`\n💡 YOU CAN LOGIN WITH ANY OF THESE EMAILS!`);
    
    // Show some examples
    console.log(`\n📝 EXAMPLE LOGINS:`);
    const examples = users.slice(0, 5);
    examples.forEach(user => {
      console.log(`   ${user.email} / password123 (${user.role})`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
};

listAllUsers();
