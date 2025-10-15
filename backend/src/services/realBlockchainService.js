import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blockchain storage file
const BLOCKCHAIN_FILE = path.resolve(__dirname, '../data/certificateBlockchain.json');

// -------------------
// Real Blockchain Classes (from main(1).js)
// -------------------
class Block {
    constructor(index, timestamp, certificateData, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.certificateData = certificateData;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();

        // Enhanced fields for our system
        this.ncvetVerified = certificateData.ncvetVerified || false;
        this.userId = certificateData.userId || null;
        this.instituteId = certificateData.instituteId || null;
        this.verificationStatus = certificateData.verificationStatus || 'PENDING';
    }

    calculateHash() {
        return crypto.createHash('sha256').update(
            this.index +
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.certificateData)
        ).digest('hex');
    }
}

class CertificateBlockchain {
    constructor() {
        this.chain = [];
        this.loadBlockchain();
        
        // Create genesis block if chain is empty
        if (this.chain.length === 0) {
            this.chain = [this.createGenesisBlock()];
            this.saveBlockchain();
        }
    }

    createGenesisBlock() {
        return new Block(0, new Date().toISOString(), { 
            info: "Skill Vault Max Genesis Block",
            system: "Certificate Verification Platform",
            version: "2.0.0"
        }, "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(certificateData) {
        const newBlock = new Block(
            this.chain.length,
            new Date().toISOString(),
            certificateData,
            this.getLatestBlock().hash
        );
        
        this.chain.push(newBlock);
        this.saveBlockchain();
        
        logger.info(`Added certificate to blockchain: Block #${newBlock.index}, Certificate ID: ${certificateData.credential_id}`);
        
        return {
            success: true,
            blockIndex: newBlock.index,
            blockHash: newBlock.hash,
            timestamp: newBlock.timestamp,
            message: 'Certificate added to blockchain successfully'
        };
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            
            // Verify current block hash
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                logger.error(`Invalid hash at block ${i}`);
                return false;
            }
            
            // Verify chain linkage
            if (currentBlock.previousHash !== previousBlock.hash) {
                logger.error(`Invalid previous hash at block ${i}`);
                return false;
            }
        }
        return true;
    }

    // Find certificate in blockchain
    findCertificate(credentialId) {
        for (let i = 1; i < this.chain.length; i++) {
            const block = this.chain[i];
            if (block.certificateData.credential_id === credentialId) {
                return {
                    found: true,
                    block: block,
                    blockIndex: i,
                    verified: true,
                    timestamp: block.timestamp
                };
            }
        }
        return { found: false };
    }

    // Get all certificates for a user
    getUserCertificates(userId) {
        const userCertificates = [];
        for (let i = 1; i < this.chain.length; i++) {
            const block = this.chain[i];
            if (block.userId === userId || block.certificateData.learner_email === userId) {
                userCertificates.push({
                    blockIndex: i,
                    blockHash: block.hash,
                    timestamp: block.timestamp,
                    certificate: block.certificateData,
                    ncvetVerified: block.ncvetVerified,
                    verificationStatus: block.verificationStatus
                });
            }
        }
        return userCertificates;
    }

    // Get blockchain statistics
    getBlockchainStats() {
        const totalBlocks = this.chain.length;
        const totalCertificates = totalBlocks - 1; // Exclude genesis block
        
        let ncvetCount = 0;
        let nonNcvetCount = 0;
        
        for (let i = 1; i < this.chain.length; i++) {
            if (this.chain[i].ncvetVerified) {
                ncvetCount++;
            } else {
                nonNcvetCount++;
            }
        }

        return {
            totalBlocks,
            totalCertificates,
            ncvetVerified: ncvetCount,
            nonNcvetVerified: nonNcvetCount,
            chainValid: this.isChainValid(),
            lastBlockHash: this.getLatestBlock().hash,
            genesisHash: this.chain[0].hash
        };
    }

    // Load blockchain from file
    loadBlockchain() {
        try {
            if (fs.existsSync(BLOCKCHAIN_FILE)) {
                const data = fs.readFileSync(BLOCKCHAIN_FILE, 'utf8');
                const blockchainData = JSON.parse(data);
                
                // Reconstruct blocks with proper methods
                this.chain = blockchainData.map(blockData => {
                    const block = new Block(
                        blockData.index,
                        blockData.timestamp,
                        blockData.certificateData,
                        blockData.previousHash
                    );
                    // Preserve original hash
                    block.hash = blockData.hash;
                    block.ncvetVerified = blockData.ncvetVerified;
                    block.userId = blockData.userId;
                    block.instituteId = blockData.instituteId;
                    block.verificationStatus = blockData.verificationStatus;
                    return block;
                });
                
                logger.info(`Loaded blockchain with ${this.chain.length} blocks`);
            }
        } catch (error) {
            logger.error('Failed to load blockchain:', error);
            this.chain = [];
        }
    }

    // Save blockchain to file
    saveBlockchain() {
        try {
            const dir = path.dirname(BLOCKCHAIN_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(this.chain, null, 2));
        } catch (error) {
            logger.error('Failed to save blockchain:', error);
        }
    }

    // Validate and repair blockchain if needed
    validateAndRepair() {
        const isValid = this.isChainValid();
        
        if (!isValid) {
            logger.warn('Blockchain validation failed - attempting repair');
            // In a real system, you'd implement repair logic here
            // For now, we'll just log the issue
            return {
                valid: false,
                repaired: false,
                message: 'Blockchain integrity compromised - manual intervention required'
            };
        }

        return {
            valid: true,
            repaired: false,
            message: 'Blockchain is valid and secure'
        };
    }
}

