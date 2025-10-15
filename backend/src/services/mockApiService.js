import axios from 'axios';
import logger from '../config/logger.js';

class MockApiService {
  constructor() {
    this.baseUrl = process.env.MOCK_API_URL || 'http://localhost:5001';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Get all certificates from mock API
   */
  async getAllCertificates() {
    try {
      logger.info('Fetching all certificates from mock API');
      
      const response = await axios.get(`${this.baseUrl}/certificates`, {
        timeout: this.timeout
      });

      logger.info(`Retrieved ${response.data.catalog?.length || 0} certificates from mock API`);
      return response.data;
      
    } catch (error) {
      logger.error('Error fetching certificates from mock API:', error.message);
      return { catalog: [], files: [] };
    }
  }

  /**
   * Verify certificate with issuer API
   */
  async verifyCertificateWithIssuer(certificateId, issuer) {
    try {
      logger.info(`Verifying certificate ${certificateId} with issuer ${issuer}`);
      
      const response = await axios.get(
        `${this.baseUrl}/${issuer}/api/verify/${certificateId}`,
        { timeout: this.timeout }
      );

      logger.info(`Certificate verification response from ${issuer}:`, response.data);
      return {
        success: true,
        verified: true,
        data: response.data,
        confidence: 95
      };
      
    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn(`Certificate ${certificateId} not found with issuer ${issuer}`);
        return {
          success: true,
          verified: false,
          message: 'Certificate not found with issuer',
          confidence: 0
        };
      }
      
      logger.error(`Error verifying certificate with ${issuer}:`, error.message);
      return {
        success: false,
        verified: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  /**
   * Get certificates for specific user
   */
  async getUserCertificates(userId, issuer) {
    try {
      logger.info(`Fetching certificates for user ${userId} from ${issuer}`);
      
      const response = await axios.get(
        `${this.baseUrl}/${issuer}/api/certificates`,
        {
          params: { user_id: userId },
          timeout: this.timeout
        }
      );

      return {
        success: true,
        certificates: response.data
      };
      
    } catch (error) {
      logger.error(`Error fetching user certificates from ${issuer}:`, error.message);
      return {
        success: false,
        certificates: [],
        error: error.message
      };
    }
  }

  /**
   * Validate certificate data against mock API
   */
  async validateCertificateData(certificateData) {
    try {
      // Extract potential certificate ID from filename or metadata
      const potentialId = this.extractCertificateId(certificateData);
      
      if (!potentialId) {
        return {
          success: true,
          validated: false,
          message: 'No certificate ID found for validation',
          confidence: 0
        };
      }

      // Try to verify with different issuers
      const issuers = ['MockUdemy', 'MockCoursera', 'NIELIT', 'NSDC'];
      
      for (const issuer of issuers) {
        const result = await this.verifyCertificateWithIssuer(potentialId, issuer);
        
        if (result.verified) {
          return {
            success: true,
            validated: true,
            issuer: issuer,
            data: result.data,
            confidence: result.confidence
          };
        }
      }

      return {
        success: true,
        validated: false,
        message: 'Certificate not found with any known issuer',
        confidence: 0
      };
      
    } catch (error) {
      logger.error('Error validating certificate data:', error.message);
      return {
        success: false,
        validated: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  /**
   * Extract certificate ID from various sources
   */
  extractCertificateId(certificateData) {
    // Try to extract from filename
    if (certificateData.originalName) {
      const matches = certificateData.originalName.match(/([A-Z]+\d+)/);
      if (matches) return matches[1];
    }

    // Try to extract from file content (if available)
    if (certificateData.extractedText) {
      const matches = certificateData.extractedText.match(/Certificate\s+ID[:\s]+([A-Z]+\d+)/i);
      if (matches) return matches[1];
    }

    // Try common patterns
    const commonIds = ['UDEMY001', 'UDEMY002', 'COUR001', 'COUR002', 'NIELIT001', 'NSDC001'];
    
    for (const id of commonIds) {
      if (certificateData.originalName?.includes(id) || 
          certificateData.extractedText?.includes(id)) {
        return id;
      }
    }

    return null;
  }

  /**
   * Get issuer information
   */
  async getIssuerInfo(issuer) {
    try {
      const response = await axios.get(`${this.baseUrl}/${issuer}/info`, {
        timeout: this.timeout
      });
      
      return {
        success: true,
        info: response.data
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for mock API
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/`, {
        timeout: 5000
      });
      
      return {
        status: 'healthy',
        message: response.data
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default new MockApiService();
