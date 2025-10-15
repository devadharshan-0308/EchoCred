import mongoose from 'mongoose';

const issuerSchema = new mongoose.Schema({
  // Basic issuer information
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  organizationType: {
    type: String,
    required: [true, 'Organization type is required'],
    enum: ['university', 'training_provider', 'certification_body', 'government', 'corporate']
  },
  
  // Contact information
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: String,
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  
  // API configuration
  apiEndpoint: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid API endpoint URL']
  },
  apiKey: String,
  apiVersion: {
    type: String,
    default: 'v1'
  },
  
  // Cryptographic keys
  publicKey: {
    type: String,
    required: [true, 'Public key is required for certificate verification']
  },
  keyAlgorithm: {
    type: String,
    default: 'RSA-SHA256'
  },
  keyFingerprint: String,
  
  // Verification and accreditation
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'suspended', 'revoked'],
    default: 'pending'
  },
  accreditations: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateNumber: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Compliance and standards
  nsqfCompliant: {
    type: Boolean,
    default: false
  },
  supportedNSQFLevels: [{
    type: Number,
    min: 1,
    max: 10
  }],
  qualityAssurance: {
    iso21001: Boolean,
    naac: String, // NAAC grade
    nba: Boolean,
    other: [String]
  },
  
  // Statistics and metrics
  totalCertificatesIssued: {
    type: Number,
    default: 0
  },
  activeCertificates: {
    type: Number,
    default: 0
  },
  revokedCertificates: {
    type: Number,
    default: 0
  },
  
  // Integration settings
  integrationSettings: {
    autoVerification: {
      type: Boolean,
      default: false
    },
    batchProcessing: {
      type: Boolean,
      default: false
    },
    webhookUrl: String,
    syncFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    }
  },
  
  // Blockchain settings
  blockchainSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'mock'],
      default: 'mock'
    },
    contractAddress: String,
    gasLimit: Number
  },
  
  // Metadata
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  logo: String,
  establishedYear: Number,
  studentCount: Number,
  facultyCount: Number,
  
  // Status and activity
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncDate: Date,
  lastActivityDate: Date,
  
  // Admin fields
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
issuerSchema.index({ organizationName: 1 });
issuerSchema.index({ organizationType: 1 });
issuerSchema.index({ verificationStatus: 1 });
issuerSchema.index({ 'contactInfo.email': 1 });
issuerSchema.index({ nsqfCompliant: 1 });
issuerSchema.index({ isActive: 1 });

// Virtual for active accreditations
issuerSchema.virtual('activeAccreditations').get(function() {
  return this.accreditations.filter(acc => 
    acc.isActive && (!acc.expiryDate || acc.expiryDate > new Date())
  );
});

// Virtual for verification status display
issuerSchema.virtual('isVerified').get(function() {
  return this.verificationStatus === 'verified';
});

// Pre-save middleware
issuerSchema.pre('save', function(next) {
  // Generate key fingerprint if public key is provided
  if (this.isModified('publicKey') && this.publicKey) {
    // Simple fingerprint generation (in production, use proper crypto)
    this.keyFingerprint = Buffer.from(this.publicKey).toString('base64').slice(0, 16);
  }
  
  // Update last activity date
  this.lastActivityDate = new Date();
  
  next();
});

// Static methods
issuerSchema.statics.findVerified = function() {
  return this.find({ 
    verificationStatus: 'verified', 
    isActive: true 
  });
};

issuerSchema.statics.findByType = function(organizationType) {
  return this.find({ 
    organizationType, 
    verificationStatus: 'verified',
    isActive: true 
  });
};

issuerSchema.statics.findNSQFCompliant = function() {
  return this.find({ 
    nsqfCompliant: true,
    verificationStatus: 'verified',
    isActive: true 
  });
};

// Instance methods
issuerSchema.methods.addAccreditation = function(accreditation) {
  this.accreditations.push(accreditation);
  return this.save();
};

issuerSchema.methods.revokeAccreditation = function(accreditationId) {
  const accreditation = this.accreditations.id(accreditationId);
  if (accreditation) {
    accreditation.isActive = false;
    return this.save();
  }
  throw new Error('Accreditation not found');
};

issuerSchema.methods.updateCertificateCount = function(issued = 0, revoked = 0) {
  this.totalCertificatesIssued += issued;
  this.revokedCertificates += revoked;
  this.activeCertificates = this.totalCertificatesIssued - this.revokedCertificates;
  return this.save();
};

const Issuer = mongoose.model('Issuer', issuerSchema);

export default Issuer;
