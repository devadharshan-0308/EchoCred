import express from 'express';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import VerificationLog from '../models/VerificationLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectId, validatePagination, validateEmployerProfile } from '../middleware/validateInput.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route   GET /api/employer/dashboard
// @desc    Get employer dashboard statistics
// @access  Private (Employers, Admins)
router.get('/dashboard', authenticate, authorize('employer', 'admin'), async (req, res) => {
  try {
    const stats = {
      totalVerifications: 0,
      successfulVerifications: 0,
      pendingVerifications: 0,
      recentVerifications: [],
      topSkills: [],
      verificationTrends: []
    };

    // Get verification logs for this employer
    const verificationLogs = await VerificationLog.find({
      verifierId: req.user._id,
      verifierType: 'employer'
    }).populate('certificateId', 'title issuerName courseDetails');

    stats.totalVerifications = verificationLogs.length;
    stats.successfulVerifications = verificationLogs.filter(log => log.verificationResult === 'verified').length;
    stats.pendingVerifications = verificationLogs.filter(log => log.verificationResult === 'pending').length;

    // Recent verifications (last 10)
    stats.recentVerifications = verificationLogs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(log => ({
        id: log._id,
        certificateTitle: log.certificateId?.title,
        issuer: log.certificateId?.issuerName,
        result: log.verificationResult,
        date: log.createdAt,
        confidenceScore: log.confidenceScore
      }));

    // Get verification trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trends = await VerificationLog.aggregate([
      {
        $match: {
          verifierId: req.user._id,
          verifierType: 'employer',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$verificationResult', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    stats.verificationTrends = trends;

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Employer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard'
    });
  }
});

// @route   POST /api/employer/verify-certificate/:id
// @desc    Verify a specific certificate
// @access  Private (Employers, Admins)
router.post('/verify-certificate/:id', authenticate, authorize('employer', 'admin'), validateObjectId, async (req, res) => {
  try {
    const { verificationPurpose, businessContext } = req.body;

    const certificate = await Certificate.findById(req.params.id)
      .populate('learnerId', 'firstName lastName email')
      .populate('issuerId', 'firstName lastName issuerProfile.organizationName');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Increment verification count
    await certificate.incrementVerification();

    // Create verification log
    const verificationLog = new VerificationLog({
      certificateId: certificate._id,
      verifierId: req.user._id,
      verifierType: 'employer',
      verificationType: 'manual',
      verificationMethod: 'employer_review',
      verificationResult: certificate.verificationStatus,
      confidenceScore: certificate.verificationStatus === 'verified' ? 95 : 50,
      verificationData: {
        signatureValid: certificate.digitalSignature?.isValid,
        qrCodeValid: certificate.qrCode?.isValid,
        metadataValid: true,
        fileHashMatch: true
      },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      verificationPurpose: verificationPurpose || 'employment',
      businessContext
    });

    await verificationLog.save();

    logger.info(`Certificate verified by employer ${req.user.email}: ${certificate._id}`);

    res.json({
      success: true,
      message: 'Certificate verification completed',
      data: {
        certificate,
        verificationLog: {
          id: verificationLog._id,
          result: verificationLog.verificationResult,
          confidenceScore: verificationLog.confidenceScore,
          timestamp: verificationLog.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Certificate verification failed',
      error: error.message
    });
  }
});

// @route   POST /api/employer/bulk-verify
// @desc    Bulk verify multiple certificates
// @access  Private (Employers, Admins)
router.post('/bulk-verify', authenticate, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { certificateIds, verificationPurpose, businessContext } = req.body;

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Certificate IDs array is required'
      });
    }

    if (certificateIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 certificates can be verified at once'
      });
    }

    const results = [];
    const verificationLogs = [];

    for (const certId of certificateIds) {
      try {
        const certificate = await Certificate.findById(certId)
          .populate('learnerId', 'firstName lastName email');

        if (!certificate) {
          results.push({
            certificateId: certId,
            status: 'not_found',
            message: 'Certificate not found'
          });
          continue;
        }

        // Increment verification count
        await certificate.incrementVerification();

        // Create verification log
        const verificationLog = new VerificationLog({
          certificateId: certificate._id,
          verifierId: req.user._id,
          verifierType: 'employer',
          verificationType: 'bulk',
          verificationMethod: 'employer_review',
          verificationResult: certificate.verificationStatus,
          confidenceScore: certificate.verificationStatus === 'verified' ? 95 : 50,
          verificationData: {
            signatureValid: certificate.digitalSignature?.isValid,
            qrCodeValid: certificate.qrCode?.isValid,
            metadataValid: true,
            fileHashMatch: true
          },
          requestInfo: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          },
          verificationPurpose: verificationPurpose || 'employment',
          businessContext
        });

        verificationLogs.push(verificationLog);

        results.push({
          certificateId: certId,
          status: 'verified',
          result: certificate.verificationStatus,
          confidenceScore: verificationLog.confidenceScore,
          learnerName: `${certificate.learnerId.firstName} ${certificate.learnerId.lastName}`,
          certificateTitle: certificate.title
        });
      } catch (error) {
        results.push({
          certificateId: certId,
          status: 'error',
          message: error.message
        });
      }
    }

    // Save all verification logs
    if (verificationLogs.length > 0) {
      await VerificationLog.insertMany(verificationLogs);
    }

    logger.info(`Bulk verification completed by employer ${req.user.email}: ${certificateIds.length} certificates`);

    res.json({
      success: true,
      message: 'Bulk verification completed',
      data: {
        totalProcessed: certificateIds.length,
        successful: results.filter(r => r.status === 'verified').length,
        failed: results.filter(r => r.status !== 'verified').length,
        results
      }
    });
  } catch (error) {
    logger.error('Bulk verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk verification failed',
      error: error.message
    });
  }
});

