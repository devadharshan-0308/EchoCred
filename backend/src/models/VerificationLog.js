import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  // Certificate and user information
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    required: [true, 'Certificate ID is required']
  },
  verifierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Verifier ID is required']
  },
  verifierType: {
    type: String,
    enum: ['learner', 'employer', 'issuer', 'admin', 'public'],
    required: [true, 'Verifier type is required']
  },
  
  // Verification details
  verificationType: {
    type: String,
    enum: ['manual', 'api', 'blockchain', 'qr_scan', 'bulk', 'automated'],
    required: [true, 'Verification type is required']
  },
  verificationMethod: {
    type: String,
    enum: ['digital_signature', 'blockchain_hash', 'issuer_api', 'qr_code', 'manual_review'],
    required: [true, 'Verification method is required']
  },
  
  // Results
  verificationResult: {
    type: String,
    enum: ['verified', 'failed', 'pending', 'expired', 'revoked', 'suspicious'],
    required: [true, 'Verification result is required']
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Detailed verification data
  verificationData: {
    // Digital signature verification
    signatureValid: Boolean,
    signatureAlgorithm: String,
    publicKeyFingerprint: String,
    
    // Blockchain verification
    blockchainTxHash: String,
    blockchainConfirmations: Number,
    blockchainNetwork: String,
    
    // API verification
    issuerApiResponse: mongoose.Schema.Types.Mixed,
    issuerApiStatus: String,
    
    // QR code verification
    qrCodeValid: Boolean,
    qrCodeData: String,
    
    // File integrity
    fileHashMatch: Boolean,
    originalHash: String,
    currentHash: String,
    
    // Metadata checks
    metadataValid: Boolean,
    expiryCheck: Boolean,
    revocationCheck: Boolean
  },
  
  // Request information
  requestInfo: {
    ipAddress: String,
    userAgent: String,
    requestId: String,
    sessionId: String,
    referrer: String,
    geolocation: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  
  // Processing information
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  errorDetails: {
    errorCode: String,
    errorMessage: String,
    stackTrace: String
  },
  
  // Compliance and audit
  complianceFlags: [{
    flag: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String
  }],
  auditTrail: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String
  }],
  
  // Analytics and reporting
  verificationPurpose: {
    type: String,
    enum: ['employment', 'education', 'licensing', 'compliance', 'personal', 'other']
  },
  businessContext: String,
  
  // Status and metadata
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'failed', 'cancelled'],
    default: 'completed'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  retentionDate: Date, // When this log should be deleted for privacy
  
  // Notifications
  notificationsSent: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'webhook']
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'pending']
    },
    sentAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and analytics
verificationLogSchema.index({ certificateId: 1, createdAt: -1 });
verificationLogSchema.index({ verifierId: 1, createdAt: -1 });
verificationLogSchema.index({ verificationResult: 1 });
verificationLogSchema.index({ verificationType: 1 });
verificationLogSchema.index({ verifierType: 1 });
verificationLogSchema.index({ createdAt: -1 });
verificationLogSchema.index({ 'requestInfo.ipAddress': 1 });
verificationLogSchema.index({ retentionDate: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for success rate
verificationLogSchema.virtual('isSuccessful').get(function() {
  return this.verificationResult === 'verified';
});

// Virtual for verification summary
verificationLogSchema.virtual('summary').get(function() {
  return {
    result: this.verificationResult,
    confidence: this.confidenceScore,
    method: this.verificationMethod,
    processingTime: this.processingTime
  };
});

// Pre-save middleware
verificationLogSchema.pre('save', function(next) {
  // Set retention date based on compliance requirements
  if (!this.retentionDate) {
    // Default retention: 7 years for compliance
    this.retentionDate = new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000);
  }
  
  // Calculate confidence score based on verification data
  if (!this.confidenceScore) {
    this.confidenceScore = this.calculateConfidenceScore();
  }
  
  next();
});

// Instance methods
verificationLogSchema.methods.calculateConfidenceScore = function() {
  let score = 0;
  const data = this.verificationData;
  
  if (data.signatureValid) score += 30;
  if (data.blockchainTxHash) score += 25;
  if (data.issuerApiResponse && data.issuerApiStatus === 'verified') score += 20;
  if (data.qrCodeValid) score += 15;
  if (data.fileHashMatch) score += 10;
  
  return Math.min(score, 100);
};

verificationLogSchema.methods.addAuditEntry = function(action, performedBy, details) {
  this.auditTrail.push({
    action,
    performedBy,
    details,
    timestamp: new Date()
  });
  return this.save();
};

verificationLogSchema.methods.addComplianceFlag = function(flag, severity, description) {
  this.complianceFlags.push({
    flag,
    severity,
    description
  });
  return this.save();
};

// Static methods
verificationLogSchema.statics.getVerificationStats = function(dateRange = {}) {
  const matchStage = {};
  
  if (dateRange.start || dateRange.end) {
    matchStage.createdAt = {};
    if (dateRange.start) matchStage.createdAt.$gte = dateRange.start;
    if (dateRange.end) matchStage.createdAt.$lte = dateRange.end;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$verificationResult',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidenceScore' },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
};

verificationLogSchema.statics.getVerificationTrends = function(period = 'daily') {
  const groupBy = period === 'daily' 
    ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
    : { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  
  return this.aggregate([
    {
      $group: {
        _id: groupBy,
        totalVerifications: { $sum: 1 },
        successfulVerifications: {
          $sum: { $cond: [{ $eq: ['$verificationResult', 'verified'] }, 1, 0] }
        },
        avgConfidence: { $avg: '$confidenceScore' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

verificationLogSchema.statics.findSuspiciousActivity = function() {
  return this.find({
    $or: [
      { confidenceScore: { $lt: 50 } },
      { verificationResult: 'suspicious' },
      { 'complianceFlags.severity': 'critical' }
    ]
  }).populate('certificateId verifierId');
};

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);

export default VerificationLog;
