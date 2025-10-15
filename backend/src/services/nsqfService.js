import NSQFMap from '../models/NSQFMap.js';
import Certificate from '../models/Certificate.js';
import logger from '../config/logger.js';

class NSQFService {
  constructor() {
    this.nsqfLevels = Array.from({ length: 10 }, (_, i) => i + 1);
    this.initializeNSQFData();
  }

  // Initialize NSQF data if not exists
  async initializeNSQFData() {
    try {
      const existingLevels = await NSQFMap.countDocuments();
      if (existingLevels === 0) {
        await this.createDefaultNSQFLevels();
        logger.info('Default NSQF levels created');
      }
    } catch (error) {
      logger.error('NSQF initialization error:', error);
    }
  }

  // Create default NSQF level mappings
  async createDefaultNSQFLevels() {
    const defaultLevels = [
      {
        nsqfLevel: 1,
        levelName: 'Certificate (Class V)',
        levelDescription: 'Job role related to processes that are routine, predictable and require basic knowledge and minimal skills',
        educationalEquivalence: {
          formal: 'Class V',
          vocational: 'Basic vocational training',
          professional: 'Entry level'
        },
        creditFramework: {
          minimumCredits: 120,
          maximumCredits: 180,
          creditType: 'vocational'
        }
      },
      {
        nsqfLevel: 2,
        levelName: 'Certificate (Class VIII)',
        levelDescription: 'Job role related to processes that are routine but require some skills and knowledge',
        educationalEquivalence: {
          formal: 'Class VIII',
          vocational: 'Basic skill development',
          professional: 'Basic operational level'
        },
        creditFramework: {
          minimumCredits: 150,
          maximumCredits: 220,
          creditType: 'vocational'
        }
      },
      {
        nsqfLevel: 3,
        levelName: 'Certificate (Class X)',
        levelDescription: 'Job role that requires some knowledge, skills and involves work that is routine with some non-routine elements',
        educationalEquivalence: {
          formal: 'Class X',
          vocational: 'Skill development program',
          professional: 'Skilled worker'
        },
        creditFramework: {
          minimumCredits: 180,
          maximumCredits: 250,
          creditType: 'vocational'
        }
      },
      {
        nsqfLevel: 4,
        levelName: 'Certificate (Class XII)',
        levelDescription: 'Job role that requires knowledge and skills to carry out processes that have some non-routine elements',
        educationalEquivalence: {
          formal: 'Class XII',
          vocational: 'Advanced skill training',
          professional: 'Technician level'
        },
        creditFramework: {
          minimumCredits: 220,
          maximumCredits: 300,
          creditType: 'vocational'
        }
      },
      {
        nsqfLevel: 5,
        levelName: 'Diploma',
        levelDescription: 'Job role that requires knowledge and skills to carry out processes in a range of varied contexts',
        educationalEquivalence: {
          formal: 'Diploma',
          vocational: 'Advanced diploma',
          professional: 'Supervisor level'
        },
        creditFramework: {
          minimumCredits: 300,
          maximumCredits: 400,
          creditType: 'academic'
        }
      },
      {
        nsqfLevel: 6,
        levelName: 'Advanced Diploma / Bachelor Degree',
        levelDescription: 'Job role that requires knowledge and skills to undertake advanced activities in a range of contexts',
        educationalEquivalence: {
          formal: 'Bachelor Degree',
          vocational: 'Advanced diploma',
          professional: 'Junior management'
        },
        creditFramework: {
          minimumCredits: 400,
          maximumCredits: 500,
          creditType: 'academic'
        }
      },
      {
        nsqfLevel: 7,
        levelName: 'Bachelor Degree / Bachelor Honours',
        levelDescription: 'Job role that requires wide knowledge and skills for varied, unpredictable contexts',
        educationalEquivalence: {
          formal: 'Bachelor Honours',
          vocational: 'Professional certification',
          professional: 'Middle management'
        },
        creditFramework: {
          minimumCredits: 500,
          maximumCredits: 600,
          creditType: 'academic'
        }
      },
      {
        nsqfLevel: 8,
        levelName: 'Post Graduate Diploma / Master Degree',
        levelDescription: 'Job role that requires comprehensive knowledge and skills for complex, unpredictable contexts',
        educationalEquivalence: {
          formal: 'Master Degree',
          vocational: 'Advanced professional certification',
          professional: 'Senior management'
        },
        creditFramework: {
          minimumCredits: 600,
          maximumCredits: 800,
          creditType: 'academic'
        }
      },
      {
        nsqfLevel: 9,
        levelName: 'Master Degree',
        levelDescription: 'Job role that requires specialized knowledge and skills for complex contexts with significant autonomy',
        educationalEquivalence: {
          formal: 'Master Degree (Research)',
          vocational: 'Expert level certification',
          professional: 'Expert/Consultant'
        },
        creditFramework: {
          minimumCredits: 800,
          maximumCredits: 1000,
          creditType: 'academic'
        }
      },
      {
        nsqfLevel: 10,
        levelName: 'Doctoral Degree',
        levelDescription: 'Job role that requires highly specialized knowledge and skills for highly complex contexts',
        educationalEquivalence: {
          formal: 'Doctoral Degree',
          vocational: 'Master practitioner',
          professional: 'Subject matter expert'
        },
        creditFramework: {
          minimumCredits: 1000,
          maximumCredits: 1200,
          creditType: 'academic'
        }
      }
    ];

    for (const levelData of defaultLevels) {
      const nsqfLevel = new NSQFMap({
        ...levelData,
        isActive: true,
        effectiveDate: new Date(),
        version: '1.0'
      });
      await nsqfLevel.save();
    }
  }

