import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock blockchain data file
const BLOCKCHAIN_DATA_FILE = path.resolve(__dirname, '../data/mockBlockchain.json');

class MockBlockchain {
  constructor() {
    this.blocks = [];
    this.difficulty = 2; // Number of leading zeros required in hash
    this.miningReward = 100;
    this.pendingTransactions = [];
    this.loadBlockchain();
  }

  // Load blockchain from file
  loadBlockchain() {
    try {
      if (fs.existsSync(BLOCKCHAIN_DATA_FILE)) {
        const data = fs.readFileSync(BLOCKCHAIN_DATA_FILE, 'utf8');
        const blockchainData = JSON.parse(data);
        this.blocks = blockchainData.blocks || [];
        this.pendingTransactions = blockchainData.pendingTransactions || [];
        
        // If no blocks exist, create genesis block
        if (this.blocks.length === 0) {
          this.createGenesisBlock();
        }
      } else {
        this.createGenesisBlock();
      }
    } catch (error) {
      logger.error('Failed to load blockchain:', error);
      this.createGenesisBlock();
    }
  }

  // Save blockchain to file
  saveBlockchain() {
    try {
      const dir = path.dirname(BLOCKCHAIN_DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const blockchainData = {
        blocks: this.blocks,
        pendingTransactions: this.pendingTransactions,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(BLOCKCHAIN_DATA_FILE, JSON.stringify(blockchainData, null, 2));
    } catch (error) {
      logger.error('Failed to save blockchain:', error);
    }
  }

  // Create the genesis block
  createGenesisBlock() {
    const genesisBlock = new Block(0, new Date().toISOString(), [], '0');
    genesisBlock.hash = genesisBlock.calculateHash();
    this.blocks = [genesisBlock];
    this.saveBlockchain();
    logger.info('Genesis block created');
  }

  // Get the latest block
  getLatestBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  // Add a new transaction to pending transactions
  createTransaction(transaction) {
    // Validate transaction
    if (!transaction.certificateId || !transaction.certificateHash) {
      throw new Error('Transaction must include certificateId and certificateHash');
    }

    // Add timestamp and transaction ID
    transaction.timestamp = new Date().toISOString();
    transaction.transactionId = this.generateTransactionId();
    transaction.status = 'pending';

    this.pendingTransactions.push(transaction);
    this.saveBlockchain();

    logger.info(`Transaction created: ${transaction.transactionId}`);
    return transaction;
  }

  // Mine pending transactions (create a new block)
  minePendingTransactions(miningRewardAddress = 'system') {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    // Add mining reward transaction
    const rewardTransaction = {
      transactionId: this.generateTransactionId(),
      type: 'mining_reward',
      amount: this.miningReward,
      to: miningRewardAddress,
      timestamp: new Date().toISOString(),
      status: 'confirmed'
    };

    const transactions = [...this.pendingTransactions, rewardTransaction];

    // Create new block
    const block = new Block(
      this.blocks.length,
      new Date().toISOString(),
      transactions,
      this.getLatestBlock().hash
    );

    // Mine the block
    block.mineBlock(this.difficulty);

    // Add block to chain
    this.blocks.push(block);

    // Mark transactions as confirmed
    this.pendingTransactions.forEach(tx => {
      tx.status = 'confirmed';
      tx.blockNumber = block.index;
      tx.blockHash = block.hash;
    });

    // Clear pending transactions
    this.pendingTransactions = [];
    this.saveBlockchain();

    logger.info(`Block mined: ${block.index} with ${transactions.length} transactions`);
    return block;
  }

  // Get balance for an address (for mining rewards)
  getBalance(address) {
    let balance = 0;

    for (const block of this.blocks) {
      for (const transaction of block.transactions) {
        if (transaction.from === address) {
          balance -= transaction.amount || 0;
        }
        if (transaction.to === address) {
          balance += transaction.amount || 0;
        }
      }
    }

    return balance;
  }

  // Verify certificate on blockchain
  verifyCertificateOnBlockchain(certificateHash) {
    for (const block of this.blocks) {
      for (const transaction of block.transactions) {
        if (transaction.certificateHash === certificateHash) {
          return {
            verified: true,
            blockNumber: block.index,
            blockHash: block.hash,
            transactionId: transaction.transactionId,
            timestamp: transaction.timestamp,
            confirmations: this.blocks.length - block.index
          };
        }
      }
    }

    return {
      verified: false,
      message: 'Certificate not found on blockchain'
    };
  }

  // Get transaction by ID
  getTransaction(transactionId) {
    for (const block of this.blocks) {
      for (const transaction of block.transactions) {
        if (transaction.transactionId === transactionId) {
          return {
            ...transaction,
            blockNumber: block.index,
            blockHash: block.hash,
            confirmations: this.blocks.length - block.index
          };
        }
      }
    }

    // Check pending transactions
    const pendingTx = this.pendingTransactions.find(tx => tx.transactionId === transactionId);
    if (pendingTx) {
      return {
        ...pendingTx,
        confirmations: 0
      };
    }

    return null;
  }

  // Get block by number
  getBlock(blockNumber) {
    return this.blocks[blockNumber] || null;
  }

  // Get blockchain statistics
  getStats() {
    const totalTransactions = this.blocks.reduce((total, block) => 
      total + block.transactions.length, 0
    );

    const certificateTransactions = this.blocks.reduce((total, block) => 
      total + block.transactions.filter(tx => tx.type === 'certificate_store').length, 0
    );

    return {
      totalBlocks: this.blocks.length,
      totalTransactions,
      certificateTransactions,
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      latestBlock: this.getLatestBlock()
    };
  }

  // Validate blockchain integrity
  isChainValid() {
    for (let i = 1; i < this.blocks.length; i++) {
      const currentBlock = this.blocks[i];
      const previousBlock = this.blocks[i - 1];

      // Check if current block hash is valid
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return {
          valid: false,
          error: `Invalid hash at block ${i}`
        };
      }

      // Check if current block points to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          valid: false,
          error: `Invalid previous hash at block ${i}`
        };
      }
    }

