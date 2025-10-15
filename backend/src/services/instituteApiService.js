import crypto from 'crypto';
import logger from '../config/logger.js';
import externalApiService from './externalApiService.js';
import skillVaultApiIntegration from './skillVaultApiIntegration.js';
import { getUserCertificatesForInstitute, getAllUserCertificates } from '../seeders/userSeeder.js';
import { getUserCertificatesForInstitute as getAdvancedUserCerts, getAllUserCertificates as getAllAdvancedUserCerts } from '../seeders/advancedUserSeeder.js';

class InstituteApiService {
  constructor() {
    this.institutes = this.initializeInstitutes();
    this.mockCredentials = this.initializeMockCredentials();
  }

  // Initialize NCVET verified and non-verified institutes
  initializeInstitutes() {
    return {
      // NCVET Verified Institutes
      ncvet_verified: {
        'AICTE': {
          id: 'AICTE',
          name: 'All India Council for Technical Education',
          type: 'NCVET_VERIFIED',
          nsqf_authority: true,
          api_endpoint: '/api/institutes/aicte/credentials',
          trust_level: 'GOVERNMENT_VERIFIED',
          sectors: ['Engineering', 'Technology', 'Management'],
          nsqf_levels: [4, 5, 6, 7, 8, 9, 10]
        },
        'ESSCI': {
          id: 'ESSCI',
          name: 'Electronics Sector Skills Council of India',
          type: 'NCVET_VERIFIED',
          nsqf_authority: true,
          api_endpoint: '/api/institutes/essci/credentials',
          trust_level: 'GOVERNMENT_VERIFIED',
          sectors: ['Electronics', 'Hardware', 'Embedded Systems'],
          nsqf_levels: [3, 4, 5, 6, 7]
        },
        'ASDC': {
          id: 'ASDC',
          name: 'Automotive Skills Development Council',
          type: 'NCVET_VERIFIED',
          nsqf_authority: true,
          api_endpoint: '/api/institutes/asdc/credentials',
          trust_level: 'GOVERNMENT_VERIFIED',
          sectors: ['Automotive', 'Manufacturing', 'Mechanical'],
          nsqf_levels: [2, 3, 4, 5, 6]
        },
        'BFSI': {
          id: 'BFSI',
          name: 'Banking Financial Services Insurance Sector',
          type: 'NCVET_VERIFIED',
          nsqf_authority: true,
          api_endpoint: '/api/institutes/bfsi/credentials',
          trust_level: 'GOVERNMENT_VERIFIED',
          sectors: ['Banking', 'Finance', 'Insurance'],
          nsqf_levels: [4, 5, 6, 7, 8]
        }
      },
      
      // Non-NCVET Institutes (internal only - external ones are in externalApiService)
      non_ncvet: {
        'LINKEDIN': {
          id: 'LINKEDIN',
          name: 'LinkedIn Learning',
          type: 'NON_NCVET',
          nsqf_authority: false,
          api_endpoint: '/api/institutes/linkedin/credentials',
          trust_level: 'INDUSTRY_RECOGNIZED',
          sectors: ['Professional Skills', 'Software', 'Leadership'],
          nsqf_levels: []
        }
      }
    };
  }

