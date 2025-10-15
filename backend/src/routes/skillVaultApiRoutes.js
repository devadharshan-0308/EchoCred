import express from 'express';
import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';
import realBlockchainService from '../services/realBlockchainService.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route   GET /api/skill-vault-api/status
// @desc    Get skill-valut-api integration status
// @access  Public
router.get('/status', (req, res) => {
  try {
    const stats = skillVaultApiIntegration.getStatistics();
    const institutes = skillVaultApiIntegration.getAllInstitutes();
    
    res.json({
      success: true,
      message: 'Skill-valut-api integration active',
      integration_status: 'ACTIVE',
      ...stats,
      institutes: institutes.map(inst => ({
        id: inst.id,
        name: inst.name,
        type: inst.type,
        certificate_count: skillVaultApiIntegration.getCertificatesByInstitute(inst.id).length
      })),
      data_source: 'skill-valut-api/mocks/data',
      last_loaded: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting skill-vault-api status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration status',
      error: error.message
    });
  }
});

// @route   GET /api/skill-vault-api/certificates
// @desc    Get all certificates from skill-valut-api
// @access  Public
router.get('/certificates', (req, res) => {
  try {
    const { institute, learner } = req.query;
    let certificates;
    
    if (institute) {
      certificates = skillVaultApiIntegration.getCertificatesByInstitute(institute);
    } else if (learner) {
      certificates = skillVaultApiIntegration.getCertificatesByLearner(learner);
    } else {
      certificates = skillVaultApiIntegration.getAllCertificates();
    }
    
    res.json({
      success: true,
      message: `Found ${certificates.length} certificates`,
      filter: { institute, learner },
      certificates_count: certificates.length,
      certificates: certificates
    });
  } catch (error) {
    logger.error('Error getting certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificates',
      error: error.message
    });
  }
});

// @route   GET /api/skill-vault-api/certificates/:email
// @desc    Get certificates for specific learner by email
// @access  Public
router.get('/certificates/:email', (req, res) => {
  try {
    const { email } = req.params;
    logger.info(`Getting certificates for learner: ${email}`);
    
    const certificates = skillVaultApiIntegration.getCertificatesByLearner(email);
    
    res.json({
      success: true,
      message: `Found ${certificates.length} certificates for ${email}`,
      learner_email: email,
      certificates_count: certificates.length,
      certificates: certificates
    });
  } catch (error) {
    logger.error('Error getting certificates for learner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificates for learner',
      error: error.message
    });
  }
});

// @route   GET /api/skill-vault-api/certificate/:id
// @desc    Get specific certificate by ID
// @access  Public
router.get('/certificate/:id', (req, res) => {
  try {
    const { id } = req.params;
    const certificate = skillVaultApiIntegration.getCertificateById(id);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        certificate_id: id
      });
    }
    
    res.json({
      success: true,
      message: 'Certificate found',
      certificate: certificate
    });
  } catch (error) {
    logger.error('Error getting certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificate',
      error: error.message
    });
  }
});

// @route   POST /api/skill-vault-api/add-to-blockchain
// @desc    Add skill-valut-api certificate to blockchain
// @access  Public
router.post('/add-to-blockchain', async (req, res) => {
  try {
    const { certificate_id } = req.body;
    
    if (!certificate_id) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required'
      });
    }
    
    const certificate = skillVaultApiIntegration.getCertificateById(certificate_id);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        certificate_id
      });
    }
    
    // Add to blockchain
    const blockchainResult = await realBlockchainService.addCertificate(certificate);
    
    res.json({
      success: true,
      message: 'Certificate added to blockchain',
      certificate_id,
      blockchain_result: blockchainResult
    });
    
  } catch (error) {
    logger.error('Error adding certificate to blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add certificate to blockchain',
      error: error.message
    });
  }
});

// @route   POST /api/skill-vault-api/bulk-blockchain
// @desc    Add all skill-valut-api certificates to blockchain
// @access  Public
router.post('/bulk-blockchain', async (req, res) => {
  try {
    const { institute_id, learner_email } = req.body;
    let certificates;
    
    if (institute_id) {
      certificates = skillVaultApiIntegration.getCertificatesByInstitute(institute_id);
    } else if (learner_email) {
      certificates = skillVaultApiIntegration.getCertificatesByLearner(learner_email);
    } else {
      certificates = skillVaultApiIntegration.getAllCertificates();
    }
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const certificate of certificates) {
      try {
        const blockchainResult = await realBlockchainService.addCertificate(certificate);
        results.push({
          certificate_id: certificate.credential_id,
          success: blockchainResult.success,
          blockchain_result: blockchainResult
        });
        
        if (blockchainResult.success) successCount++;
        else failCount++;
        
      } catch (error) {
        results.push({
          certificate_id: certificate.credential_id,
          success: false,
          error: error.message
        });
        failCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Bulk blockchain operation completed`,
      total_certificates: certificates.length,
      successful_additions: successCount,
      failed_additions: failCount,
      filter: { institute_id, learner_email },
      results: results
    });
    
  } catch (error) {
    logger.error('Error in bulk blockchain operation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk blockchain operation',
      error: error.message
    });
  }
});

// @route   GET /api/skill-vault-api/digilocker/:email
// @desc    Simulate DigiLocker fetch for learner
// @access  Public
router.get('/digilocker/:email', (req, res) => {
  try {
    const { email } = req.params;
    const result = skillVaultApiIntegration.simulateDigiLockerFetch(email);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in DigiLocker simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to simulate DigiLocker fetch',
      error: error.message
    });
  }
});

export default router;
