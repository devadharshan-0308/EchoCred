import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Certificate from '../models/Certificate.js';
import VerificationLog from '../models/VerificationLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateCertificateUpload, validateObjectId, validatePagination } from '../middleware/validateInput.js';
import { uploadRateLimit } from '../config/rateLimit.js';
import logger from '../config/logger.js';
import verificationService from '../services/verificationService.js';
import mockApiService from '../services/mockApiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads/certificates/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cert-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png').split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExt} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// @route   POST /api/certificates/upload
// @desc    Upload a new certificate
// @access  Private (Learners)
router.post('/upload', 
  authenticate, 
  authorize('learner', 'admin'), 
  uploadRateLimit,
  upload.single('certificate'),
  validateCertificateUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Certificate file is required'
        });
      }

      const { title, description, issuer, courseDetails } = req.body;

      // Generate certificate hash
      const fileBuffer = fs.readFileSync(req.file.path);
      const crypto = await import('crypto');
      const certificateHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Check for duplicate certificates
      const existingCert = await Certificate.findOne({ certificateHash });
      if (existingCert) {
        // Remove uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'This certificate has already been uploaded'
        });
      }

      // Create certificate record
      const certificate = new Certificate({
        title: title || req.file.originalname,
        description,
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        certificateHash,
        learnerId: req.user._id,
        issuerName: issuer || 'Unknown Issuer',
        source: 'upload',
        courseDetails: courseDetails ? JSON.parse(courseDetails) : undefined
      });

      // QR code generation removed for simplified deployment

      await certificate.save();

      // Start verification process
      try {
        const verificationResult = await verifyCertificate(req.file.path);
        certificate.verificationReport = verificationResult;
        certificate.verificationStatus = verificationResult.includes('✅') ? 'verified' : 'failed';
        certificate.verificationDate = new Date();
        await certificate.save();

        // Log verification
        await VerificationLog.create({
          certificateId: certificate._id,
          verifierId: req.user._id,
          verifierType: 'learner',
          verificationType: 'automated',
          verificationMethod: 'digital_signature',
          verificationResult: certificate.verificationStatus,
          verificationData: {
            signatureValid: verificationResult.includes('✅'),
            fileHashMatch: true,
            metadataValid: true
          },
          requestInfo: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      } catch (verifyError) {
        logger.warn('Certificate verification failed:', verifyError);
        certificate.verificationReport = `Verification failed: ${verifyError.message}`;
        certificate.verificationStatus = 'failed';
        await certificate.save();
      }

      logger.info(`Certificate uploaded by user ${req.user.email}: ${certificate._id}`);

      res.status(201).json({
        success: true,
        message: 'Certificate uploaded successfully',
        data: { certificate }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      logger.error('Certificate upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Certificate upload failed',
        error: error.message
      });
    }
  }
);

// @route   GET /api/certificates
// @desc    Get user's certificates
// @access  Private
router.get('/', authenticate, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { learnerId: req.user._id, isActive: true };

    // Add filters
    if (req.query.status) {
      query.verificationStatus = req.query.status;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const certificates = await Certificate.find(query)
      .populate('issuerId', 'firstName lastName issuerProfile.organizationName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Certificate.countDocuments(query);

    res.json({
      success: true,
      data: {
        certificates,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    logger.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates'
    });
  }
});

// @route   GET /api/certificates/:id
// @desc    Get certificate details
// @access  Private
router.get('/:id', authenticate, validateObjectId, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('learnerId', 'firstName lastName email')
      .populate('issuerId', 'firstName lastName issuerProfile.organizationName');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check access permissions
    const hasAccess = certificate.learnerId._id.toString() === req.user._id.toString() ||
                     certificate.issuerId?._id.toString() === req.user._id.toString() ||
                     req.user.role === 'admin' ||
                     certificate.isPublic;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count
    await certificate.incrementView();

    res.json({
      success: true,
      data: { certificate }
    });
  } catch (error) {
    logger.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificate'
    });
  }
});

// @route   POST /api/certificates/:id/verify
// @desc    Verify certificate using comprehensive verification
// @access  Private
router.post('/:id/verify', authenticate, validateObjectId, async (req, res) => {
  try {
    logger.info(`Starting verification for certificate ${req.params.id}`);
    
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check access permissions
    const hasAccess = certificate.learnerId.toString() === req.user._id.toString() ||
                     certificate.issuerId?.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Run comprehensive verification
    const verificationResult = await verificationService.verifyCertificate(certificate);
    
    // Update certificate with verification results
    certificate.verificationStatus = verificationResult.summary?.status || 'failed';
    certificate.confidenceScore = verificationResult.overallConfidence;
    certificate.verificationReport = verificationResult;
    certificate.lastVerified = new Date();
    
    // Add blockchain hash if available
    if (verificationResult.verificationMethods?.blockchain?.details?.blockchainHash) {
      certificate.blockchainHash = verificationResult.verificationMethods.blockchain.details.blockchainHash;
    }
    
    await certificate.save();

    // Log verification
    await VerificationLog.create({
      certificateId: certificate._id,
      userId: req.user._id,
      verificationResult,
      timestamp: new Date()
    });

    logger.info(`Verification completed for certificate ${req.params.id} with ${verificationResult.overallConfidence}% confidence`);

    res.json({
      success: true,
      data: {
        verificationResult,
        certificate: {
          _id: certificate._id,
          verificationStatus: certificate.verificationStatus,
          confidenceScore: certificate.confidenceScore,
          blockchainHash: certificate.blockchainHash
        }
      }
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

// @route   GET /api/certificates/:id/download
// @desc    Download certificate file
// @access  Private
router.get('/:id/download', authenticate, validateObjectId, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check access permissions
    const hasAccess = certificate.learnerId.toString() === req.user._id.toString() ||
                     certificate.issuerId?.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists
    if (!fs.existsSync(certificate.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Certificate file not found on server'
      });
    }

    // Increment download count
    await certificate.incrementDownload();

    // Set headers for download
    res.setHeader('Content-Type', certificate.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.originalName}"`);

    // Stream file
    const fileStream = fs.createReadStream(certificate.filePath);
    fileStream.pipe(res);

    logger.info(`Certificate downloaded: ${certificate._id} by user: ${req.user.email}`);
  } catch (error) {
    logger.error('Certificate download error:', error);
    res.status(500).json({
      success: false,
      message: 'Download failed'
    });
  }
});

// @route   PUT /api/certificates/:id
// @desc    Update certificate details
// @access  Private
router.put('/:id', authenticate, validateObjectId, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check permissions
    const canUpdate = certificate.learnerId.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const allowedUpdates = ['title', 'description', 'tags', 'category', 'isPublic', 'courseDetails'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedCertificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    logger.info(`Certificate updated: ${certificate._id} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Certificate updated successfully',
      data: { certificate: updatedCertificate }
    });
  } catch (error) {
    logger.error('Certificate update error:', error);
    res.status(400).json({
      success: false,
      message: 'Certificate update failed',
      error: error.message
    });
  }
});

// @route   DELETE /api/certificates/:id
// @desc    Delete certificate (soft delete)
// @access  Private
router.delete('/:id', authenticate, validateObjectId, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check permissions
    const canDelete = certificate.learnerId.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete
    certificate.isActive = false;
    await certificate.save();

    logger.info(`Certificate deleted: ${certificate._id} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    logger.error('Certificate deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Certificate deletion failed'
    });
  }
});

export default router;