  // Initialize mock credentials for each institute
  initializeMockCredentials() {
    return {
      // AICTE Credentials
      'AICTE': [
        {
          credential_id: 'AICTE_001',
          learner_email: 'john.doe@example.com',
          course_name: 'Advanced Computer Networks',
          course_code: 'ACN2024',
          issuer: 'AICTE',
          issue_date: '2024-08-15',
          completion_date: '2024-08-15',
          nsqf_level: 7,
          credit_points: 4,
          grade: 'A',
          certificate_type: 'Course Completion',
          status: 'VERIFIED',
          skills: ['Network Security', 'Protocol Design', 'System Administration']
        },
        {
          credential_id: 'AICTE_002',
          learner_email: 'jane.smith@example.com',
          course_name: 'Data Structures and Algorithms',
          course_code: 'DSA2024',
          issuer: 'AICTE',
          issue_date: '2024-07-20',
          completion_date: '2024-07-20',
          nsqf_level: 6,
          credit_points: 3,
          grade: 'A+',
          certificate_type: 'Course Completion',
          status: 'VERIFIED',
          skills: ['Algorithm Design', 'Problem Solving', 'Programming']
        }
      ],

      // ESSCI Credentials
      'ESSCI': [
        {
          credential_id: 'ESSCI_001',
          learner_email: 'john.doe@example.com',
          course_name: 'IoT Device Programming',
          course_code: 'IOT2024',
          issuer: 'ESSCI',
          issue_date: '2024-09-10',
          completion_date: '2024-09-10',
          nsqf_level: 5,
          credit_points: 3,
          grade: 'B+',
          certificate_type: 'Skill Certification',
          status: 'VERIFIED',
          skills: ['IoT Programming', 'Sensor Integration', 'Embedded Systems']
        }
      ],

      // ASDC Credentials
      'ASDC': [
        {
          credential_id: 'ASDC_001',
          learner_email: 'jane.smith@example.com',
          course_name: 'Automotive Electronics',
          course_code: 'AE2024',
          issuer: 'ASDC',
          issue_date: '2024-06-25',
          completion_date: '2024-06-25',
          nsqf_level: 4,
          credit_points: 2,
          grade: 'A',
          certificate_type: 'Trade Certification',
          status: 'VERIFIED',
          skills: ['Vehicle Electronics', 'Diagnostic Tools', 'Repair Techniques']
        }
      ],

      // LinkedIn Credentials (Non-NCVET - internal only)
      'LINKEDIN': [
        {
          credential_id: 'LINKEDIN_001',
          learner_email: 'john.doe@example.com',
          course_name: 'Leadership and Management',
          course_code: 'LM_2024',
          issuer: 'LINKEDIN',
          issue_date: '2024-03-20',
          completion_date: '2024-03-20',
          nsqf_level: null,
          credit_points: null,
          grade: 'Completed',
          certificate_type: 'Professional Certificate',
          status: 'PLATFORM_VERIFIED',
          skills: ['Leadership', 'Management', 'Team Building']
        }
      ]
    };
  }

  // Get all available institutes (internal + external + skill-valut-api)
  getAllInstitutes() {
    const allInstitutes = [];
    
    // Add internal NCVET verified institutes
    Object.values(this.institutes.ncvet_verified).forEach(institute => {
      allInstitutes.push({
        ...institute,
        badge: '✅ Government Verified',
        category: 'NCVET Verified',
        source: 'internal'
      });
    });
    
    // Add internal Non-NCVET institutes
    Object.values(this.institutes.non_ncvet).forEach(institute => {
      allInstitutes.push({
        ...institute,
        badge: '⚠️ Industry Recognized',
        category: 'Industry Platforms',
        source: 'internal'
      });
    });
    
    // Add skill-valut-api institutes (prioritized over external)
    const skillVaultInstitutes = skillVaultApiIntegration.getAllInstitutes();
    skillVaultInstitutes.forEach(institute => {
      allInstitutes.push(institute);
    });
    
    return allInstitutes;
  }

