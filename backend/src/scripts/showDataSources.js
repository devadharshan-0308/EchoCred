import mongoose from 'mongoose';
import User from '../models/User.js';
import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';
import dotenv from 'dotenv';

dotenv.config();

const showDataSources = async () => {
  try {
    console.log('🔍 SKILL VAULT MAX - DATA SOURCE VERIFICATION\n');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas (Cloud Database)');
    
    // Check users from MongoDB Atlas
    const users = await User.find({}).limit(5);
    console.log(`\n☁️ FROM MONGODB ATLAS CLOUD DATABASE:`);
    console.log(`   📊 Total Users: ${await User.countDocuments()}`);
    console.log(`   👤 Sample Users:`);
    users.forEach(user => {
      console.log(`      - ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    // Check certificates from local files
    console.log(`\n📁 FROM LOCAL FILES (skill-valut-api):`);
    const allCerts = skillVaultApiIntegration.getAllCertificates();
    const institutes = skillVaultApiIntegration.getAllInstitutes();
    
    console.log(`   📜 Total Certificates: ${allCerts.length}`);
    console.log(`   🏛️ Total Institutes: ${institutes.length}`);
    console.log(`   📚 Sample Certificates:`);
    allCerts.slice(0, 3).forEach(cert => {
      console.log(`      - ${cert.course_name} (${cert.issuer}) for ${cert.learner_email}`);
    });
    
    console.log(`\n🔗 HOW THEY CONNECT:`);
    console.log(`   1. User logs in → MongoDB Atlas verifies credentials`);
    console.log(`   2. User requests certificates → System reads local files`);
    console.log(`   3. Certificates are matched to user email`);
    console.log(`   4. Combined data is returned to frontend`);
    
    console.log(`\n📍 CERTIFICATE DATA LOCATION:`);
    console.log(`   Path: skill-valut-api/skill-valut-api/mocks/data/`);
    console.log(`   Files: coursera/, futureskill/, ncct/, udemy/, university/`);
    console.log(`   Type: JSON files with mock certificate data`);
    
    await mongoose.connection.close();
    console.log('\n✅ Analysis completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
};

showDataSources();
