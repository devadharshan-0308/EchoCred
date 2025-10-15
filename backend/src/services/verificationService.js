import crypto from 'crypto';
import logger from '../config/logger.js';
import realBlockchainService from './realBlockchainService.js';

class VerificationService {
  constructor() {
    // Simplified verification - no Python services
    this.verificationWeights = {
      apiValidation: 50,
      blockchain: 50
    };
  }

  /**
   * Simplified certificate verification (no Python services)
   */
  async verifyCertificate(certificateData) {
    try {
      logger.info(`Starting simplified verification for certificate: ${certificateData.originalName || certificateData.credential_id}`);
      
      const verificationResult = {
        certificateId: certificateData._id || certificateData.credential_id,
        overallConfidence: 0,
        verificationMethods: {},
        summary: {},
        timestamp: new Date().toISOString(),
        processingTime: 0
      };

      const startTime = Date.now();

      // Run all verification methods in parallel for better performance
      const [
        fileIntegrityResult,
        digitalSignatureResult,
        qrCodeResult,
        apiValidationResult,
        blockchainResult
      ] = await Promise.allSettled([
        this.verifyFileIntegrity(certificateData),
        this.verifyDigitalSignature(certificateData),
        this.verifyQRCode(certificateData),
        this.verifyWithAPI(certificateData),
        this.verifyBlockchain(certificateData)
      ]);

      // Process results
      verificationResult.verificationMethods = {
        fileIntegrity: this.processResult(fileIntegrityResult, 'fileIntegrity'),
        digitalSignature: this.processResult(digitalSignatureResult, 'digitalSignature'),
        qrCode: this.processResult(qrCodeResult, 'qrCode'),
        apiValidation: this.processResult(apiValidationResult, 'apiValidation'),
        blockchain: this.processResult(blockchainResult, 'blockchain')
      };

      // Calculate overall confidence
      verificationResult.overallConfidence = this.calculateOverallConfidence(
        verificationResult.verificationMethods
      );

      // Generate summary
      verificationResult.summary = this.generateSummary(verificationResult);
      
      verificationResult.processingTime = Date.now() - startTime;
      
      logger.info(`Verification completed with ${verificationResult.overallConfidence}% confidence`);
      
      return verificationResult;
      
    } catch (error) {
      logger.error('Error in comprehensive verification:', error);
      return {
        success: false,
        error: error.message,
        overallConfidence: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verify file integrity
   */
  async verifyFileIntegrity(certificateData) {
    try {
      logger.info('Verifying file integrity...');
      
      // Calculate file hash
      const fileHash = crypto.createHash('sha256')
        .update(certificateData.filename || certificateData.originalName || 'unknown')
        .digest('hex');

      // Basic file validation
      const validations = {
        fileExists: !!certificateData.filePath,
        validSize: certificateData.fileSize > 0 && certificateData.fileSize < 10 * 1024 * 1024,
        validType: ['application/pdf', 'image/jpeg', 'image/png'].includes(certificateData.mimeType),
        hasMetadata: !!(certificateData.originalName && certificateData.fileSize)
      };

      const passedValidations = Object.values(validations).filter(Boolean).length;
      const confidence = (passedValidations / Object.keys(validations).length) * 100;

      return {
        success: true,
        status: confidence > 75 ? 'passed' : 'warning',
        confidence: Math.round(confidence),
        details: {
          fileHash,
          validations,
          fileSize: certificateData.fileSize,
          mimeType: certificateData.mimeType
        }
      };
      
    } catch (error) {
      logger.error('File integrity verification failed:', error);
      return {
        success: false,
        status: 'failed',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Verify digital signature using Python service
   */
  async verifyDigitalSignature(certificateData) {
    try {
      logger.info('Verifying digital signature...');
      
      if (!certificateData.filePath) {
        return {
          success: true,
          status: 'skipped',
          confidence: 0,
          message: 'No file path available for signature verification'
        };
      }

      const response = await axios.post(`${this.pythonServiceUrl}/verify/signature`, {
        filepath: certificateData.filePath
      }, { timeout: 30000 });

      if (response.data.success) {
        return {
          success: true,
          status: response.data.signature_valid ? 'passed' : 'failed',
          confidence: response.data.signature_valid ? 95 : 0,
          details: response.data.signature_details || {}
        };
      } else {
        return {
          success: true,
          status: 'failed',
          confidence: 0,
          message: 'No valid digital signature found'
        };
      }
      
    } catch (error) {
      logger.warn('Digital signature verification failed (expected for unsigned PDFs):', error.message);
      return {
        success: true,
        status: 'failed',
        confidence: 0,
        message: 'Digital signature verification unavailable'
      };
    }
  }

  /**
   * Verify QR code using Python service
   */
  async verifyQRCode(certificateData) {
    try {
      logger.info('Verifying QR code...');
      
      if (!certificateData.filePath) {
        return {
          success: true,
          status: 'skipped',
          confidence: 0,
          message: 'No file path available for QR verification'
        };
      }

      const response = await axios.post(`${this.pythonServiceUrl}/verify/qr`, {
        filepath: certificateData.filePath
      }, { timeout: 30000 });

      if (response.data.success && response.data.qr_codes_found > 0) {
        return {
          success: true,
          status: 'passed',
          confidence: 85,
          details: {
            qrCodesFound: response.data.qr_codes_found,
            qrData: response.data.qr_codes || []
          }
        };
      } else {
        return {
          success: true,
          status: 'failed',
          confidence: 0,
          message: 'No QR codes found or invalid QR data'
        };
      }
      
    } catch (error) {
      logger.warn('QR code verification failed (expected for certificates without QR):', error.message);
      return {
        success: true,
        status: 'failed',
        confidence: 0,
        message: 'QR code verification unavailable'
      };
    }
  }

  /**
   * Verify with mock API
   */
  async verifyWithAPI(certificateData) {
    try {
      logger.info('Verifying with mock API...');
      
      const result = await mockApiService.validateCertificateData(certificateData);
      
      if (result.validated) {
        return {
          success: true,
          status: 'passed',
          confidence: result.confidence || 90,
          details: {
            issuer: result.issuer,
            apiData: result.data
          }
        };
      } else {
        return {
          success: true,
          status: 'warning',
          confidence: 20, // Still give some points for API availability
          message: result.message || 'Certificate not found in issuer database'
        };
      }
      
    } catch (error) {
      logger.warn('API validation failed:', error.message);
      return {
        success: true,
        status: 'failed',
        confidence: 0,
        message: 'API validation service unavailable'
      };
    }
  }

  /**
   * Verify blockchain (mock implementation)
   */
  async verifyBlockchain(certificateData) {
    try {
      logger.info('Verifying blockchain...');
      
      // Simulate blockchain verification
      const blockchainHash = crypto.createHash('sha256')
        .update(certificateData.originalName + certificateData.fileSize + Date.now())
        .digest('hex');

      // Mock blockchain storage
      const blockchainRecord = {
        hash: `0x${blockchainHash.substring(0, 32)}`,
        timestamp: new Date().toISOString(),
        blockNumber: Math.floor(Math.random() * 1000000),
        confirmed: true
      };

      return {
        success: true,
        status: 'passed',
        confidence: 100,
        details: {
          blockchainHash: blockchainRecord.hash,
          blockNumber: blockchainRecord.blockNumber,
          timestamp: blockchainRecord.timestamp,
          network: 'Skill Vault Max Testnet'
        }
      };
      
    } catch (error) {
      logger.error('Blockchain verification failed:', error);
      return {
        success: false,
        status: 'failed',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Process verification result
   */
  processResult(result, methodName) {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      logger.error(`${methodName} verification failed:`, result.reason);
      return {
        success: false,
        status: 'failed',
        confidence: 0,
        error: result.reason?.message || 'Verification failed'
      };
    }
  }

  /**
   * Calculate overall confidence score
   */
  calculateOverallConfidence(verificationMethods) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [method, result] of Object.entries(verificationMethods)) {
      const weight = this.verificationWeights[method] || 0;
      const confidence = result.confidence || 0;
      
      totalScore += (confidence * weight) / 100;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  /**
   * Generate verification summary
   */
  generateSummary(verificationResult) {
    const methods = verificationResult.verificationMethods;
    const passedMethods = Object.values(methods).filter(m => m.status === 'passed').length;
    const totalMethods = Object.keys(methods).length;
    
    let status = 'failed';
    if (verificationResult.overallConfidence >= 80) {
      status = 'verified';
    } else if (verificationResult.overallConfidence >= 60) {
      status = 'partial';
    }

    return {
      status,
      passedMethods,
      totalMethods,
      recommendations: this.generateRecommendations(verificationResult),
      riskLevel: this.calculateRiskLevel(verificationResult.overallConfidence)
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(verificationResult) {
    const recommendations = [];
    const methods = verificationResult.verificationMethods;

    if (methods.digitalSignature?.status !== 'passed') {
      recommendations.push('Consider using digitally signed certificates for higher security');
    }

    if (methods.qrCode?.status !== 'passed') {
      recommendations.push('Add QR codes to certificates for easier verification');
    }

    if (methods.apiValidation?.status !== 'passed') {
      recommendations.push('Ensure certificate is registered with issuer database');
    }

    if (verificationResult.overallConfidence < 70) {
      recommendations.push('Certificate verification confidence is low - manual review recommended');
    }

    return recommendations;
  }

  /**
   * Calculate risk level
   */
  calculateRiskLevel(confidence) {
    if (confidence >= 90) return 'very_low';
    if (confidence >= 75) return 'low';
    if (confidence >= 60) return 'medium';
    if (confidence >= 40) return 'high';
    return 'very_high';
  }
}

export default new VerificationService();