// Singleton instance
const certificateBlockchain = new CertificateBlockchain();

// Service interface
class RealBlockchainService {
    // Add certificate to blockchain
    async addCertificate(certificateData) {
        try {
            // Enhance certificate data for blockchain
            const blockchainData = {
                ...certificateData,
                userId: certificateData.learner_email,
                instituteId: certificateData.issuer,
                ncvetVerified: this.isNCVETInstitute(certificateData.issuer),
                verificationStatus: 'BLOCKCHAIN_VERIFIED',
                addedToBlockchain: new Date().toISOString()
            };

            return certificateBlockchain.addBlock(blockchainData);
        } catch (error) {
            logger.error('Failed to add certificate to blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Verify certificate exists in blockchain
    async verifyCertificate(credentialId) {
        try {
            const result = certificateBlockchain.findCertificate(credentialId);
            
            if (result.found) {
                return {
                    success: true,
                    verified: true,
                    blockchainVerified: true,
                    blockIndex: result.blockIndex,
                    blockHash: result.block.hash,
                    timestamp: result.timestamp,
                    certificate: result.block.certificateData
                };
            } else {
                return {
                    success: true,
                    verified: false,
                    blockchainVerified: false,
                    message: 'Certificate not found in blockchain'
                };
            }
        } catch (error) {
            logger.error('Failed to verify certificate in blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get user's blockchain certificates
    async getUserBlockchainCertificates(userEmail) {
        try {
            const certificates = certificateBlockchain.getUserCertificates(userEmail);
            return {
                success: true,
                certificates,
                count: certificates.length
            };
        } catch (error) {
            logger.error('Failed to get user blockchain certificates:', error);
            return {
                success: false,
                error: error.message,
                certificates: []
            };
        }
    }

    // Get blockchain statistics
    async getBlockchainStats() {
        try {
            const stats = certificateBlockchain.getBlockchainStats();
            return {
                success: true,
                ...stats
            };
        } catch (error) {
            logger.error('Failed to get blockchain stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Validate blockchain integrity
    async validateBlockchain() {
        try {
            const validation = certificateBlockchain.validateAndRepair();
            return {
                success: true,
                ...validation
            };
        } catch (error) {
            logger.error('Failed to validate blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper to determine if institute is NCVET
    isNCVETInstitute(instituteId) {
        const ncvetInstitutes = ['AICTE', 'ESSCI', 'ASDC', 'BFSI', 'FUTURESKILL', 'NCCT', 'UNIVERSITY'];
        return ncvetInstitutes.includes(instituteId.toUpperCase());
    }
}

export default new RealBlockchainService();