  // Map certificate to NSQF level
  async mapCertificateToNSQF(certificateId, nsqfLevel, skillAreas = []) {
    try {
      const certificate = await Certificate.findById(certificateId);
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const nsqfMapping = await NSQFMap.findByLevel(nsqfLevel);
      if (!nsqfMapping) {
        throw new Error(`NSQF Level ${nsqfLevel} not found`);
      }

      // Update certificate with NSQF information
      certificate.nsqfLevel = nsqfLevel;
      certificate.skillAreas = skillAreas.length > 0 ? skillAreas : certificate.skillAreas;
      
      // Calculate NSQF credits based on course details
      if (certificate.courseDetails?.duration) {
        certificate.nsqfCredits = this.calculateNSQFCredits(
          certificate.courseDetails.duration,
          nsqfLevel
        );
      }

      await certificate.save();

      logger.info(`Certificate ${certificateId} mapped to NSQF Level ${nsqfLevel}`);

      return {
        success: true,
        certificate,
        nsqfMapping,
        message: `Certificate successfully mapped to NSQF Level ${nsqfLevel}`
      };
    } catch (error) {
      logger.error('NSQF mapping error:', error);
      throw error;
    }
  }

  // Calculate NSQF credits based on duration and level
  calculateNSQFCredits(duration, nsqfLevel) {
    // Basic credit calculation (can be enhanced based on actual NSQF guidelines)
    const baseCredits = {
      1: 120, 2: 150, 3: 180, 4: 220, 5: 300,
      6: 400, 7: 500, 8: 600, 9: 800, 10: 1000
    };

    let credits = baseCredits[nsqfLevel] || 120;

    // Adjust based on duration (assuming duration is in hours)
    if (typeof duration === 'string') {
      const hours = this.parseDurationToHours(duration);
      credits = Math.round(hours / 10); // 10 hours = 1 credit (approximate)
    }

    return Math.min(credits, baseCredits[nsqfLevel] * 1.5); // Cap at 150% of base
  }

  // Parse duration string to hours
  parseDurationToHours(duration) {
    const durationStr = duration.toLowerCase();
    
    if (durationStr.includes('hour')) {
      return parseInt(durationStr.match(/\d+/)?.[0] || '0');
    } else if (durationStr.includes('day')) {
      return parseInt(durationStr.match(/\d+/)?.[0] || '0') * 8;
    } else if (durationStr.includes('week')) {
      return parseInt(durationStr.match(/\d+/)?.[0] || '0') * 40;
    } else if (durationStr.includes('month')) {
      return parseInt(durationStr.match(/\d+/)?.[0] || '0') * 160;
    }
    
    return 40; // Default to 40 hours
  }

