import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const roleBasedUsers = [
  // EMPLOYER ACCOUNTS
  {
    email: 'hr.manager@techcorp.com',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'employer',
    employerProfile: {
      companyName: 'TechCorp Solutions',
      industry: 'Information Technology',
      companySize: '201-1000',
      hrId: 'HR2024001'
    }
  },
  {
    email: 'recruiter@innovate.com',
    password: 'password123',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'employer',
    employerProfile: {
      companyName: 'Innovate Industries',
      industry: 'Manufacturing',
      companySize: '1000+',
      hrId: 'HR2024002'
    }
  },
  // ISSUER ACCOUNTS
  {
    email: 'admin@futureskills.gov.in',
    password: 'password123',
    firstName: 'Dr. Priya',
    lastName: 'Sharma',
    role: 'issuer',
    issuerProfile: {
      organizationName: 'FutureSkills Prime',
      organizationType: 'government',
      accreditation: ['NCVET_VERIFIED', 'GOVERNMENT_AUTHORITY'],
      verificationStatus: 'verified'
    }
  },
  {
    email: 'certify@aicte.ac.in',
    password: 'password123',
    firstName: 'Prof. Rajesh',
    lastName: 'Kumar',
    role: 'issuer',
    issuerProfile: {
      organizationName: 'All India Council for Technical Education',
      organizationType: 'government',
      accreditation: ['NCVET_VERIFIED', 'AICTE_AUTHORITY'],
      verificationStatus: 'verified'
    }
  }
];

const addRoleBasedUsers = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const userData of roleBasedUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        
        // Create user
        const user = new User({
          ...userData,
          password: hashedPassword,
          isActive: true
        });
        
        await user.save();
        console.log(`✅ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email}`);
      }
    }

    console.log('🎉 All role-based users added successfully!');
    console.log('\n📋 Available Accounts:');
    console.log('EMPLOYERS:');
    console.log('  - hr.manager@techcorp.com / password123');
    console.log('  - recruiter@innovate.com / password123');
    console.log('ISSUERS:');
    console.log('  - admin@futureskills.gov.in / password123');
    console.log('  - certify@aicte.ac.in / password123');
    console.log('LEARNERS:');
    console.log('  - alice.johnson@example.com / password123');
    console.log('  - bob.smith@example.com / password123');
    console.log('  - diana.patel@example.com / password123');

  } catch (error) {
    console.error('❌ Error adding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

addRoleBasedUsers();
