import express from 'express';
import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';
import logger from '../config/logger.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/simple/certificates/:email
// @desc    Get all certificates for a user by email
// @access  Public (for testing)
router.get('/certificates/:email', (req, res) => {
  try {
    const { email } = req.params;
    logger.info(`Fetching certificates for ${email}`);
    
    // Get certificates directly from skill-valut-api integration
    const certificates = skillVaultApiIntegration.getCertificatesByLearner(email);
    
    res.json({
      success: true,
      message: `Found ${certificates.length} certificates`,
      email: email,
      certificates: certificates
    });
    
  } catch (error) {
    logger.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
});

// @route   POST /api/simple/fetch-by-institute
// @desc    Fetch certificates for a user from a specific institute
// @access  Public (temporarily for demo)
router.post('/fetch-by-institute', (req, res) => {
  try {
    const { institute_id, learner_email } = req.body;
    
    if (!institute_id || !learner_email) {
      return res.status(400).json({
        success: false,
        message: 'Institute ID and learner email are required'
      });
    }
    
    logger.info(`Fetching certificates from ${institute_id} for ${learner_email}`);
    
    // Get all certificates for the learner
    const allCertificates = skillVaultApiIntegration.getCertificatesByLearner(learner_email);
    
    // Filter by institute
    const instituteCertificates = allCertificates.filter(cert => cert.issuer === institute_id);
    
    // Get institute info
    const institutes = skillVaultApiIntegration.getAllInstitutes();
    const institute = institutes.find(inst => inst.id === institute_id);
    
    res.json({
      success: true,
      message: `Found ${instituteCertificates.length} certificates from ${institute?.name || institute_id}`,
      institute: institute?.name || institute_id,
      institute_type: institute?.type || 'UNKNOWN',
      credentials_count: instituteCertificates.length,
      credentials: instituteCertificates.map(cert => ({
        ...cert,
        institute_info: {
          id: institute_id,
          name: institute?.name || institute_id,
          type: institute?.type || 'UNKNOWN',
          nsqf_authority: institute?.nsqf_authority || false
        }
      }))
    });
    
  } catch (error) {
    logger.error('Error fetching institute certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
});

// @route   POST /api/simple/fetch-all-certificates
// @desc    Fetch ALL certificates for a user from ALL institutes (when user clicks main fetch button)
// @access  Public (temporarily for demo)
router.post('/fetch-all-certificates', (req, res) => {
  try {
    const { learner_email } = req.body;
    
    if (!learner_email) {
      return res.status(400).json({
        success: false,
        message: 'Learner email is required'
      });
    }
    
    logger.info(`🔄 FETCHING ALL certificates for ${learner_email} from ALL institutes`);
    
    // Fetch all certificates from all institutes
    const allCertificates = skillVaultApiIntegration.getCertificatesByLearner(learner_email);
    
    // Group by institute
    const certificatesByInstitute = {};
    allCertificates.forEach(cert => {
      if (!certificatesByInstitute[cert.issuer]) {
        certificatesByInstitute[cert.issuer] = [];
      }
      certificatesByInstitute[cert.issuer].push(cert);
    });
    
    res.json({
      success: true,
      message: `Successfully fetched ${allCertificates.length} certificates from ${Object.keys(certificatesByInstitute).length} institutes`,
      email: learner_email,
      total_certificates: allCertificates.length,
      institutes_found: Object.keys(certificatesByInstitute).length,
      certificates: allCertificates,
      certificates_by_institute: certificatesByInstitute
    });
    
  } catch (error) {
    logger.error('Error fetching all certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all certificates',
      error: error.message
    });
  }
});

// @route   GET /api/simple/test-data
// @desc    Get test data to verify integration
// @access  Public
router.get('/test-data', (req, res) => {
  try {
    const stats = skillVaultApiIntegration.getStatistics();
    const institutes = skillVaultApiIntegration.getAllInstitutes();
    const sampleCerts = skillVaultApiIntegration.getAllCertificates().slice(0, 3);
    
    res.json({
      success: true,
      message: 'Test data retrieved successfully',
      statistics: stats,
      institutes: institutes,
      sample_certificates: sampleCerts,
      sample_users: [
        'alice.johnson@example.com',
        'bob.smith@example.com',
        'charlie.lee@example.com',
        'diana.patel@example.com'
      ]
    });
    
  } catch (error) {
    logger.error('Error getting test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test data',
      error: error.message
    });
  }
});

export default router;