// @route   GET /api/employer/search-certificates
// @desc    Search certificates by learner email or certificate details
// @access  Private (Employers, Admins)
router.get('/search-certificates', authenticate, authorize('employer', 'admin'), validatePagination, async (req, res) => {
  try {
    const { email, name, skill, issuer, nsqfLevel, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    let populateQuery = {};

    // Search by learner email or name
    if (email || name) {
      const userQuery = {};
      if (email) userQuery.email = new RegExp(email, 'i');
      if (name) {
        userQuery.$or = [
          { firstName: new RegExp(name, 'i') },
          { lastName: new RegExp(name, 'i') }
        ];
      }

      const users = await User.find(userQuery).select('_id');
      const userIds = users.map(user => user._id);
      query.learnerId = { $in: userIds };
    }

    // Search by certificate details
    if (skill) {
      query.skillAreas = new RegExp(skill, 'i');
    }
    if (issuer) {
      query.issuerName = new RegExp(issuer, 'i');
    }
    if (nsqfLevel) {
      query.nsqfLevel = parseInt(nsqfLevel);
    }

    const certificates = await Certificate.find(query)
      .populate('learnerId', 'firstName lastName email profile')
      .populate('issuerId', 'firstName lastName issuerProfile.organizationName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments(query);

    // Filter out sensitive information for employer view
    const sanitizedCertificates = certificates.map(cert => ({
      _id: cert._id,
      title: cert.title,
      issuerName: cert.issuerName,
      verificationStatus: cert.verificationStatus,
      nsqfLevel: cert.nsqfLevel,
      skillAreas: cert.skillAreas,
      category: cert.category,
      courseDetails: cert.courseDetails,
      createdAt: cert.createdAt,
      learner: {
        name: `${cert.learnerId.firstName} ${cert.learnerId.lastName}`,
        email: cert.learnerId.email
      },
      canVerify: true
    }));

    res.json({
      success: true,
      data: {
        certificates: sanitizedCertificates,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Certificate search error:', error);
    res.status(500).json({
      success: false,
      message: 'Certificate search failed'
    });
  }
});

// @route   GET /api/employer/verification-history
// @desc    Get employer's verification history
// @access  Private (Employers, Admins)
router.get('/verification-history', authenticate, authorize('employer', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      verifierId: req.user._id,
      verifierType: 'employer'
    };

    // Add filters
    if (req.query.result) {
      query.verificationResult = req.query.result;
    }
    if (req.query.dateFrom) {
      query.createdAt = { $gte: new Date(req.query.dateFrom) };
    }
    if (req.query.dateTo) {
      query.createdAt = { ...query.createdAt, $lte: new Date(req.query.dateTo) };
    }

    const verificationLogs = await VerificationLog.find(query)
      .populate({
        path: 'certificateId',
        populate: {
          path: 'learnerId',
          select: 'firstName lastName email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VerificationLog.countDocuments(query);

    const sanitizedLogs = verificationLogs.map(log => ({
      _id: log._id,
      verificationResult: log.verificationResult,
      confidenceScore: log.confidenceScore,
      verificationMethod: log.verificationMethod,
      verificationPurpose: log.verificationPurpose,
      businessContext: log.businessContext,
      processingTime: log.processingTime,
      createdAt: log.createdAt,
      certificate: log.certificateId ? {
        title: log.certificateId.title,
        issuerName: log.certificateId.issuerName,
        learnerName: log.certificateId.learnerId ? 
          `${log.certificateId.learnerId.firstName} ${log.certificateId.learnerId.lastName}` : 'Unknown'
      } : null
    }));

    res.json({
      success: true,
      data: {
        verificationLogs: sanitizedLogs,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    logger.error('Verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification history'
    });
  }
});

// @route   PUT /api/employer/profile
// @desc    Update employer profile
// @access  Private (Employers)
router.put('/profile', authenticate, authorize('employer'), validateEmployerProfile, async (req, res) => {
  try {
    const updates = {
      'employerProfile.companyName': req.body.companyName,
      'employerProfile.companySize': req.body.companySize,
      'employerProfile.industry': req.body.industry,
      'employerProfile.website': req.body.website
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    logger.info(`Employer profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Employer profile updated successfully',
      data: { user }
    });
  } catch (error) {
    logger.error('Employer profile update error:', error);
    res.status(400).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
});

// @route   GET /api/employer/analytics
// @desc    Get verification analytics for employer
// @access  Private (Employers, Admins)
router.get('/analytics', authenticate, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let matchStage = {
      verifierId: req.user._id,
      verifierType: 'employer'
    };

    // Add date range filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

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
          avgConfidence: { $avg: '$confidenceScore' },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Verification by purpose
    const purposeStats = await VerificationLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$verificationPurpose',
          count: { $sum: 1 },
          successRate: {
            $avg: { $cond: [{ $eq: ['$verificationResult', 'verified'] }, 1, 0] }
          }
        }
      }
    ]);

    // Top skills verified
    const skillStats = await VerificationLog.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'certificates',
          localField: 'certificateId',
          foreignField: '_id',
          as: 'certificate'
        }
      },
      { $unwind: '$certificate' },
      { $unwind: '$certificate.skillAreas' },
      {
        $group: {
          _id: '$certificate.skillAreas',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        trends,
        purposeStats,
        skillStats
      }
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics'
    });
  }
});

export default router;
