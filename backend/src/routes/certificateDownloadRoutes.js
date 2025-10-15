import express from 'express';
import { param, validationResult } from 'express-validator';
import externalApiService from '../services/externalApiService.js';
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

// GET /api/certificates/download/:certificateId - Download certificate PDF
router.get('/download/:certificateId',
  authenticate,
  [
    param('certificateId').notEmpty().withMessage('Certificate ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { certificateId } = req.params;
      
      logger.info(`Downloading certificate: ${certificateId}`);
      
      // Try direct download from mock API first
      try {
        const mockApiResponse = await fetch(`http://localhost:5001/download/${certificateId}`);
        
        if (mockApiResponse.ok) {
          const buffer = await mockApiResponse.arrayBuffer();
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${certificateId}.pdf"`);
          res.setHeader('Access-Control-Allow-Origin', '*');
          
          res.send(Buffer.from(buffer));
          logger.info(`Successfully downloaded certificate via proxy: ${certificateId}`);
          return;
        }
      } catch (mockError) {
        logger.warn(`Mock API download failed, trying external service: ${mockError.message}`);
      }

      // Fallback to external API service
      const downloadResult = await externalApiService.downloadCertificatePDF(certificateId);
      
      if (downloadResult.success) {
        // Set appropriate headers for PDF download
        res.setHeader('Content-Type', downloadResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadResult.filename}"`);
        
        // Pipe the PDF stream to response
        downloadResult.stream.pipe(res);
        
        logger.info(`Successfully downloaded certificate: ${certificateId}`);
      } else {
        res.status(404).json({
          success: false,
          message: 'Certificate not found or download failed',
          error: downloadResult.error
        });
      }
      
    } catch (error) {
      logger.error('Error downloading certificate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download certificate',
        error: error.message
      });
    }
  }
);

// GET /api/certificates/details/:instituteId/:certificateId - Get certificate details
router.get('/details/:instituteId/:certificateId',
  authenticate,
  [
    param('instituteId').notEmpty().withMessage('Institute ID is required'),
    param('certificateId').notEmpty().withMessage('Certificate ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { instituteId, certificateId } = req.params;
      
      logger.info(`Getting certificate details: ${instituteId}/${certificateId}`);
      
      const detailsResult = await externalApiService.getCertificateDetails(instituteId, certificateId);
      
      if (detailsResult.success) {
        res.json({
          success: true,
          message: 'Certificate details retrieved successfully',
          certificate: detailsResult.certificate,
          metadata_source: detailsResult.metadata_source
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Certificate details not found',
          error: detailsResult.error
        });
      }
      
    } catch (error) {
      logger.error('Error getting certificate details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get certificate details',
        error: error.message
      });
    }
  }
);

// GET /api/certificates/health - Check external API health (no auth required)
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await externalApiService.checkExternalAPIHealth();
    
    res.json({
      success: true,
      message: 'External API health check completed',
      external_api: healthCheck
    });
  } catch (error) {
    logger.error('Error checking external API health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check external API health',
      error: error.message
    });
  }
});

export default router;
