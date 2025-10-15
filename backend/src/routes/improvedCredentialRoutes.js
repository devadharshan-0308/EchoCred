import express from 'express';
import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';
import logger from '../config/logger.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/credentials/all/:email
// @desc    Get all certificates for a user by email (improved version)
// @access  Private
router.get('/all/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    logger.info(`Fetching all certificates for ${email}`);
    
    // Get all certificates for this learner from skill-valut-api
    const allCertificates = skillVaultApiIntegration.getCertificatesByLearner(email);
    
    // Group by institute for better organization
    const certificatesByInstitute = {};
    const instituteStats = {};
    
    allCertificates.forEach(cert => {
      const instituteId = cert.issuer;
      
      if (!certificatesByInstitute[instituteId]) {
        certificatesByInstitute[instituteId] = [];
        instituteStats[instituteId] = {
          name: cert.issuer,
          type: cert.institute_info?.type || 'UNKNOWN',
          count: 0,
          ncvet_count: 0
        };
      }
      
      certificatesByInstitute[instituteId].push(cert);
      instituteStats[instituteId].count++;
      
      if (cert.status === 'GOVERNMENT_VERIFIED') {
        instituteStats[instituteId].ncvet_count++;
      }
    });
    
    res.json({
      success: true,
      message: `Found ${allCertificates.length} certificates across ${Object.keys(certificatesByInstitute).length} institutes`,
      learner_email: email,
      total_certificates: allCertificates.length,
      institutes: Object.keys(certificatesByInstitute).length,
      institute_stats: instituteStats,
      certificates_by_institute: certificatesByInstitute,
      all_certificates: allCertificates
    });
    
  } catch (error) {
    logger.error('Error fetching all certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
});

// @route   POST /api/credentials/search
// @desc    Search certificates by multiple criteria
// @access  Private
router.post('/search', authenticate, (req, res) => {
  try {
    const { 
      learner_email, 
      institute_id, 
      course_name, 
      nsqf_level, 
      status,
      date_from,
      date_to 
    } = req.body;
    
    logger.info(`Searching certificates with criteria:`, req.body);
    
    let results = [];
    
    if (learner_email) {
      results = skillVaultApiIntegration.getCertificatesByLearner(learner_email);
    } else {
      results = skillVaultApiIntegration.getAllCertificates();
    }
    
    // Apply filters
    if (institute_id) {
      results = results.filter(cert => cert.issuer === institute_id);
    }
    
    if (course_name) {
      results = results.filter(cert => 
        cert.course_name?.toLowerCase().includes(course_name.toLowerCase()) ||
        cert.course_title?.toLowerCase().includes(course_name.toLowerCase())
      );
    }
    
    if (nsqf_level) {
      results = results.filter(cert => cert.nsqf_level == nsqf_level);
    }
    
    if (status) {
      results = results.filter(cert => cert.status === status);
    }
    
    if (date_from) {
      results = results.filter(cert => new Date(cert.completion_date) >= new Date(date_from));
    }
    
    if (date_to) {
      results = results.filter(cert => new Date(cert.completion_date) <= new Date(date_to));
    }
    
    res.json({
      success: true,
      message: `Found ${results.length} certificates matching criteria`,
      search_criteria: req.body,
      results_count: results.length,
      certificates: results
    });
    
  } catch (error) {
    logger.error('Error searching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// @route   GET /api/credentials/institutes
// @desc    Get all available institutes with certificate counts
// @access  Private
router.get('/institutes', authenticate, (req, res) => {
  try {
    const institutes = skillVaultApiIntegration.getAllInstitutes();
    const allCertificates = skillVaultApiIntegration.getAllCertificates();
    
    // Add certificate counts to each institute
    const institutesWithStats = institutes.map(institute => {
      const instituteCerts = allCertificates.filter(cert => cert.issuer === institute.id);
      const ncvetCerts = instituteCerts.filter(cert => cert.status === 'GOVERNMENT_VERIFIED');
      
      return {
        ...institute,
        certificate_count: instituteCerts.length,
        ncvet_certificate_count: ncvetCerts.length,
        learners: [...new Set(instituteCerts.map(cert => cert.learner_email))].length
      };
    });
    
    res.json({
      success: true,
      message: `Found ${institutes.length} institutes`,
      institutes: institutesWithStats,
      total_certificates: allCertificates.length
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

// @route   GET /api/credentials/stats
// @desc    Get overall system statistics
// @access  Private
router.get('/stats', authenticate, (req, res) => {
  try {
    const stats = skillVaultApiIntegration.getStatistics();
    const allCertificates = skillVaultApiIntegration.getAllCertificates();
    const institutes = skillVaultApiIntegration.getAllInstitutes();
    
    // Calculate additional stats
    const nsqfLevels = {};
    const statusCounts = {};
    const monthlyIssuance = {};
    
    allCertificates.forEach(cert => {
      // NSQF levels
      if (cert.nsqf_level) {
        nsqfLevels[cert.nsqf_level] = (nsqfLevels[cert.nsqf_level] || 0) + 1;
      }
      
      // Status counts
      statusCounts[cert.status] = (statusCounts[cert.status] || 0) + 1;
      
      // Monthly issuance
      if (cert.issue_date) {
        const month = cert.issue_date.substring(0, 7); // YYYY-MM
        monthlyIssuance[month] = (monthlyIssuance[month] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      message: 'System statistics retrieved',
      basic_stats: stats,
      detailed_stats: {
        total_certificates: allCertificates.length,
        total_institutes: institutes.length,
        total_learners: [...new Set(allCertificates.map(cert => cert.learner_email))].length,
        nsqf_level_distribution: nsqfLevels,
        status_distribution: statusCounts,
        monthly_issuance: monthlyIssuance,
        government_verified: statusCounts['GOVERNMENT_VERIFIED'] || 0,
        industry_verified: statusCounts['INDUSTRY_VERIFIED'] || 0
      }
    });
    
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;
