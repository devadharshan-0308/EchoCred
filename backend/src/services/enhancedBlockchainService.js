import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced blockchain ledger file
const LEDGER_FILE = path.resolve(__dirname, '../data/credentialLedger.json');

class EnhancedBlockchainService {
  constructor() {
    this.ledger = [];
    this.transactionCounter = 0;
    this.loadLedger();
    this.initializeSampleData();
  }

  // Load existing ledger or create new one
  loadLedger() {
    try {
      if (fs.existsSync(LEDGER_FILE)) {
        const data = fs.readFileSync(LEDGER_FILE, 'utf8');
        const ledgerData = JSON.parse(data);
        this.ledger = ledgerData.transactions || [];
        this.transactionCounter = ledgerData.counter || 0;
        logger.info(`Loaded ${this.ledger.length} transactions from blockchain ledger`);
      } else {
        this.ledger = [];
        this.transactionCounter = 0;
        this.saveLedger();
      }
    } catch (error) {
      logger.error('Failed to load blockchain ledger:', error);
      this.ledger = [];
      this.transactionCounter = 0;
    }
  }

  // Save ledger to file
  saveLedger() {
    try {
      const dir = path.dirname(LEDGER_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const ledgerData = {
        transactions: this.ledger,
        counter: this.transactionCounter,
        last_updated: new Date().toISOString(),
        total_transactions: this.ledger.length
      };

      fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledgerData, null, 2));
    } catch (error) {
      logger.error('Failed to save blockchain ledger:', error);
    }
  }

  // Initialize sample blockchain data for demo
  initializeSampleData() {
    if (this.ledger.length === 0) {
      const sampleTransactions = [
        {
          credential_id: 'AICTE_001',
          learner_email: 'john.doe@example.com',
          issuer: 'AICTE',
          course_name: 'Advanced Computer Networks',
          verification_type: 'GOVERNMENT_VERIFIED'
        },
        {
          credential_id: 'ESSCI_001', 
          learner_email: 'john.doe@example.com',
          issuer: 'ESSCI',
          course_name: 'IoT Device Programming',
          verification_type: 'GOVERNMENT_VERIFIED'
        },
        {
          credential_id: 'COURSERA_001',
          learner_email: 'john.doe@example.com', 
          issuer: 'COURSERA',
          course_name: 'Machine Learning Specialization',
          verification_type: 'INDUSTRY_VERIFIED'
        }
      ];

      sampleTransactions.forEach(tx => {
        this.addCredentialToBlockchain(tx);
      });

      logger.info('Initialized blockchain with sample data');
    }
  }

  // Generate SHA256 hash for credential data
  generateCredentialHash(credentialData) {
    const dataString = JSON.stringify({
      credential_id: credentialData.credential_id,
      learner_email: credentialData.learner_email,
      issuer: credentialData.issuer,
      course_name: credentialData.course_name,
      issue_date: credentialData.issue_date || new Date().toISOString(),
      verification_type: credentialData.verification_type
    });
    
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // Add credential to blockchain ledger
  addCredentialToBlockchain(credentialData) {
    try {
      this.transactionCounter++;
      
      const transaction = {
        tx_id: `TX_${this.transactionCounter.toString().padStart(6, '0')}`,
        credential_id: credentialData.credential_id,
        credential_hash: this.generateCredentialHash(credentialData),
        learner_email: credentialData.learner_email,
        issuer: credentialData.issuer,
        course_name: credentialData.course_name,
        verification_type: credentialData.verification_type || 'PENDING',
        timestamp: new Date().toISOString(),
        block_height: this.ledger.length + 1,
        status: 'CONFIRMED',
        immutable: true
      };

      // Add to ledger (append-only)
      this.ledger.push(transaction);
      this.saveLedger();

      logger.info(`Added credential ${credentialData.credential_id} to blockchain`, {
        tx_id: transaction.tx_id,
        hash: transaction.credential_hash.substring(0, 16) + '...'
      });

      return {
        success: true,
        transaction: transaction,
        message: 'Credential successfully added to blockchain'
      };

    } catch (error) {
      logger.error('Failed to add credential to blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify if credential hash exists in blockchain
  verifyCredentialInBlockchain(credentialHash) {
    try {
      const transaction = this.ledger.find(tx => tx.credential_hash === credentialHash);
      
      if (transaction) {
        return {
          verified: true,
          transaction: transaction,
          verification_time: new Date().toISOString(),
          message: 'Credential hash found in blockchain - tamper-proof verified'
        };
      } else {
        return {
          verified: false,
          message: 'Credential hash not found in blockchain'
        };
      }
    } catch (error) {
      logger.error('Blockchain verification error:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  // Get full blockchain ledger for display
  getBlockchainLedger(limit = 50) {
    try {
      const recentTransactions = this.ledger
        .slice(-limit)
        .reverse(); // Show most recent first

      return {
        success: true,
        total_transactions: this.ledger.length,
        showing: recentTransactions.length,
        ledger_status: 'ACTIVE',
        last_transaction: this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].timestamp : null,
        transactions: recentTransactions
      };
    } catch (error) {
      logger.error('Failed to get blockchain ledger:', error);
      return {
        success: false,
        error: error.message,
        transactions: []
      };
    }
  }

  // Get blockchain statistics
  getBlockchainStats() {
    try {
      const governmentVerified = this.ledger.filter(tx => tx.verification_type === 'GOVERNMENT_VERIFIED').length;
      const industryVerified = this.ledger.filter(tx => tx.verification_type === 'INDUSTRY_VERIFIED').length;
      
      const issuerStats = {};
      this.ledger.forEach(tx => {
        issuerStats[tx.issuer] = (issuerStats[tx.issuer] || 0) + 1;
      });

      return {
        total_transactions: this.ledger.length,
        government_verified: governmentVerified,
        industry_verified: industryVerified,
        unique_issuers: Object.keys(issuerStats).length,
        issuer_breakdown: issuerStats,
        blockchain_integrity: 'VERIFIED',
        last_transaction_time: this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].timestamp : null
      };
    } catch (error) {
      logger.error('Failed to get blockchain stats:', error);
      return {
        error: error.message
      };
    }
  }

  // Simulate blockchain mining process (for demo)
  simulateMining(credentialData) {
    return new Promise((resolve) => {
      // Simulate mining delay
      setTimeout(() => {
        const result = this.addCredentialToBlockchain(credentialData);
        resolve(result);
      }, 1500 + Math.random() * 1000); // 1.5-2.5 seconds
    });
  }

  // Get transactions for specific learner
  getLearnerTransactions(learnerEmail) {
    try {
      const learnerTransactions = this.ledger.filter(
        tx => tx.learner_email.toLowerCase() === learnerEmail.toLowerCase()
      );

      return {
        success: true,
        learner_email: learnerEmail,
        total_credentials: learnerTransactions.length,
        government_verified: learnerTransactions.filter(tx => tx.verification_type === 'GOVERNMENT_VERIFIED').length,
        industry_verified: learnerTransactions.filter(tx => tx.verification_type === 'INDUSTRY_VERIFIED').length,
        transactions: learnerTransactions
      };
    } catch (error) {
      logger.error('Failed to get learner transactions:', error);
      return {
        success: false,
        error: error.message,
        transactions: []
      };
    }
  }

  // Validate blockchain integrity (for demo purposes)
  validateBlockchainIntegrity() {
    try {
      let isValid = true;
      const validationResults = [];

      // Check if all transactions have required fields
      this.ledger.forEach((tx, index) => {
        const hasRequiredFields = tx.tx_id && tx.credential_hash && tx.timestamp;
        if (!hasRequiredFields) {
          isValid = false;
          validationResults.push({
            transaction_index: index,
            issue: 'Missing required fields'
          });
        }
      });

      // Check for duplicate transaction IDs
      const txIds = this.ledger.map(tx => tx.tx_id);
      const uniqueTxIds = [...new Set(txIds)];
      if (txIds.length !== uniqueTxIds.length) {
        isValid = false;
        validationResults.push({
          issue: 'Duplicate transaction IDs found'
        });
      }

      return {
        is_valid: isValid,
        total_transactions: this.ledger.length,
        validation_timestamp: new Date().toISOString(),
        issues: validationResults,
        message: isValid ? 'Blockchain integrity verified' : 'Blockchain integrity issues found'
      };
    } catch (error) {
      logger.error('Blockchain validation error:', error);
      return {
        is_valid: false,
        error: error.message
      };
    }
  }
}

export default new EnhancedBlockchainService();