    return { valid: true };
  }

  // Generate unique transaction ID
  generateTransactionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Search transactions by certificate ID
  searchByCertificateId(certificateId) {
    const results = [];

    for (const block of this.blocks) {
      for (const transaction of block.transactions) {
        if (transaction.certificateId === certificateId) {
          results.push({
            ...transaction,
            blockNumber: block.index,
            blockHash: block.hash,
            confirmations: this.blocks.length - block.index
          });
        }
      }
    }

    return results;
  }
}

// Block class
class Block {
  constructor(index, timestamp, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  // Calculate hash for this block
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
      )
      .digest('hex');
  }

  // Mine block (proof of work)
  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    logger.info(`Block mined: ${this.hash} (nonce: ${this.nonce})`);
  }
}

// Singleton instance
const mockBlockchain = new MockBlockchain();

// API functions
export const storeCertificateOnBlockchain = async (certificateData) => {
  try {
    const transaction = {
      type: 'certificate_store',
      certificateId: certificateData.certificateId,
      certificateHash: certificateData.certificateHash,
      learnerId: certificateData.learnerId,
      issuer: certificateData.issuer,
      title: certificateData.title,
      metadata: {
        nsqfLevel: certificateData.nsqfLevel,
        skillAreas: certificateData.skillAreas,
        category: certificateData.category
      }
    };

    const createdTransaction = mockBlockchain.createTransaction(transaction);

    // Auto-mine for demo purposes (in real blockchain, this would be done by miners)
    setTimeout(() => {
      mockBlockchain.minePendingTransactions();
    }, 1000);

    return {
      success: true,
      transactionId: createdTransaction.transactionId,
      status: 'pending',
      message: 'Certificate stored on blockchain (pending confirmation)'
    };
  } catch (error) {
    logger.error('Blockchain storage error:', error);
    throw error;
  }
};

export const verifyCertificateOnBlockchain = async (certificateHash) => {
  try {
    return mockBlockchain.verifyCertificateOnBlockchain(certificateHash);
  } catch (error) {
    logger.error('Blockchain verification error:', error);
    throw error;
  }
};

export const getBlockchainTransaction = async (transactionId) => {
  try {
    return mockBlockchain.getTransaction(transactionId);
  } catch (error) {
    logger.error('Get transaction error:', error);
    throw error;
  }
};

export const getBlockchainStats = async () => {
  try {
    return mockBlockchain.getStats();
  } catch (error) {
    logger.error('Get blockchain stats error:', error);
    throw error;
  }
};

export const validateBlockchain = async () => {
  try {
    return mockBlockchain.isChainValid();
  } catch (error) {
    logger.error('Blockchain validation error:', error);
    throw error;
  }
};

export const searchCertificateTransactions = async (certificateId) => {
  try {
    return mockBlockchain.searchByCertificateId(certificateId);
  } catch (error) {
    logger.error('Search transactions error:', error);
    throw error;
  }
};

export default {
  storeCertificateOnBlockchain,
  verifyCertificateOnBlockchain,
  getBlockchainTransaction,
  getBlockchainStats,
  validateBlockchain,
  searchCertificateTransactions
};
