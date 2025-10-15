import crypto from 'crypto';
import logger from '../config/logger.js';
import realBlockchainService from './realBlockchainService.js';

class SimpleVerificationService {
  constructor() {
    // Simple verification - only API validation and blockchain simulation
    this.verificationWeights = {
      apiValidation: 50,
      blockchain: 50
    };
  }

  /**
   * Simple certificate verification (no Python services, no QR, no complex hashing)
   */
  async verifyCertificate(certificateData) {
    try {
      logger.info(`Verifying certificate: ${certificateData.credential_id || certificateData.originalName}`);
      
      const verificationResult = {
        certificateId: certificateData.credential_id || certificateData._id,
        overallConfidence: 0,
        verificationMethods: {},
        summary: {},
        timestamp: new Date().toISOString(),
        processingTime: 0
      };

      const startTime = Date.now();

      // 1. API Validation (50% weight)
      const apiValidation = await this.performApiValidation(certificateData);
      verificationResult.verificationMethods.apiValidation = apiValidation;

      // 2. Blockchain Simulation (50% weight)
      const blockchainValidation = await this.performBlockchainValidation(certificateData);
      verificationResult.verificationMethods.blockchain = blockchainValidation;

      // Calculate overall confidence
      let totalConfidence = 0;
      totalConfidence += (apiValidation.confidence * this.verificationWeights.apiValidation) / 100;
      totalConfidence += (blockchainValidation.confidence * this.verificationWeights.blockchain) / 100;

      verificationResult.overallConfidence = Math.round(totalConfidence);
      verificationResult.processingTime = Date.now() - startTime;

      // Generate summary
      verificationResult.summary = this.generateSummary(verificationResult);

      logger.info(`Verification completed with ${verificationResult.overallConfidence}% confidence`);
      return verificationResult;

    } catch (error) {
      logger.error('Verification failed:', error);
      return {
        certificateId: certificateData.credential_id || certificateData._id,
        overallConfidence: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simple API validation
   */
  async performApiValidation(certificateData) {
    try {
      // Simple validation based on data structure
      const hasRequiredFields = !!(
        certificateData.credential_id &&
        certificateData.learner_email &&
        certificateData.course_name &&
        certificateData.issuer
      );

      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(certificateData.learner_email || '');
      const hasValidStatus = ['VERIFIED', 'GOVERNMENT_VERIFIED', 'INDUSTRY_VERIFIED'].includes(certificateData.status);

      let confidence = 0;
      if (hasRequiredFields) confidence += 40;
      if (isValidEmail) confidence += 30;
      if (hasValidStatus) confidence += 30;

      return {
        method: 'API Validation',
        confidence: Math.min(confidence, 100),
        details: {
          hasRequiredFields,
          isValidEmail,
          hasValidStatus,
          issuer: certificateData.issuer,
          status: certificateData.status
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('API validation failed:', error);
      return {
        method: 'API Validation',
        confidence: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Blockchain simulation validation
   */
  async performBlockchainValidation(certificateData) {
    try {
      // Check if certificate exists in blockchain
      const blockchainResult = await realBlockchainService.verifyCertificate(
        certificateData.credential_id || certificateData._id
      );

      let confidence = 0;
      if (blockchainResult.success) {
        confidence = blockchainResult.verified ? 100 : 50;
      }

      return {
        method: 'Blockchain Simulation',
        confidence: confidence,
        details: {
          exists: blockchainResult.success,
          verified: blockchainResult.verified,
          blockIndex: blockchainResult.blockIndex,
          hash: blockchainResult.hash
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Blockchain validation failed:', error);
      return {
        method: 'Blockchain Simulation',
        confidence: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate verification summary
   */
  generateSummary(verificationResult) {
    const confidence = verificationResult.overallConfidence;
    
    let status = 'FAILED';
    let message = 'Certificate verification failed';
    
    if (confidence >= 80) {
      status = 'VERIFIED';
      message = 'Certificate is highly trusted and verified';
    } else if (confidence >= 60) {
      status = 'PARTIALLY_VERIFIED';
      message = 'Certificate is partially verified with some concerns';
    } else if (confidence >= 40) {
      status = 'QUESTIONABLE';
      message = 'Certificate has questionable authenticity';
    }

    return {
      status,
      message,
      confidence: `${confidence}%`,
      recommendedAction: confidence >= 60 ? 'ACCEPT' : 'REVIEW_REQUIRED'
    };
  }

  /**
   * Batch verification for multiple certificates
   */
  async verifyMultipleCertificates(certificates) {
    const results = [];
    
    for (const cert of certificates) {
      const result = await this.verifyCertificate(cert);
      results.push(result);
    }
    
    return {
      totalCertificates: certificates.length,
      verifiedCount: results.filter(r => r.overallConfidence >= 60).length,
      results: results
    };
  }
}

export default new SimpleVerificationService();
