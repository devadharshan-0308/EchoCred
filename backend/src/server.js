import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import { helmetConfig, corsOptions, compressionConfig, mongoSanitizeConfig } from './config/security.js';
import { globalRateLimit } from './config/rateLimit.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import employerRoutes from './routes/employerRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
// Legacy routes (commented out - not needed)
// import userRoutes from './routes/userRoutes.js';
// import microcredRoutes from './routes/microcredRoutes.js';
import instituteRoutes from './routes/instituteRoutes.js';
import blockchainRoutes from './routes/blockchainRoutes.js';
import certificateDownloadRoutes from './routes/certificateDownloadRoutes.js';
import testAuthRoutes from './routes/testAuthRoutes.js';
import skillVaultApiRoutes from './routes/skillVaultApiRoutes.js';
import simpleCredentialRoutes from './routes/simpleCredentialRoutes.js';
import improvedCredentialRoutes from './routes/improvedCredentialRoutes.js';
import debugRoutes from './routes/debugRoutes.js';

// Import services for initialization
import simpleVerificationService from './services/simpleVerificationService.js';
import nsqfService from './services/nsqfService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(compressionConfig);
app.use(mongoSanitizeConfig);

// Rate limiting
app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      blockchain: 'mock',
      verification: 'active',
      nsqf: 'active'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/certificates', certificateDownloadRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/test-auth', testAuthRoutes);
app.use('/api/skill-vault-api', skillVaultApiRoutes);
app.use('/api/simple', simpleCredentialRoutes);
app.use('/api/credentials', improvedCredentialRoutes);
app.use('/api/debug', debugRoutes);

// Legacy routes (commented out - not needed)
// app.use('/api/users', userRoutes);
// app.use('/api/microcreds', microcredRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Skill Vault Max API',
    version: '2.0.0',
    description: 'Enterprise-grade micro-credentials verification platform',
    endpoints: {
      authentication: '/api/auth',
      certificates: '/api/certificates',
      employer: '/api/employer',
      verification: '/api/verify',
      institutes: '/api/institutes',
      blockchain: '/api/blockchain',
      health: '/health'
    },
    features: [
      'JWT Authentication',
      'Role-based Access Control',
      'Enhanced Blockchain Simulation',
      'NSQF Compliance & Mapping',
      'Institute API Integration',
      'NCVET vs Non-NCVET Differentiation',
      'DigiLocker Simulation',
      'Comprehensive Verification',
      'Employer Portal',
      'Tamper-Proof Credential Storage'
    ]
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server after database connection
const initializeServer = async () => {
  await startServer();
  
  app.listen(PORT, () => {
    logger.info(`🚀 Skill Vault Max Enterprise Backend v2.0.0`);
    logger.info(`🌐 Server running on port ${PORT}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🗄️ Database: MongoDB Atlas Cloud`);
  });
};

initializeServer().catch(error => {
  logger.error('Failed to initialize server:', error);
  process.exit(1);
});
