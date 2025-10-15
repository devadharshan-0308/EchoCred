import mongoose from 'mongoose';

const nsqfMapSchema = new mongoose.Schema({
  // NSQF Level Information
  nsqfLevel: {
    type: Number,
    required: [true, 'NSQF level is required'],
    min: 1,
    max: 10,
    unique: true
  },
  levelName: {
    type: String,
    required: [true, 'Level name is required'],
    trim: true
  },
  levelDescription: {
    type: String,
    required: [true, 'Level description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Educational Equivalence
  educationalEquivalence: {
    formal: {
      type: String,
      required: [true, 'Formal education equivalence is required']
    },
    vocational: String,
    professional: String
  },
  
  // Credit Framework
  creditFramework: {
    minimumCredits: {
      type: Number,
      required: [true, 'Minimum credits required']
    },
    maximumCredits: Number,
    creditType: {
      type: String,
      enum: ['academic', 'vocational', 'professional', 'skill'],
      default: 'vocational'
    }
  },
  
  // Learning Outcomes
  learningOutcomes: {
    knowledge: [{
      outcome: String,
      description: String,
      assessmentCriteria: [String]
    }],
    skills: [{
      skillType: {
        type: String,
        enum: ['cognitive', 'psychomotor', 'affective', 'technical', 'soft']
      },
      skillName: String,
      proficiencyLevel: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced', 'expert']
      },
      description: String
    }],
    competencies: [{
      competencyName: String,
      competencyCode: String,
      description: String,
      assessmentMethods: [String]
    }]
  },
  
  // Industry Alignment
  industryAlignment: [{
    industryName: String,
    sectorSkillCouncil: String,
    jobRoles: [String],
    occupationCodes: [String], // NOC codes
    salaryRange: {
      minimum: Number,
      maximum: Number,
      currency: {
        type: String,
        default: 'INR'
      }
    }
  }],
  
  // Progression Pathways
  progressionPathways: {
    verticalProgression: [{
      toLevel: Number,
      requirements: [String],
      bridgingPrograms: [String]
    }],
    horizontalProgression: [{
      toSector: String,
      requirements: [String],
      recognitionOfPriorLearning: Boolean
    }],
    lateralEntry: [{
      fromQualification: String,
      entryRequirements: [String],
      creditTransfer: Number
    }]
  },
  
  // Assessment Framework
  assessmentFramework: {
    assessmentMethods: [{
      method: {
        type: String,
        enum: ['written', 'practical', 'oral', 'project', 'portfolio', 'simulation']
      },
      weightage: Number,
      description: String
    }],
    passingCriteria: {
      minimumScore: Number,
      gradingSystem: String,
      retakePolicy: String
    },
    certificationRequirements: [String]
  },
  
  // Quality Assurance
  qualityAssurance: {
    accreditationBodies: [String],
    qualityIndicators: [{
      indicator: String,
      benchmark: String,
      measurementMethod: String
    }],
    reviewCycle: {
      type: String,
      enum: ['annual', 'biennial', 'triennial'],
      default: 'triennial'
    }
  },
  
  // Stackability and Credit Transfer
  stackability: {
    isStackable: {
      type: Boolean,
      default: true
    },
    stackingRules: [String],
    creditAccumulation: {
      enabled: Boolean,
      validityPeriod: Number, // in years
      transferRules: [String]
    }
  },
  
  // Recognition and Mobility
  recognition: {
    nationalRecognition: {
      type: Boolean,
      default: true
    },
    internationalRecognition: [{
      country: String,
      recognizingBody: String,
      equivalentLevel: String,
      bilateralAgreement: Boolean
    }],
    industryRecognition: [{
      industry: String,
      recognizingOrganization: String,
      recognitionType: String
    }]
  },
  
  // Digital Credentials
  digitalCredentials: {
    blockchainEnabled: {
      type: Boolean,
      default: false
    },
    digitalBadgeStandard: {
      type: String,
      enum: ['OpenBadges', 'IMS', 'Credly', 'Custom'],
      default: 'OpenBadges'
    },
    metadataSchema: mongoose.Schema.Types.Mixed,
    verificationMethods: [String]
  },
  
  // Compliance and Regulatory
  compliance: {
    regulatoryBody: {
      type: String,
      default: 'NSDC'
    },
    complianceStatus: {
      type: String,
      enum: ['compliant', 'under_review', 'non_compliant'],
      default: 'compliant'
    },
    lastReviewDate: Date,
    nextReviewDate: Date,
    complianceNotes: String
  },
  
  // Usage Statistics
  statistics: {
    totalCertificatesIssued: {
      type: Number,
      default: 0
    },
    activeLearners: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    employmentRate: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  version: {
    type: String,
    default: '1.0'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
nsqfMapSchema.index({ nsqfLevel: 1 });
nsqfMapSchema.index({ isActive: 1 });
nsqfMapSchema.index({ 'compliance.complianceStatus': 1 });
nsqfMapSchema.index({ effectiveDate: 1 });

// Virtual for level range
nsqfMapSchema.virtual('levelRange').get(function() {
  if (this.nsqfLevel <= 2) return 'Foundation';
  if (this.nsqfLevel <= 4) return 'Certificate';
  if (this.nsqfLevel <= 6) return 'Diploma';
  if (this.nsqfLevel <= 8) return 'Degree';
  return 'Postgraduate';
});

// Virtual for credit range
nsqfMapSchema.virtual('creditRange').get(function() {
  const min = this.creditFramework.minimumCredits;
  const max = this.creditFramework.maximumCredits || min;
  return `${min}-${max} credits`;
});

// Static methods
nsqfMapSchema.statics.findByLevel = function(level) {
  return this.findOne({ nsqfLevel: level, isActive: true });
};

nsqfMapSchema.statics.findByEducationalLevel = function(educationalLevel) {
  return this.find({ 
    'educationalEquivalence.formal': new RegExp(educationalLevel, 'i'),
    isActive: true 
  });
};

nsqfMapSchema.statics.findStackableLevels = function() {
  return this.find({ 
    'stackability.isStackable': true,
    isActive: true 
  }).sort({ nsqfLevel: 1 });
};

nsqfMapSchema.statics.getProgressionPath = function(fromLevel, toLevel) {
  return this.findOne({ nsqfLevel: fromLevel })
    .then(level => {
      if (!level) return null;
      return level.progressionPathways.verticalProgression.find(
        path => path.toLevel === toLevel
      );
    });
};

// Instance methods
nsqfMapSchema.methods.addLearningOutcome = function(type, outcome) {
  if (!this.learningOutcomes[type]) {
    this.learningOutcomes[type] = [];
  }
  this.learningOutcomes[type].push(outcome);
  return this.save();
};

nsqfMapSchema.methods.addIndustryAlignment = function(alignment) {
  this.industryAlignment.push(alignment);
  return this.save();
};

nsqfMapSchema.methods.updateStatistics = function(stats) {
  Object.assign(this.statistics, stats);
  return this.save();
};

nsqfMapSchema.methods.checkCompliance = function() {
  const now = new Date();
  if (this.compliance.nextReviewDate && this.compliance.nextReviewDate < now) {
    this.compliance.complianceStatus = 'under_review';
    return this.save();
  }
  return Promise.resolve(this);
};

// Pre-save middleware
nsqfMapSchema.pre('save', function(next) {
  // Set next review date if not set
  if (!this.compliance.nextReviewDate && this.compliance.lastReviewDate) {
    const reviewCycle = this.qualityAssurance.reviewCycle;
    const years = reviewCycle === 'annual' ? 1 : reviewCycle === 'biennial' ? 2 : 3;
    this.compliance.nextReviewDate = new Date(
      this.compliance.lastReviewDate.getTime() + years * 365 * 24 * 60 * 60 * 1000
    );
  }
  
  next();
});

const NSQFMap = mongoose.model('NSQFMap', nsqfMapSchema);

export default NSQFMap;