  // Fetch credentials from specific institute for a learner
  async fetchCredentialsFromInstitute(instituteId, learnerEmail) {
    try {
      logger.info(`Fetching credentials from ${instituteId} for ${learnerEmail}`);

      // Check if this is a skill-valut-api institute (prioritized)
      const skillVaultInstitutes = skillVaultApiIntegration.getAllInstitutes();
      const skillVaultInstitute = skillVaultInstitutes.find(inst => inst.id === instituteId);
      
      if (skillVaultInstitute) {
        const credentials = skillVaultApiIntegration.getCertificatesByLearner(learnerEmail);
        const instituteCredentials = credentials.filter(cert => cert.issuer === instituteId);
        
        if (instituteCredentials.length > 0) {
          return {
            success: true,
            institute: skillVaultInstitute.name,
            institute_type: skillVaultInstitute.type,
            credentials_count: instituteCredentials.length,
            credentials: instituteCredentials,
            source: 'skill-valut-api'
          };
        } else {
          return {
            success: false,
            error: `No certificates found for ${learnerEmail} at ${skillVaultInstitute.name}`,
            institute: skillVaultInstitute.name,
            credentials_count: 0,
            credentials: []
          };
        }
      }

      // Check if this is an external API institute (fallback)
      const externalInstitutes = externalApiService.getAllExternalIssuers();
      if (externalInstitutes[instituteId]) {
        return await externalApiService.fetchCredentialsFromInstitute(instituteId, learnerEmail);
      } 
      const isExternalInstitute = externalInstitutes.some(inst => inst.id === instituteId);
      if (isExternalInstitute) {
        // Fetch from external API
        logger.info(`Fetching from external API for ${instituteId}`);
        return await externalApiService.fetchCredentialsFromExternalAPI(instituteId, learnerEmail);
      }

      // Simulate API delay for internal institutes
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Check if institute exists in internal data
      const institute = this.getInstituteById(instituteId);
      if (!institute) {
        throw new Error(`Institute ${instituteId} not found`);
      }

      // Get user-specific credentials for this institute (prioritize advanced seeder)
      let userCredentials = getAdvancedUserCerts(learnerEmail, instituteId);
      
      // Fallback to basic seeder if no advanced data
      if (!userCredentials || userCredentials.length === 0) {
        userCredentials = getUserCertificatesForInstitute(learnerEmail, instituteId);
      }
      
      // Transform to our expected format if needed (advanced seeder already has correct format)
      const learnerCredentials = userCredentials.map(cert => ({
        credential_id: cert.credential_id || cert.certificate_id,
        learner_email: learnerEmail,
        learner_name: cert.learner_name || learnerEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        course_name: cert.course_name || cert.course_title,
        course_code: cert.course_code || cert.certificate_id,
        issuer: cert.issuer || cert.institute,
        issue_date: cert.issue_date || cert.completion_date,
        completion_date: cert.completion_date,
        nsqf_level: cert.nsqf_level,
        credit_points: cert.credit_points,
        grade: cert.grade || 'Completed',
        certificate_type: cert.certificate_type || 'Course Completion',
        status: cert.status || 'VERIFIED',
        skills: cert.skills || [],
        // Additional fields from skill-valut-api
        blockchain_hash: cert.blockchain_hash,
        digital_signature: cert.digital_signature,
        qr_code_present: cert.qr_code_present,
        download_endpoint: cert.download_endpoint,
        verification_url: cert.verification_url,
        institute_info: cert.institute_info
      }));

      // Add institute metadata to each credential
      const enrichedCredentials = learnerCredentials.map(credential => ({
        ...credential,
        institute_info: {
          name: institute.name,
          type: institute.type,
          trust_level: institute.trust_level,
          nsqf_authority: institute.nsqf_authority
        },
        fetch_timestamp: new Date().toISOString(),
        verification_status: institute.type === 'NCVET_VERIFIED' ? 'GOVERNMENT_VERIFIED' : 'INDUSTRY_VERIFIED',
        source: 'internal'
      }));

      logger.info(`Found ${enrichedCredentials.length} credentials for ${learnerEmail} from ${instituteId}`);
      
      return {
        success: true,
        institute: institute.name,
        institute_type: institute.type,
        credentials_count: enrichedCredentials.length,
        credentials: enrichedCredentials,
        source: 'internal'
      };

    } catch (error) {
      logger.error(`Error fetching credentials from ${instituteId}:`, error);
      return {
        success: false,
        error: error.message,
        institute: instituteId,
        credentials_count: 0,
        credentials: []
      };
    }
  }

  // Get institute by ID (internal + external)
  getInstituteById(instituteId) {
    // Check internal NCVET verified institutes
    if (this.institutes.ncvet_verified[instituteId]) {
      return { ...this.institutes.ncvet_verified[instituteId], source: 'internal' };
    }
    
    // Check internal Non-NCVET institutes
    if (this.institutes.non_ncvet[instituteId]) {
      return { ...this.institutes.non_ncvet[instituteId], source: 'internal' };
    }
    
    // Check external institutes
    const externalInstitutes = externalApiService.getAllExternalIssuers();
    const externalInstitute = externalInstitutes.find(inst => inst.id === instituteId);
    if (externalInstitute) {
      return { ...externalInstitute, source: 'external_api' };
    }
    
    return null;
  }

