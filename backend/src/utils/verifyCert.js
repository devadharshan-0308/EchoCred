import axios from 'axios';
import logger from '../config/logger.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

/**
 * Verify certificate using Python microservice
 * @param {string} filePath - Path to the certificate file
 * @returns {Promise<Object>} Verification result
 */
export async function verifyCertificate(filePath) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/verify/certificate`, {
      filepath: filePath
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      return response.data.verification_result;
    } else {
      throw new Error(response.data.error || 'Verification failed');
    }
  } catch (error) {
    logger.error('Certificate verification error:', error);
    
    // Fallback to simple verification if microservice is unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.warn('Python microservice unavailable, using fallback verification');
      return await fallbackVerification(filePath);
    }
    
    throw error;
  }
}

/**
 * Verify digital signature using Python microservice
 * @param {string} filePath - Path to the certificate file
 * @param {string} publicKey - PEM formatted public key (optional)
 * @returns {Promise<Object>} Signature verification result
 */
export async function verifyDigitalSignature(filePath, publicKey = null) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/verify/signature`, {
      filepath: filePath,
      public_key: publicKey
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data.signature_verification;
  } catch (error) {
    logger.error('Digital signature verification error:', error);
    throw error;
  }
}

/**
 * Extract and verify QR codes using Python microservice
 * @param {string} filePath - Path to the certificate file
 * @param {Object} certificateData - Certificate data for validation
 * @returns {Promise<Object>} QR verification result
 */
export async function verifyQRCode(filePath, certificateData = {}) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/verify/qr`, {
      filepath: filePath,
      certificate_data: certificateData
    }, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data.qr_verification;
  } catch (error) {
    logger.error('QR code verification error:', error);
    throw error;
  }
}

/**
 * Calculate file hash using Python microservice
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Promise<string>} File hash
 */
export async function calculateFileHash(fileBuffer) {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'certificate.pdf');

    const response = await axios.post(`${PYTHON_SERVICE_URL}/hash/calculate`, formData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.file_hash;
  } catch (error) {
    logger.error('Hash calculation error:', error);
    throw error;
  }
}

/**
 * Fallback verification when Python microservice is unavailable
 * @param {string} filePath - Path to the certificate file
 * @returns {Promise<Object>} Basic verification result
 */
async function fallbackVerification(filePath) {
  const fs = await import('fs');
  const crypto = await import('crypto');
  
  try {
    // Basic file existence and readability check
    if (!fs.existsSync(filePath)) {
      throw new Error('Certificate file not found');
    }

    const stats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Basic PDF validation
    const isPDF = fileBuffer.toString('ascii', 0, 4) === '%PDF';

    return {
      success: true,
      file_info: {
        file_path: filePath,
        file_size: stats.size,
        file_hash: fileHash,
        is_readable: true,
        is_pdf: isPDF
      },
      content_analysis: {
        has_meaningful_content: isPDF,
        certificate_indicators: {
          score: isPDF ? 50 : 0
        }
      },
      integrity_check: {
        file_readable: true,
        pdf_structure_valid: isPDF
      },
      overall_score: isPDF ? 60 : 20,
      verification_method: 'fallback',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Fallback verification error:', error);
    throw error;
  }
}
