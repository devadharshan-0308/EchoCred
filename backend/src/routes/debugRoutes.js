import express from 'express';
import User from '../models/User.js';
import logger from '../config/logger.js';

const router = express.Router();

// Debug login endpoint without validation
router.post('/test-login', async (req, res) => {
  try {
    logger.info('Debug login request received:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        received: { email: !!email, password: !!password }
      });
    }

    // Find user and include password for comparison
    const user = await User.findByCredentials(email, password);
    
    logger.info('Debug login successful for:', email);

    res.json({
      success: true,
      message: 'Debug login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Debug login failed:', error.message);
    res.status(401).json({
      success: false,
      message: error.message,
      debug: true
    });
  }
});

export default router;