  // Get NSQF level recommendations for a certificate
  async recommendNSQFLevel(certificate) {
    try {
      const recommendations = [];

      // Analyze certificate content for NSQF level recommendation
      const title = certificate.title?.toLowerCase() || '';
      const description = certificate.description?.toLowerCase() || '';
      const issuer = certificate.issuerName?.toLowerCase() || '';

      // Basic keyword-based recommendation
      const levelKeywords = {
        1: ['basic', 'foundation', 'entry', 'beginner'],
        2: ['elementary', 'primary', 'basic skill'],
        3: ['intermediate', 'skilled', 'competent'],
        4: ['advanced', 'senior', 'experienced'],
        5: ['diploma', 'specialist', 'expert'],
        6: ['bachelor', 'degree', 'professional'],
        7: ['honours', 'advanced degree', 'specialist'],
        8: ['master', 'postgraduate', 'expert'],
        9: ['research', 'advanced master', 'consultant'],
        10: ['doctoral', 'phd', 'research expert']
      };

      for (const [level, keywords] of Object.entries(levelKeywords)) {
        const score = keywords.reduce((acc, keyword) => {
          if (title.includes(keyword) || description.includes(keyword)) {
            return acc + 1;
          }
          return acc;
        }, 0);

        if (score > 0) {
          const nsqfMapping = await NSQFMap.findByLevel(parseInt(level));
          recommendations.push({
            nsqfLevel: parseInt(level),
            confidence: Math.min(score * 25, 100),
            reasoning: `Keywords match: ${keywords.filter(k => 
              title.includes(k) || description.includes(k)
            ).join(', ')}`,
            nsqfMapping
          });
        }
      }

      // Sort by confidence
      recommendations.sort((a, b) => b.confidence - a.confidence);

      return recommendations.slice(0, 3); // Return top 3 recommendations
    } catch (error) {
      logger.error('NSQF recommendation error:', error);
      throw error;
    }
  }

  // Get progression pathways for a certificate
  async getProgressionPathways(certificateId) {
    try {
      const certificate = await Certificate.findById(certificateId);
      if (!certificate || !certificate.nsqfLevel) {
        throw new Error('Certificate not found or NSQF level not set');
      }

      const currentLevel = await NSQFMap.findByLevel(certificate.nsqfLevel);
      if (!currentLevel) {
        throw new Error('Current NSQF level mapping not found');
      }

      const pathways = {
        vertical: [],
        horizontal: [],
        stackable: []
      };

      // Vertical progression (higher levels)
      for (let level = certificate.nsqfLevel + 1; level <= 10; level++) {
        const nextLevel = await NSQFMap.findByLevel(level);
        if (nextLevel) {
          pathways.vertical.push({
            nsqfLevel: level,
            levelName: nextLevel.levelName,
            requirements: nextLevel.progressionPathways?.verticalProgression?.find(
              p => p.fromLevel === certificate.nsqfLevel
            )?.requirements || ['Complete current level requirements'],
            creditRequirement: nextLevel.creditFramework.minimumCredits
          });
        }
      }

      // Horizontal progression (same level, different skills)
      const sameLevelCertificates = await Certificate.find({
        nsqfLevel: certificate.nsqfLevel,
        _id: { $ne: certificateId },
        isActive: true
      }).limit(5);

      pathways.horizontal = sameLevelCertificates.map(cert => ({
        certificateTitle: cert.title,
        skillAreas: cert.skillAreas,
        issuer: cert.issuerName,
        category: cert.category
      }));

      // Stackable qualifications
      const stackableCerts = await Certificate.find({
        nsqfLevel: { $gte: certificate.nsqfLevel, $lte: certificate.nsqfLevel + 2 },
        skillAreas: { $in: certificate.skillAreas || [] },
        _id: { $ne: certificateId },
        isActive: true
      }).limit(5);

      pathways.stackable = stackableCerts.map(cert => ({
        certificateTitle: cert.title,
        nsqfLevel: cert.nsqfLevel,
        skillAreas: cert.skillAreas,
        issuer: cert.issuerName,
        stackingPotential: this.calculateStackingPotential(certificate, cert)
      }));

      return pathways;
    } catch (error) {
      logger.error('Progression pathways error:', error);
      throw error;
    }
  }

