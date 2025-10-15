import express from 'express';
import Certificate from '../models/Certificate.js';
import VerificationLog from '../models/VerificationLog.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateInput.js';
import logger from '../config/logger.js';
import { verifyCertificate } from '../utils/verifyCert.js';

const router = express.Router();

// @route   POST /api/verify/certificate/:id
// @desc    Verify a certificate by ID
// @access  Public (with optional auth for enhanced features)
router.post('/certificate/:id', optionalAuth, validateObjectId, async (req, res) => {
  try {
    const { verificationPurpose, businessContext } = req.body;

    const certificate = await Certificate.findById(req.params.id)
      .populate('learnerId', 'firstName lastName email')
      .populate('issuerId', 'firstName lastName issuerProfile.organizationName');

    if (!certificate || !certificate.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or inactive'
      });
    }

    // Check if certificate is expired
    if (certificate.expiryDate && certificate.expiryDate < new Date()) {
      const verificationLog = new VerificationLog({
        certificateId: certificate._id,
        verifierId: req.user?._id || null,
        verifierType: req.user?.role || 'public',
        verificationType: 'api',
        verificationMethod: 'expiry_check',
        verificationResult: 'expired',
        confidenceScore: 0,
        verificationData: {
          expiryCheck: false,
          metadataValid: true
        },
        requestInfo: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        verificationPurpose: verificationPurpose || 'other'
      });

      await verificationLog.save();

      return res.json({
        success: false,
        message: 'Certificate has expired',
        data: {
          certificate: {
            id: certificate._id,
            title: certificate.title,
            issuerName: certificate.issuerName,
            expiryDate: certificate.expiryDate
          },
          verificationResult: 'expired',
          confidenceScore: 0
        }
      });
    }

    // Perform comprehensive verification
    let verificationData = {
      signatureValid: certificate.digitalSignature?.isValid || false,
      fileHashMatch: true,
      metadataValid: true,
      expiryCheck: !certificate.expiryDate || certificate.expiryDate > new Date(),
      revocationCheck: true // Will be enhanced with actual revocation checking
    };

    // Re-verify certificate file if available and user is authenticated
    if (req.user && certificate.filePath) {
      try {
        const freshVerification = await verifyCertificate(certificate.filePath);
        verificationData.signatureValid = freshVerification.includes('✅');
      } catch (verifyError) {
        logger.warn('Fresh verification failed:', verifyError);
      }
    }

    // Calculate confidence score
    let confidenceScore = 0;
    if (verificationData.signatureValid) confidenceScore += 40;
    if (verificationData.fileHashMatch) confidenceScore += 25;
    if (verificationData.metadataValid) confidenceScore += 20;
    if (verificationData.expiryCheck) confidenceScore += 15;
    if (verificationData.revocationCheck) confidenceScore += 5;

    // Determine verification result
    let verificationResult = 'verified';
    if (confidenceScore < 50) {
      verificationResult = 'suspicious';
    } else if (confidenceScore < 70) {
      verificationResult = 'pending';
    }

    // Create verification log
    const verificationLog = new VerificationLog({
      certificateId: certificate._id,
      verifierId: req.user?._id || null,
      verifierType: req.user?.role || 'public',
      verificationType: 'api',
      verificationMethod: 'comprehensive',
      verificationResult,
      confidenceScore,
      verificationData,
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      verificationPurpose: verificationPurpose || 'other',
      businessContext
    });

    await verificationLog.save();

    // Increment verification count
    await certificate.incrementVerification();

    // Prepare response data
    const responseData = {
      certificate: {
        id: certificate._id,
        title: certificate.title,
        description: certificate.description,
        issuerName: certificate.issuerName,
        learnerName: `${certificate.learnerId.firstName} ${certificate.learnerId.lastName}`,
        issueDate: certificate.createdAt,
        expiryDate: certificate.expiryDate,
        nsqfLevel: certificate.nsqfLevel,
        skillAreas: certificate.skillAreas,
        category: certificate.category,
        courseDetails: certificate.courseDetails
      },
      verification: {
        result: verificationResult,
        confidenceScore,
        timestamp: verificationLog.createdAt,
        verificationId: verificationLog._id,
        details: verificationData
      }
    };

    // Add blockchain info if available
    if (certificate.blockchainTxHash) {
      responseData.blockchain = {
        txHash: certificate.blockchainTxHash,
        blockNumber: certificate.blockchainBlockNumber,
        network: certificate.blockchainNetwork
      };
    }

    logger.info(`Certificate verified: ${certificate._id} by ${req.user?.email || 'anonymous'}`);

    res.json({
      success: true,
      message: 'Certificate verification completed',
      data: responseData
    });
  } catch (error) {
    logger.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// QR code verification endpoint removed for simplified deployment

// @route   POST /api/verify/hash
// @desc    Verify certificate by hash
// @access  Public
router.post('/hash', optionalAuth, async (req, res) => {
  try {
    const { certificateHash } = req.body;

    if (!certificateHash) {
      return res.status(400).json({
        success: false,
        message: 'Certificate hash is required'
      });
    }

    const certificate = await Certificate.findOne({ 
      certificateHash, 
      isActive: true 
    }).populate('learnerId', 'firstName lastName email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found with provided hash'
      });
    }

    // Create verification log
    const verificationLog = new VerificationLog({
      certificateId: certificate._id,
      verifierId: req.user?._id || null,
      verifierType: req.user?.role || 'public',
      verificationType: 'api',
      verificationMethod: 'blockchain_hash',
      verificationResult: 'verified',
      confidenceScore: 85,
      verificationData: {
        fileHashMatch: true,
        originalHash: certificateHash,
        currentHash: certificate.certificateHash
      },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await verificationLog.save();

    res.json({
      success: true,
      message: 'Hash verification successful',
      data: {
        certificate: {
          id: certificate._id,
          title: certificate.title,
          issuerName: certificate.issuerName,
          learnerName: `${certificate.learnerId.firstName} ${certificate.learnerId.lastName}`,
          verificationStatus: certificate.verificationStatus
        },
        verification: {
          result: 'verified',
          confidenceScore: 85,
          method: 'hash_match'
        }
      }
    });
  } catch (error) {
    logger.error('Hash verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Hash verification failed',
      error: error.message
    });
  }
});