  // Simulate DigiLocker integration with all institutes
  async simulateDigiLockerFetch(learnerEmail) {
    try {
      logger.info(`Simulating DigiLocker fetch for ${learnerEmail}`);
      
      // Simulate DigiLocker API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get sample credentials from multiple institutes (internal + external)
      const digiLockerCredentials = [];
      
      // Fetch from internal NCVET institutes
      const aicteCredentials = await this.fetchCredentialsFromInstitute('AICTE', learnerEmail);
      const essciCredentials = await this.fetchCredentialsFromInstitute('ESSCI', learnerEmail);
      
      // Fetch from external NCVET institutes
      const futureskillCredentials = await this.fetchCredentialsFromInstitute('FUTURESKILL', learnerEmail);
      const ncctCredentials = await this.fetchCredentialsFromInstitute('NCCT', learnerEmail);
      const universityCredentials = await this.fetchCredentialsFromInstitute('UNIVERSITY', learnerEmail);
      
      // Fetch from external Non-NCVET institutes
      const udemyCredentials = await this.fetchCredentialsFromInstitute('UDEMY', learnerEmail);
      const courseraCredentials = await this.fetchCredentialsFromInstitute('COURSERA', learnerEmail);
      
      // Fetch from internal Non-NCVET institutes
      const linkedinCredentials = await this.fetchCredentialsFromInstitute('LINKEDIN', learnerEmail);

      // Collect all successful fetches
      const allFetches = [
        aicteCredentials, essciCredentials, futureskillCredentials, 
        ncctCredentials, universityCredentials, udemyCredentials, courseraCredentials, linkedinCredentials
      ];

      allFetches.forEach(fetch => {
        if (fetch.success && fetch.credentials) {
          digiLockerCredentials.push(...fetch.credentials);
        }
      });

      // Also fetch from skill-valut-api integration (prioritized)
      try {
        const skillVaultCredentials = skillVaultApiIntegration.simulateDigiLockerFetch(learnerEmail);
        if (skillVaultCredentials.success && skillVaultCredentials.credentials) {
          digiLockerCredentials.push(...skillVaultCredentials.credentials);
        }
      } catch (error) {
        logger.warn('Skill-valut-api fetch failed during DigiLocker simulation:', error.message);
      }

      // Also fetch from external API service for comprehensive coverage
      try {
        const externalCredentials = await externalApiService.fetchAllCredentialsForLearner(learnerEmail);
        if (externalCredentials.success && externalCredentials.credentials) {
          digiLockerCredentials.push(...externalCredentials.credentials);
        }
      } catch (error) {
        logger.warn('External API fetch failed during DigiLocker simulation:', error.message);
      }

      return {
        success: true,
        source: 'DigiLocker',
        fetch_timestamp: new Date().toISOString(),
        total_credentials: digiLockerCredentials.length,
        ncvet_verified: digiLockerCredentials.filter(c => c.institute_info?.type === 'NCVET_VERIFIED').length,
        non_ncvet: digiLockerCredentials.filter(c => c.institute_info?.type === 'NON_NCVET').length,
        internal_sources: allFetches.filter(f => f.success && f.source === 'internal').length,
        external_sources: allFetches.filter(f => f.success && f.source === 'external_api').length,
        credentials: digiLockerCredentials
      };

    } catch (error) {
      logger.error('DigiLocker simulation error:', error);
      return {
        success: false,
        error: error.message,
        credentials: []
      };
    }
  }

  // Calculate NSQF progress for a learner
  calculateNSQFProgress(credentials) {
    const ncvetCredentials = credentials.filter(
      cred => cred.institute_info?.type === 'NCVET_VERIFIED' && cred.nsqf_level
    );

    if (ncvetCredentials.length === 0) {
      return {
        current_level: 0,
        max_level: 0,
        progress_percentage: 0,
        total_credits: 0,
        pathway_status: 'No NSQF credentials found'
      };
    }

    const maxLevel = Math.max(...ncvetCredentials.map(c => c.nsqf_level));
    const totalCredits = ncvetCredentials.reduce((sum, c) => sum + (c.credit_points || 0), 0);
    
    // Calculate progress towards next qualification level
    let pathwayStatus = '';
    let progressPercentage = 0;

    if (maxLevel >= 8) {
      pathwayStatus = 'Eligible for Post-Graduate Programs';
      progressPercentage = 100;
    } else if (maxLevel >= 6) {
      pathwayStatus = 'Eligible for Graduate Programs';
      progressPercentage = 75;
    } else if (maxLevel >= 4) {
      pathwayStatus = 'Eligible for Diploma Programs';
      progressPercentage = 50;
    } else {
      pathwayStatus = 'Building towards Diploma eligibility';
      progressPercentage = 25;
    }

    return {
      current_level: maxLevel,
      max_level: 10,
      progress_percentage: progressPercentage,
      total_credits: totalCredits,
      pathway_status: pathwayStatus,
      ncvet_credentials_count: ncvetCredentials.length
    };
  }
}

export default new InstituteApiService();
