import express from 'express';
import { body, query, validationResult } from 'express-validator';
import enhancedBlockchainService from '../services/enhancedBlockchainService.js';
import logger from '../config/logger.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/blockchain/ledger - Get blockchain ledger
router.get('/ledger', 
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const ledger = enhancedBlockchainService.getBlockchainLedger(limit);
      
      res.json({
        success: true,
        message: 'Blockchain ledger retrieved successfully',
        ...ledger
      });
    } catch (error) {
      logger.error('Error fetching blockchain ledger:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blockchain ledger',
        error: error.message
      });
    }
  }
);

// GET /api/blockchain/stats - Get blockchain statistics
router.get('/stats', (req, res) => {
  try {
    const stats = enhancedBlockchainService.getBlockchainStats();
    
    res.json({
      success: true,
      message: 'Blockchain statistics retrieved successfully',
      stats: stats
    });
  } catch (error) {
    logger.error('Error fetching blockchain stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blockchain statistics',
      error: error.message
    });
  }
});

// POST /api/blockchain/add - Add credential to blockchain
router.post('/add',
  authenticate,
  [
    body('credential_id').notEmpty().withMessage('Credential ID is required'),
    body('learner_email').isEmail().withMessage('Valid email is required'),
    body('issuer').notEmpty().withMessage('Issuer is required'),
    body('course_name').notEmpty().withMessage('Course name is required'),
    body('verification_type').isIn(['GOVERNMENT_VERIFIED', 'INDUSTRY_VERIFIED', 'PENDING']).withMessage('Invalid verification type')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const credentialData = req.body;
      
      logger.info(`Adding credential ${credentialData.credential_id} to blockchain`);
      
      // Add to blockchain with mining simulation
      const result = await enhancedBlockchainService.simulateMining(credentialData);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Credential successfully added to blockchain',
          transaction: result.transaction,
          blockchain_hash: result.transaction.credential_hash
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to add credential to blockchain',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Error adding credential to blockchain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add credential to blockchain',
        error: error.message
      });
    }
  }
);

// GET /api/blockchain/verify - Verify credential hash in blockchain
router.get('/verify',
  [
    query('hash').notEmpty().withMessage('Credential hash is required')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { hash } = req.query;
      
      logger.info(`Verifying credential hash in blockchain: ${hash.substring(0, 16)}...`);
      
      const verification = enhancedBlockchainService.verifyCredentialInBlockchain(hash);
      
      if (verification.verified) {
        res.json({
          success: true,
          verified: true,
          message: 'Credential hash verified in blockchain',
          transaction: verification.transaction,
          verification_time: verification.verification_time
        });
      } else {
        res.json({
          success: true,
          verified: false,
          message: verification.message || 'Credential hash not found in blockchain'
        });
      }
    } catch (error) {
      logger.error('Error verifying credential in blockchain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify credential in blockchain',
        error: error.message
      });
    }
  }
);

// GET /api/blockchain/learner/:email - Get all blockchain transactions for a learner
router.get('/learner/:email',
  authenticate,
  (req, res) => {
    try {
      const { email } = req.params;
      
      logger.info(`Fetching blockchain transactions for learner: ${email}`);
      
      const transactions = enhancedBlockchainService.getLearnerTransactions(email);
      
      if (transactions.success) {
        res.json({
          success: true,
          message: `Found ${transactions.total_credentials} blockchain transactions for ${email}`,
          ...transactions
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to fetch learner transactions',
          error: transactions.error
        });
      }
    } catch (error) {
      logger.error('Error fetching learner blockchain transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch learner transactions',
        error: error.message
      });
    }
  }
);

// GET /api/blockchain/validate - Validate blockchain integrity
router.get('/validate', (req, res) => {
  try {
    logger.info('Validating blockchain integrity');
    
    const validation = enhancedBlockchainService.validateBlockchainIntegrity();
    
    res.json({
      success: true,
      message: 'Blockchain validation completed',
      validation: validation
    });
  } catch (error) {
    logger.error('Error validating blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate blockchain',
      error: error.message
    });
  }
});

// POST /api/blockchain/generate-hash - Generate hash for credential data (utility endpoint)
router.post('/generate-hash',
  [
    body('credential_id').notEmpty().withMessage('Credential ID is required'),
    body('learner_email').isEmail().withMessage('Valid email is required'),
    body('issuer').notEmpty().withMessage('Issuer is required'),
    body('course_name').notEmpty().withMessage('Course name is required')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const credentialData = req.body;
      
      const hash = enhancedBlockchainService.generateCredentialHash(credentialData);
      
      res.json({
        success: true,
        message: 'Credential hash generated successfully',
        credential_data: credentialData,
        generated_hash: hash,
        hash_algorithm: 'SHA256'
      });
    } catch (error) {
      logger.error('Error generating credential hash:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate credential hash',
        error: error.message
      });
    }
  }
);

export default router;