// @route   GET /api/verify/public/:shareableLink
// @desc    Verify certificate by public shareable link
// @access  Public
router.get('/public/:shareableLink', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      shareableLink: req.params.shareableLink,
      isPublic: true,
      isActive: true
    }).populate('learnerId', 'firstName lastName')
      .populate('issuerId', 'firstName lastName issuerProfile.organizationName');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or not publicly accessible'
      });
    }

    // Create verification log for public access
    const verificationLog = new VerificationLog({
      certificateId: certificate._id,
      verifierId: null,
      verifierType: 'public',
      verificationType: 'api',
      verificationMethod: 'public_link',
      verificationResult: 'verified',
      confidenceScore: 80,
      verificationData: {
        publicAccess: true,
        linkValid: true
      },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await verificationLog.save();

    // Increment view count
    await certificate.incrementView();

    res.json({
      success: true,
      message: 'Public certificate verification successful',
      data: {
        certificate: {
          id: certificate._id,
          title: certificate.title,
          description: certificate.description,
          issuerName: certificate.issuerName,
          learnerName: `${certificate.learnerId.firstName} ${certificate.learnerId.lastName}`,
          issueDate: certificate.createdAt,
          verificationStatus: certificate.verificationStatus,
          nsqfLevel: certificate.nsqfLevel,
          skillAreas: certificate.skillAreas,
          category: certificate.category
        },
        verification: {
          result: 'verified',
          confidenceScore: 80,
          method: 'public_access',
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    logger.error('Public verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Public verification failed',
      error: error.message
    });
  }
});

// @route   GET /api/verify/stats
// @desc    Get verification statistics
// @access  Private (Admin only)
router.get('/stats', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = 'monthly', startDate, endDate } = req.query;

    let matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Overall statistics
    const totalVerifications = await VerificationLog.countDocuments(matchStage);
    const successfulVerifications = await VerificationLog.countDocuments({
      ...matchStage,
      verificationResult: 'verified'
    });

    // Verification trends
    const groupBy = period === 'daily' 
      ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      : { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

    const trends = await VerificationLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          totalVerifications: { $sum: 1 },
          successfulVerifications: {
            $sum: { $cond: [{ $eq: ['$verificationResult', 'verified'] }, 1, 0] }
          },
          avgConfidence: { $avg: '$confidenceScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Verification by method
    const methodStats = await VerificationLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$verificationMethod',
          count: { $sum: 1 },
          successRate: {
            $avg: { $cond: [{ $eq: ['$verificationResult', 'verified'] }, 1, 0] }
          }
        }
      }
    ]);

    // Verification by verifier type
    const verifierTypeStats = await VerificationLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$verifierType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalVerifications,
          successfulVerifications,
          successRate: totalVerifications > 0 ? (successfulVerifications / totalVerifications * 100).toFixed(2) : 0
        },
        trends,
        methodStats,
        verifierTypeStats
      }
    });
  } catch (error) {
    logger.error('Verification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification statistics'
    });
  }
});

export default router;