  // Calculate stacking potential between certificates
  calculateStackingPotential(cert1, cert2) {
    const skillOverlap = cert1.skillAreas?.filter(skill => 
      cert2.skillAreas?.includes(skill)
    ).length || 0;

    const totalSkills = new Set([
      ...(cert1.skillAreas || []),
      ...(cert2.skillAreas || [])
    ]).size;

    return totalSkills > 0 ? Math.round((skillOverlap / totalSkills) * 100) : 0;
  }

  // Get NSQF compliance report for certificates
  async getNSQFComplianceReport(filters = {}) {
    try {
      const matchStage = { isActive: true };
      
      if (filters.nsqfLevel) {
        matchStage.nsqfLevel = filters.nsqfLevel;
      }
      if (filters.category) {
        matchStage.category = filters.category;
      }

      const complianceStats = await Certificate.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$nsqfLevel',
            count: { $sum: 1 },
            avgCredits: { $avg: '$nsqfCredits' },
            categories: { $addToSet: '$category' },
            skillAreas: { $addToSet: '$skillAreas' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get NSQF level details
      const nsqfLevels = await NSQFMap.find({ isActive: true }).sort({ nsqfLevel: 1 });

      const report = {
        overview: {
          totalCertificates: await Certificate.countDocuments(matchStage),
          nsqfMappedCertificates: await Certificate.countDocuments({
            ...matchStage,
            nsqfLevel: { $exists: true, $ne: null }
          }),
          complianceRate: 0
        },
        levelBreakdown: [],
        recommendations: []
      };

      // Calculate compliance rate
      report.overview.complianceRate = report.overview.totalCertificates > 0 
        ? Math.round((report.overview.nsqfMappedCertificates / report.overview.totalCertificates) * 100)
        : 0;

      // Process level breakdown
      for (const nsqfLevel of nsqfLevels) {
        const levelStats = complianceStats.find(stat => stat._id === nsqfLevel.nsqfLevel);
        
        report.levelBreakdown.push({
          nsqfLevel: nsqfLevel.nsqfLevel,
          levelName: nsqfLevel.levelName,
          certificateCount: levelStats?.count || 0,
          avgCredits: levelStats?.avgCredits || 0,
          expectedCredits: nsqfLevel.creditFramework.minimumCredits,
          categories: levelStats?.categories || [],
          compliance: levelStats ? 'compliant' : 'no_certificates'
        });
      }

      // Generate recommendations
      const unmappedCertificates = await Certificate.countDocuments({
        ...matchStage,
        nsqfLevel: { $exists: false }
      });

      if (unmappedCertificates > 0) {
        report.recommendations.push({
          type: 'mapping_required',
          message: `${unmappedCertificates} certificates need NSQF level mapping`,
          priority: 'high'
        });
      }

      return report;
    } catch (error) {
      logger.error('NSQF compliance report error:', error);
      throw error;
    }
  }

  // Bulk update NSQF mappings
  async bulkUpdateNSQFMappings(updates) {
    try {
      const results = [];

      for (const update of updates) {
        try {
          const result = await this.mapCertificateToNSQF(
            update.certificateId,
            update.nsqfLevel,
            update.skillAreas
          );
          results.push({
            certificateId: update.certificateId,
            status: 'success',
            result
          });
        } catch (error) {
          results.push({
            certificateId: update.certificateId,
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        totalProcessed: updates.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results
      };
    } catch (error) {
      logger.error('Bulk NSQF update error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const nsqfService = new NSQFService();
export default nsqfService;
