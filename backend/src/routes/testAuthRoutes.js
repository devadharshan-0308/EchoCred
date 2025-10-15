import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { seedUsers } from '../seeders/userSeeder.js';
import { seedAllSkillVaultUsers, getUserCredentials, getAdvancedUserStats } from '../seeders/advancedUserSeeder.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

// @route   POST /api/test-auth/simple-register
// @desc    Simple registration for testing (bypasses validation)
// @access  Public
router.post('/simple-register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'learner' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user data based on role
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role,
      isActive: true
    };

    // Add role-specific profiles
    if (role === 'employer') {
      userData.employerProfile = {
        companyName: 'Test Company Inc.',
        industry: 'Technology'
      };
    } else if (role === 'learner') {
      userData.learnerProfile = {
        institution: 'Test University'
      };
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // User response
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse
    });

    logger.info(`Simple registration successful for ${email}`);

  } catch (error) {
    logger.error('Simple registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @route   POST /api/test-auth/login-as-john
// @desc    Login as John (specific user)
// @access  Public
router.post('/login-as-john', async (req, res) => {
  try {
    logger.info('Login as John attempt');

    // Find or create John
    let johnUser = await User.findOne({ email: 'john.learner@example.com' });
    
    if (!johnUser) {
      // Create John if he doesn't exist
      johnUser = new User({
        email: 'john.learner@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'learner',
        learnerProfile: {
          institution: 'Delhi University',
          studentId: 'DU2024001'
        },
        isActive: true
      });
      
      await johnUser.save();
      logger.info('Created John user');
    }

    // Generate token
    const token = generateToken(johnUser._id);

    // User response
    const userResponse = {
      id: johnUser._id,
      email: johnUser.email,
      firstName: johnUser.firstName,
      lastName: johnUser.lastName,
      name: `${johnUser.firstName} ${johnUser.lastName}`,
      role: johnUser.role
    };

    res.json({
      success: true,
      message: 'Login as John successful',
      token,
      user: userResponse
    });

    logger.info(`Login as John successful`);

  } catch (error) {
    logger.error('Login as John error:', error);
    res.status(500).json({
      success: false,
      message: 'Login as John failed',
      error: error.message
    });
  }
});

// @route   POST /api/test-auth/quick-login
// @desc    Quick login for testing (bypasses validation)
// @access  Public
router.post('/quick-login', async (req, res) => {
  try {
    logger.info('Quick login attempt');

    // Create or find test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      // Create test user
      testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'learner',
        isActive: true
      });
      
      await testUser.save();
      logger.info('Created test user');
    }

    // Generate token
    const token = generateToken(testUser._id);

    // User response
    const userResponse = {
      id: testUser._id,
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      name: `${testUser.firstName} ${testUser.lastName}`,
      role: testUser.role
    };

    res.json({
      success: true,
      message: 'Quick login successful',
      token,
      user: userResponse
    });

    logger.info(`Quick login successful for test user`);

  } catch (error) {
    logger.error('Quick login error:', error);
    res.status(500).json({
      success: false,
      message: 'Quick login failed',
      error: error.message
    });
  }
});

// @route   POST /api/test-auth/create-test-users
// @desc    Create multiple test users
// @access  Public
router.post('/create-test-users', async (req, res) => {
  try {
    const testUsers = [
      {
        email: 'learner@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Learner',
        role: 'learner',
        learnerProfile: {
          institution: 'Test University'
        }
      },
      {
        email: 'employer@test.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Employer',
        role: 'employer',
        employerProfile: {
          companyName: 'Test Company Inc.',
          industry: 'Technology'
        }
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = new User({
          ...userData,
          isActive: true
        });
        
        await user.save();
        createdUsers.push({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
        });
      }
    }

    res.json({
      success: true,
      message: `Created ${createdUsers.length} test users`,
      users: createdUsers
    });

  } catch (error) {
    logger.error('Error creating test users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test users',
      error: error.message
    });
  }
});

// @route   POST /api/test-auth/seed-users
// @desc    Seed database with mock users and certificates
// @access  Public
router.post('/seed-users', async (req, res) => {
  try {
    const result = await seedUsers();
    res.json(result);
  } catch (error) {
    logger.error('Error seeding users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed users',
      error: error.message
    });
  }
});

// @route   POST /api/test-auth/seed-all-skill-vault-users
// @desc    Seed database with all 30 users from skill-valut-api
// @access  Public
router.post('/seed-all-skill-vault-users', async (req, res) => {
  try {
    logger.info('🚀 Starting advanced skill-vault-api user seeding...');
    const result = await seedAllSkillVaultUsers();
    res.json(result);
  } catch (error) {
    logger.error('Error seeding skill-vault users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed skill-vault users',
      error: error.message
    });
  }
});

// @route   GET /api/test-auth/user-credentials
// @desc    Get all user login credentials
// @access  Public
router.get('/user-credentials', (req, res) => {
  try {
    const credentials = getUserCredentials();
    const stats = getAdvancedUserStats();
    
    res.json({
      success: true,
      message: 'User credentials retrieved successfully',
      total_users: credentials.length,
      statistics: stats,
      credentials: credentials,
      usage_instructions: {
        login_format: 'Use email and password: "password123" for all users',
        example: {
          email: credentials[0]?.email || 'alice.johnson@example.com',
          password: 'password123'
        }
      }
    });
  } catch (error) {
    logger.error('Error getting user credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user credentials',
      error: error.message
    });
  }
});

// @route   GET /api/test-auth/status
// @desc    Check auth system status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    res.json({
      success: true,
      message: 'Auth system status',
      database_connected: true,
      database_type: 'MongoDB Atlas Cloud',
      total_users: userCount,
      test_user_exists: !!testUser,
      jwt_secret_configured: !!process.env.JWT_SECRET,
      mongodb_connected: true
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Auth system check failed',
      error: error.message,
      database_connected: false
    });
  }
});

export default router;
