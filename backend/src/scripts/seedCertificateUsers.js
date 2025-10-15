import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';

dotenv.config();

const seedCertificateUsers = async () => {
  try {
    await connectDB();
    logger.info('Connected to database for certificate user seeding');

    // Get all certificate users
    const allCertificates = skillVaultApiIntegration.getAllCertificates();
    const userEmails = [...new Set(allCertificates.map(cert => cert.learner_email))];
    
    console.log(`Found ${userEmails.length} users with certificates`);

    // Create user accounts for the top certificate holders
    const topUsers = [
      {
        email: 'alice.johnson@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        password: 'password123',
        role: 'learner'
      },
      {
        email: 'bob.smith@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        password: 'password123',
        role: 'learner'
      },
      {
        email: 'charlie.lee@example.com',
        firstName: 'Charlie',
        lastName: 'Lee',
        password: 'password123',
        role: 'learner'
      },
      {
        email: 'diana.patel@example.com',
        firstName: 'Diana',
        lastName: 'Patel',
        password: 'password123',
        role: 'learner'
      },
      {
        email: 'ethan.brown@example.com',
        firstName: 'Ethan',
        lastName: 'Brown',
        password: 'password123',
        role: 'learner'
      },
      {
        email: 'fiona.williams@example.com',
        firstName: 'Fiona',
        lastName: 'Williams',
        password: 'password123',
        role: 'learner'
      }
    ];

    let created = 0;
    let existing = 0;

    for (const userData of topUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = new User({
          ...userData,
          isActive: true,
          learnerProfile: {
            institution: 'Digital Skills University',
            studentId: `DSU${Date.now().toString().slice(-6)}`
          }
        });
        
        await user.save();
        
        // Get certificate count for this user
        const userCerts = allCertificates.filter(cert => cert.learner_email === userData.email);
        
        console.log(`✅ Created: ${userData.email} (${userCerts.length} certificates)`);
        created++;
      } else {
        const userCerts = allCertificates.filter(cert => cert.learner_email === userData.email);
        console.log(`ℹ️  Exists: ${userData.email} (${userCerts.length} certificates)`);
        existing++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} users`);
    console.log(`   Existing: ${existing} users`);
    console.log(`   Total certificate users available: ${userEmails.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding certificate users:', error);
    process.exit(1);
  }
};

seedCertificateUsers();
