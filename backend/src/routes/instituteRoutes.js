import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import instituteApiService from '../services/instituteApiService.js';
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

// GET /api/institutes - Get all available institutes
router.get('/', (req, res) => {
  try {
    const institutes = instituteApiService.getAllInstitutes();
    
    res.json({
      success: true,
      message: 'Institutes retrieved successfully',
      total_institutes: institutes.length,
      ncvet_verified: institutes.filter(i => i.type === 'NCVET_VERIFIED').length,
      non_ncvet: institutes.filter(i => i.type === 'NON_NCVET').length,
      institutes: institutes
    });
  } catch (error) {
    logger.error('Error fetching institutes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institutes',
      error: error.message
    });
  }
});

// POST /api/institutes/fetch-credentials - Fetch credentials from specific institute
router.post('/fetch-credentials',
  authenticate,
  [
    body('institute_id').notEmpty().withMessage('Institute ID is required'),
    body('learner_email').isEmail().withMessage('Valid email is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { institute_id, learner_email } = req.body;
      
      logger.info(`Fetching credentials from ${institute_id} for ${learner_email}`);
      
      // Fetch credentials from institute API
      const result = await instituteApiService.fetchCredentialsFromInstitute(institute_id, learner_email);
      
      if (result.success && result.credentials.length > 0) {
        // Add credentials to blockchain
        const blockchainResults = [];
        for (const credential of result.credentials) {
          const blockchainResult = await enhancedBlockchainService.simulateMining({
            credential_id: credential.credential_id,
            learner_email: credential.learner_email,
            issuer: credential.issuer,
            course_name: credential.course_name,
            issue_date: credential.issue_date,
            verification_type: credential.verification_status
          });
          blockchainResults.push(blockchainResult);
        }
        
        res.json({
          success: true,
          message: `Successfully fetched ${result.credentials.length} credentials from ${result.institute}`,
          institute: result.institute,
          institute_type: result.institute_type,
          credentials_fetched: result.credentials_count,
          credentials: result.credentials,
          blockchain_status: blockchainResults.filter(r => r.success).length + ' credentials added to blockchain'
        });
      } else {
        res.json({
          success: true,
          message: result.error || `No credentials found for ${learner_email} at ${institute_id}`,
          institute: result.institute,
          credentials_fetched: 0,
          credentials: []
        });
      }
      
    } catch (error) {
      logger.error('Error fetching credentials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch credentials',
        error: error.message
      });
    }
  }
);

// POST /api/institutes/digilocker-fetch - Simulate DigiLocker credential fetch
router.post('/digilocker-fetch',
  authenticate,
  [
    body('learner_email').isEmail().withMessage('Valid email is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { learner_email } = req.body;
      
      logger.info(`Simulating DigiLocker fetch for ${learner_email}`);
      
      // Simulate DigiLocker fetch
      const result = await instituteApiService.simulateDigiLockerFetch(learner_email);
      
      if (result.success) {
        // Calculate NSQF progress
        const nsqfProgress = instituteApiService.calculateNSQFProgress(result.credentials);
        
        res.json({
          success: true,
          message: `DigiLocker fetch completed - found ${result.total_credentials} credentials`,
          source: result.source,
          fetch_timestamp: result.fetch_timestamp,
          summary: {
            total_credentials: result.total_credentials,
            ncvet_verified: result.ncvet_verified,
            non_ncvet: result.non_ncvet
          },
          nsqf_progress: nsqfProgress,
          credentials: result.credentials
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'DigiLocker fetch failed',
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('Error in DigiLocker fetch:', error);
      res.status(500).json({
        success: false,
        message: 'DigiLocker fetch failed',
        error: error.message
      });
    }
  }
);

// GET /api/institutes/:instituteId - Get specific institute details
router.get('/:instituteId',
  [
    param('instituteId').notEmpty().withMessage('Institute ID is required')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { instituteId } = req.params;
      const institute = instituteApiService.getInstituteById(instituteId);
      
      if (institute) {
        res.json({
          success: true,
          institute: {
            ...institute,
            category: institute.type === 'NCVET_VERIFIED' ? 'NCVET Verified' : 'Industry Platform',
            badge: institute.type === 'NCVET_VERIFIED' ? '✅ Government Verified' : '⚠️ Industry Recognized'
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Institute ${instituteId} not found`
        });
      }
    } catch (error) {
      logger.error('Error fetching institute details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch institute details',
        error: error.message
      });
    }
  }
);

// GET /api/institutes/categories/ncvet - Get only NCVET verified institutes
router.get('/categories/ncvet', (req, res) => {
  try {
    const allInstitutes = instituteApiService.getAllInstitutes();
    const ncvetInstitutes = allInstitutes.filter(institute => institute.type === 'NCVET_VERIFIED');
    
    res.json({
      success: true,
      message: 'NCVET verified institutes retrieved',
      count: ncvetInstitutes.length,
      institutes: ncvetInstitutes
    });
  } catch (error) {
    logger.error('Error fetching NCVET institutes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NCVET institutes',
      error: error.message
    });
  }
});

// GET /api/institutes/categories/industry - Get only industry/non-NCVET institutes
router.get('/categories/industry', (req, res) => {
  try {
    const allInstitutes = instituteApiService.getAllInstitutes();
    const industryInstitutes = allInstitutes.filter(institute => institute.type === 'NON_NCVET');
    
    res.json({
      success: true,
      message: 'Industry institutes retrieved',
      count: industryInstitutes.length,
      institutes: industryInstitutes
    });
  } catch (error) {
    logger.error('Error fetching industry institutes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch industry institutes',
      error: error.message
    });
  }
});

export default router;
