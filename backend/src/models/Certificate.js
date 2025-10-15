import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  // Basic certificate information
  title: {
    type: String,
    required: [true, 'Certificate title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // File information
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  
  // Certificate hash for blockchain verification
  certificateHash: {
    type: String,
    required: [true, 'Certificate hash is required'],
    unique: true
  },
  
  // Ownership and issuer information
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Learner ID is required']
  },
  issuerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isExternal; }
  },
  issuerName: {
    type: String,
    required: [true, 'Issuer name is required'],
    trim: true
  },
  
  // External certificate information
  isExternal: {
    type: Boolean,
    default: false
  },
  externalId: {
    type: String,
    sparse: true // Allows multiple null values but unique non-null values
  },
  source: {
    type: String,
    enum: ['upload', 'MockUdemy', 'MockCoursera', 'DigiLocker', 'SkillIndia', 'NSDC'],
    default: 'upload'
  },
  
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'revoked'],
    default: 'pending'
  },
  verificationReport: {
    type: String,
    default: ''
  },
  verificationDate: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Blockchain information
  blockchainTxHash: String,
  blockchainBlockNumber: Number,
  blockchainNetwork: {
    type: String,
    default: 'mock'
  },
  
  // Digital signature information
  digitalSignature: {
    signature: String,
    algorithm: {
      type: String,
      default: 'RSA-SHA256'
    },
    publicKey: String,
    isValid: {
      type: Boolean,
      default: false
    }
  },
  
  // QR code information
  qrCode: {
    data: String,
    image: String, // Base64 encoded QR code image
    isValid: {
      type: Boolean,
      default: false
    }
  },
  
  // NSQF information
  nsqfLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  nsqfCredits: Number,
  skillAreas: [String],
  
  // Course/Program information
  courseDetails: {
    courseName: String,
    courseCode: String,
    duration: String,
    completionDate: Date,
    grade: String,
    credits: Number
  },
  
  // Metadata
  tags: [String],
  category: {
    type: String,
    enum: ['academic', 'professional', 'skill', 'certification', 'license']
  },
  expiryDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: false
  },
  shareableLink: String,
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  verificationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
certificateSchema.index({ learnerId: 1, createdAt: -1 });
certificateSchema.index({ issuerId: 1 });
certificateSchema.index({ certificateHash: 1 });
certificateSchema.index({ verificationStatus: 1 });
certificateSchema.index({ externalId: 1, source: 1 });
certificateSchema.index({ nsqfLevel: 1 });
certificateSchema.index({ category: 1 });
certificateSchema.index({ tags: 1 });
certificateSchema.index({ 'courseDetails.courseName': 'text', title: 'text', description: 'text' });

// Virtual for verification status display
certificateSchema.virtual('isVerified').get(function() {
  return this.verificationStatus === 'verified';
});

// Virtual for expiry status
certificateSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Pre-save middleware
certificateSchema.pre('save', function(next) {
  // Generate shareable link if public
  if (this.isPublic && !this.shareableLink) {
    this.shareableLink = `${process.env.FRONTEND_URL}/verify/${this._id}`;
  }
  
  // Set verification date when status changes to verified
  if (this.isModified('verificationStatus') && this.verificationStatus === 'verified') {
    this.verificationDate = new Date();
  }
  
  next();
});

// Static methods
certificateSchema.statics.findByLearner = function(learnerId, options = {}) {
  const query = { learnerId, isActive: true };
  
  if (options.verified) {
    query.verificationStatus = 'verified';
  }
  
  return this.find(query)
    .populate('issuerId', 'firstName lastName issuerProfile.organizationName')
    .sort({ createdAt: -1 });
};

certificateSchema.statics.findByIssuer = function(issuerId, options = {}) {
  const query = { issuerId, isActive: true };
  
  return this.find(query)
    .populate('learnerId', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

certificateSchema.statics.searchCertificates = function(searchTerm, options = {}) {
  const query = {
    isActive: true,
    $text: { $search: searchTerm }
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.nsqfLevel) {
    query.nsqfLevel = options.nsqfLevel;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Instance methods
certificateSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

certificateSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

certificateSchema.methods.incrementVerification = function() {
  this.verificationCount += 1;
  return this.save();
};

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
