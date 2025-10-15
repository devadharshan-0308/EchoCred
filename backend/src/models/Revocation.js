import mongoose from 'mongoose';

const revocationSchema = new mongoose.Schema({
  // Certificate information
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    required: [true, 'Certificate ID is required']
  },
  certificateHash: {
    type: String,
    required: [true, 'Certificate hash is required']
  },
  
  // Revocation details
  revocationReason: {
    type: String,
    required: [true, 'Revocation reason is required'],
    enum: [
      'fraudulent_certificate',
      'identity_fraud',
      'academic_misconduct',
      'technical_error',
      'administrative_error',
      'course_not_completed',
      'invalid_assessment',
      'expired_accreditation',
      'legal_requirement',
      'data_breach',
      'other'
    ]
  },
  revocationDescription: {
    type: String,
    required: [true, 'Detailed description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Revocation metadata
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Revoker ID is required']
  },
  revokerRole: {
    type: String,
    enum: ['issuer', 'admin', 'system', 'legal_authority'],
    required: [true, 'Revoker role is required']
  },
  revocationDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Revocation date is required']
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  
  // Legal and compliance
  legalReference: {
    caseNumber: String,
    courtOrder: String,
    legalAuthority: String,
    jurisdiction: String
  },
  complianceRequirement: {
    regulatoryBody: String,
    requirementType: String,
    referenceNumber: String
  },
  
  // Investigation details
  investigationDetails: {
    investigationId: String,
    investigatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    investigationStartDate: Date,
    investigationEndDate: Date,
    findings: String,
    evidence: [{
      type: String,
      description: String,
      filePath: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Impact assessment
  impactAssessment: {
    affectedParties: [{
      partyType: {
        type: String,
        enum: ['learner', 'employer', 'institution', 'regulatory_body', 'public']
      },
      partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      impactDescription: String,
      notificationSent: {
        type: Boolean,
        default: false
      },
      notificationDate: Date
    }],
    reputationalImpact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    financialImpact: {
      estimatedCost: Number,
      currency: {
        type: String,
        default: 'INR'
      },
      description: String
    }
  },
  
  // Blockchain revocation
  blockchainRevocation: {
    revoked: {
      type: Boolean,
      default: false
    },
    revocationTxHash: String,
    revocationBlockNumber: Number,
    revocationNetwork: String,
    gasUsed: Number,
    revocationTimestamp: Date
  },
  
  // Status and workflow
  revocationStatus: {
    type: String,
    enum: ['pending', 'approved', 'executed', 'failed', 'appealed', 'reversed'],
    default: 'pending'
  },
  workflowStage: {
    type: String,
    enum: ['investigation', 'review', 'approval', 'execution', 'notification', 'completed'],
    default: 'investigation'
  },
  
  // Appeal process
  appealDetails: {
    appealSubmitted: {
      type: Boolean,
      default: false
    },
    appealedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appealDate: Date,
    appealReason: String,
    appealStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected']
    },
    appealDecision: String,
    appealDecisionDate: Date,
    appealDecisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Notifications and communications
  notifications: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipientType: {
      type: String,
      enum: ['learner', 'employer', 'issuer', 'admin', 'legal']
    },
    notificationType: {
      type: String,
      enum: ['email', 'sms', 'postal', 'legal_notice', 'system_notification']
    },
    message: String,
    sentDate: Date,
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'bounced'],
      default: 'sent'
    },
    acknowledgmentReceived: {
      type: Boolean,
      default: false
    },
    acknowledgmentDate: Date
  }],
  
  // Audit trail
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    systemGenerated: {
      type: Boolean,
      default: false
    }
  }],
  
  // Remediation
  remediationActions: [{
    action: String,
    description: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    }
  }],
  
  // Metadata
  isPublic: {
    type: Boolean,
    default: false
  },
  publicReason: String, // Why this revocation is made public
  retentionPeriod: {
    type: Number,
    default: 7 // years
  },
  archiveDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
revocationSchema.index({ certificateId: 1 });
revocationSchema.index({ certificateHash: 1 });
revocationSchema.index({ revocationDate: -1 });
revocationSchema.index({ revocationStatus: 1 });
revocationSchema.index({ revokedBy: 1 });
revocationSchema.index({ effectiveDate: 1 });
revocationSchema.index({ archiveDate: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for days since revocation
revocationSchema.virtual('daysSinceRevocation').get(function() {
  return Math.floor((new Date() - this.revocationDate) / (1000 * 60 * 60 * 24));
});

// Virtual for is active revocation
revocationSchema.virtual('isActive').get(function() {
  return this.revocationStatus === 'executed' && 
         this.effectiveDate <= new Date() &&
         !this.appealDetails.appealSubmitted;
});

// Pre-save middleware
revocationSchema.pre('save', function(next) {
  // Set archive date based on retention period
  if (!this.archiveDate) {
    this.archiveDate = new Date(
      Date.now() + this.retentionPeriod * 365 * 24 * 60 * 60 * 1000
    );
  }
  
  // Add audit trail entry for status changes
  if (this.isModified('revocationStatus')) {
    this.auditTrail.push({
      action: `Status changed to ${this.revocationStatus}`,
      performedBy: this.revokedBy,
      timestamp: new Date(),
      systemGenerated: true
    });
  }
  
  next();
});

// Static methods
revocationSchema.statics.findActiveRevocations = function() {
  return this.find({
    revocationStatus: 'executed',
    effectiveDate: { $lte: new Date() },
    'appealDetails.appealSubmitted': { $ne: true }
  });
};

revocationSchema.statics.findByReason = function(reason) {
  return this.find({ revocationReason: reason });
};

revocationSchema.statics.getRevocationStats = function(dateRange = {}) {
  const matchStage = { revocationStatus: 'executed' };
  
  if (dateRange.start || dateRange.end) {
    matchStage.revocationDate = {};
    if (dateRange.start) matchStage.revocationDate.$gte = dateRange.start;
    if (dateRange.end) matchStage.revocationDate.$lte = dateRange.end;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$revocationReason',
        count: { $sum: 1 },
        avgDaysToRevoke: {
          $avg: {
            $divide: [
              { $subtract: ['$revocationDate', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    }
  ]);
};

// Instance methods
revocationSchema.methods.addAuditEntry = function(action, performedBy, details) {
  this.auditTrail.push({
    action,
    performedBy,
    details,
    timestamp: new Date()
  });
  return this.save();
};

revocationSchema.methods.addNotification = function(notification) {
  this.notifications.push(notification);
  return this.save();
};

revocationSchema.methods.submitAppeal = function(appealedBy, reason) {
  this.appealDetails = {
    appealSubmitted: true,
    appealedBy,
    appealDate: new Date(),
    appealReason: reason,
    appealStatus: 'pending'
  };
  
  return this.addAuditEntry('Appeal submitted', appealedBy, reason);
};

revocationSchema.methods.processAppeal = function(decision, decisionBy, decisionReason) {
  this.appealDetails.appealStatus = decision;
  this.appealDetails.appealDecision = decisionReason;
  this.appealDetails.appealDecisionDate = new Date();
  this.appealDetails.appealDecisionBy = decisionBy;
  
  if (decision === 'approved') {
    this.revocationStatus = 'reversed';
  }
  
  return this.addAuditEntry(`Appeal ${decision}`, decisionBy, decisionReason);
};

const Revocation = mongoose.model('Revocation', revocationSchema);

export default Revocation;
