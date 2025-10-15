import User from '../models/User.js';
import logger from '../config/logger.js';
import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';

class AdvancedUserSeeder {
  constructor() {
    this.allCertificates = skillVaultApiIntegration.getAllCertificates();
    this.uniqueUsers = this.extractUniqueUsers();
  }

  // Extract unique users from certificate data
  extractUniqueUsers() {
    const userMap = new Map();
    
    this.allCertificates.forEach(cert => {
      const email = cert.learner_email;
      const name = cert.learner_name;
      
      if (!userMap.has(email)) {
        // Parse name
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Learner';
        
        userMap.set(email, {
          email: email,
          password: 'password123', // Standard password for all test users
          firstName: firstName,
          lastName: lastName,
          role: 'learner',
          learnerProfile: {
            institution: this.determineInstitution(cert),
            studentId: this.generateStudentId(email)
          },
          certificates: []
        });
      }
      
      // Add certificate to user
      userMap.get(email).certificates.push(cert);
    });
    
    return Array.from(userMap.values());
  }

  // Determine primary institution for user
  determineInstitution(cert) {
    const instituteMap = {
      'FUTURESKILL': 'FutureSkills Prime Academy',
      'NCCT': 'National Council for Cement and Building Materials',
      'UNIVERSITY': 'University Grants Commission',
      'UDEMY': 'Udemy Business Platform',
      'COURSERA': 'Coursera Learning Platform'
    };
    
    return instituteMap[cert.issuer] || 'Digital Learning Institute';
  }

  // Generate student ID
  generateStudentId(email) {
    const username = email.split('@')[0];
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `STU${Math.abs(hash).toString().substring(0, 6)}`;
  }

  // Seed all users to MongoDB Atlas
  async seedAllUsers() {
    try {
      logger.info(`🌱 Starting advanced user seeding for ${this.uniqueUsers.length} users...`);
      
      const results = {
        total_users: this.uniqueUsers.length,
        created_users: 0,
        existing_users: 0,
        failed_users: 0,
        user_details: [],
        certificate_summary: {}
      };

      for (const userData of this.uniqueUsers) {
        try {
          // Check if user already exists
          const existingUser = await User.findOne({ email: userData.email });
          
          if (existingUser) {
            results.existing_users++;
            results.user_details.push({
              email: userData.email,
              name: `${userData.firstName} ${userData.lastName}`,
              status: 'already_exists',
              certificates_count: userData.certificates.length
            });
            logger.info(`✅ User already exists: ${userData.email}`);
          } else {
            // Create new user
            const newUser = new User({
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              learnerProfile: userData.learnerProfile,
              isActive: true
            });
            
            await newUser.save();
            results.created_users++;
            results.user_details.push({
              email: userData.email,
              name: `${userData.firstName} ${userData.lastName}`,
              status: 'created',
              certificates_count: userData.certificates.length,
              student_id: userData.learnerProfile.studentId,
              institution: userData.learnerProfile.institution
            });
            
            logger.info(`✅ Created user: ${userData.email} (${userData.certificates.length} certificates)`);
          }
          
          // Track certificate summary
          userData.certificates.forEach(cert => {
            if (!results.certificate_summary[cert.issuer]) {
              results.certificate_summary[cert.issuer] = 0;
            }
            results.certificate_summary[cert.issuer]++;
          });
          
        } catch (userError) {
          results.failed_users++;
          logger.error(`❌ Failed to create user ${userData.email}:`, userError);
          results.user_details.push({
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName}`,
            status: 'failed',
            error: userError.message
          });
        }
      }

      logger.info(`🎉 Advanced user seeding completed!`);
      logger.info(`📊 Results: ${results.created_users} created, ${results.existing_users} existing, ${results.failed_users} failed`);
      
      return {
        success: true,
        message: 'Advanced user seeding completed successfully',
        ...results
      };

    } catch (error) {
      logger.error('❌ Advanced user seeding failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Advanced user seeding failed'
      };
    }
  }

  // Get user login credentials
  getUserCredentials() {
    return this.uniqueUsers.map(user => ({
      email: user.email,
      password: user.password,
      name: `${user.firstName} ${user.lastName}`,
      certificates_count: user.certificates.length,
      institutes: [...new Set(user.certificates.map(c => c.issuer))],
      primary_institution: user.learnerProfile.institution
    }));
  }

  // Get user by email
  getUserByEmail(email) {
    return this.uniqueUsers.find(user => user.email === email);
  }

  // Get certificates for user and institute
  getUserCertificatesForInstitute(userEmail, instituteId) {
    const user = this.getUserByEmail(userEmail);
    if (!user) return [];
    
    return user.certificates.filter(cert => cert.issuer === instituteId);
  }

  // Get all certificates for user
  getAllUserCertificates(userEmail) {
    const user = this.getUserByEmail(userEmail);
    if (!user) return [];
    
    return user.certificates;
  }

  // Get statistics
  getStatistics() {
    const stats = {
      total_unique_users: this.uniqueUsers.length,
      total_certificates: this.allCertificates.length,
      certificates_per_user: Math.round(this.allCertificates.length / this.uniqueUsers.length * 100) / 100,
      institutes_distribution: {},
      user_distribution: {}
    };

    // Calculate institute distribution
    this.allCertificates.forEach(cert => {
      if (!stats.institutes_distribution[cert.issuer]) {
        stats.institutes_distribution[cert.issuer] = 0;
      }
      stats.institutes_distribution[cert.issuer]++;
    });

    // Calculate user distribution
    this.uniqueUsers.forEach(user => {
      const certCount = user.certificates.length;
      const range = certCount <= 2 ? '1-2' : certCount <= 4 ? '3-4' : '5+';
      if (!stats.user_distribution[range]) {
        stats.user_distribution[range] = 0;
      }
      stats.user_distribution[range]++;
    });

    return stats;
  }
}

// Create singleton instance
const advancedUserSeeder = new AdvancedUserSeeder();

// Export functions
export const seedAllSkillVaultUsers = () => advancedUserSeeder.seedAllUsers();
export const getUserCredentials = () => advancedUserSeeder.getUserCredentials();
export const getAdvancedUserStats = () => advancedUserSeeder.getStatistics();
export const getUserCertificatesForInstitute = (email, institute) => 
  advancedUserSeeder.getUserCertificatesForInstitute(email, institute);
export const getAllUserCertificates = (email) => 
  advancedUserSeeder.getAllUserCertificates(email);

export default advancedUserSeeder;
