import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExternalApiService {
  constructor() {
    this.mockApiBaseUrl = 'http://localhost:5001';
    this.externalIssuers = this.initializeExternalIssuers();
    this.certificateStoragePath = path.resolve(__dirname, '../../../skill-valut-api/skill-valut-api/mocks/certificates');
  }

  // Initialize external issuer configurations
  initializeExternalIssuers() {
    return {
      'UDEMY': {
        id: 'UDEMY',
        name: 'Udemy Business',
        type: 'NON_NCVET',
        nsqf_authority: false,
        api_endpoint: `${this.mockApiBaseUrl}/api/udemy`,
        trust_level: 'INDUSTRY_RECOGNIZED',
        sectors: ['Programming', 'Design', 'Marketing', 'Business'],
        nsqf_levels: [],
        external_api: true,
        download_endpoint: `${this.mockApiBaseUrl}/download`
      },
      'COURSERA': {
        id: 'COURSERA',
        name: 'Coursera Inc.',
        type: 'NON_NCVET',
        nsqf_authority: false,
        api_endpoint: `${this.mockApiBaseUrl}/api/coursera`,
        trust_level: 'INDUSTRY_RECOGNIZED',
        sectors: ['Technology', 'Business', 'Data Science', 'Computer Science'],
        nsqf_levels: [],
        external_api: true,
        download_endpoint: `${this.mockApiBaseUrl}/download`
      },
      'FUTURESKILL': {
        id: 'FUTURESKILL',
        name: 'FutureSkills Prime',
        type: 'NCVET_VERIFIED',
        nsqf_authority: true,
        api_endpoint: `${this.mockApiBaseUrl}/api/futureskill`,
        trust_level: 'GOVERNMENT_VERIFIED',
        sectors: ['Digital Skills', 'Emerging Technologies', 'AI/ML'],
        nsqf_levels: [4, 5, 6, 7],
        external_api: true,
        download_endpoint: `${this.mockApiBaseUrl}/download`
      },
      'NCCT': {
        id: 'NCCT',
        name: 'National Council for Cement and Building Materials',
        type: 'NCVET_VERIFIED',
        nsqf_authority: true,
        api_endpoint: `${this.mockApiBaseUrl}/api/ncct`,
        trust_level: 'GOVERNMENT_VERIFIED',
        sectors: ['Construction', 'Building Materials', 'Civil Engineering'],
        nsqf_levels: [3, 4, 5, 6],
        external_api: true,
        download_endpoint: `${this.mockApiBaseUrl}/download`
      },
      'UNIVERSITY': {
        id: 'UNIVERSITY',
        name: 'University Consortium',
        type: 'NCVET_VERIFIED',
        nsqf_authority: true,
        api_endpoint: `${this.mockApiBaseUrl}/api/university`,
        trust_level: 'GOVERNMENT_VERIFIED',
        sectors: ['Higher Education', 'Research', 'Academic Programs'],
        nsqf_levels: [6, 7, 8, 9, 10],
        external_api: true,
        download_endpoint: `${this.mockApiBaseUrl}/download`
      }
    };
  }

  // Fetch credentials from external API
  async fetchCredentialsFromExternalAPI(instituteId, learnerEmail) {
    try {
      const institute = this.externalIssuers[instituteId];
      if (!institute) {
        throw new Error(`External institute ${instituteId} not found`);
      }

      logger.info(`Fetching credentials from external API: ${institute.api_endpoint}`);

      // Call the external mock API
      const response = await axios.get(institute.api_endpoint, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Skill-Vault-Max/2.0.0'
        }
      });

      if (response.data.status !== 'success') {
        throw new Error('External API returned error status');
      }

      // Transform external API data to our format
      const transformedCredentials = response.data.certificates.map(cert => {
        // Determine NSQF level based on institute type and course content
        let nsqfLevel = null;
        if (institute.nsqf_authority) {
          // Assign NSQF levels based on course complexity and institute
          if (instituteId === 'UNIVERSITY') {
            nsqfLevel = this.determineUniversityNSQFLevel(cert.course_title);
          } else if (instituteId === 'FUTURESKILL') {
            nsqfLevel = this.determineFutureSkillNSQFLevel(cert.course_title);
          } else if (instituteId === 'NCCT') {
            nsqfLevel = this.determineNCCTNSQFLevel(cert.course_title);
          }
        }

        return {
          credential_id: cert.certificate_id,
          learner_email: learnerEmail,
          learner_name: cert.learner_name,
          course_name: cert.course_title,
          course_code: cert.certificate_id,
          issuer: institute.name,
          issue_date: cert.completion_date,
          completion_date: cert.completion_date,
          nsqf_level: nsqfLevel,
          credit_points: nsqfLevel ? this.calculateCreditPoints(nsqfLevel) : null,
          grade: 'Completed',
          certificate_type: 'Course Completion',
          status: institute.type === 'NCVET_VERIFIED' ? 'GOVERNMENT_VERIFIED' : 'INDUSTRY_VERIFIED',
          verification_status: institute.type === 'NCVET_VERIFIED' ? 'GOVERNMENT_VERIFIED' : 'INDUSTRY_VERIFIED',
          skills: this.extractSkillsFromCourse(cert.course_title),
          institute_info: {
            name: institute.name,
            type: institute.type,
            trust_level: institute.trust_level,
            nsqf_authority: institute.nsqf_authority
          },
          external_api: true,
          download_url: `${institute.download_endpoint}/${cert.certificate_id}`,
          verification_url: `${this.mockApiBaseUrl}/api/${instituteId.toLowerCase()}/${cert.certificate_id}`,
          fetch_timestamp: new Date().toISOString()
        };
      });

      logger.info(`Successfully fetched ${transformedCredentials.length} credentials from ${instituteId}`);

      return {
        success: true,
        institute: institute.name,
        institute_type: institute.type,
        credentials_count: transformedCredentials.length,
        credentials: transformedCredentials,
        source: 'external_api'
      };

    } catch (error) {
      logger.error(`Error fetching from external API ${instituteId}:`, error);
      return {
        success: false,
        error: error.message,
        institute: instituteId,
        credentials_count: 0,
        credentials: []
      };
    }
  }

  // Get detailed certificate metadata from external API
  async getCertificateDetails(instituteId, certificateId) {
    try {
      const institute = this.externalIssuers[instituteId];
      if (!institute) {
        throw new Error(`External institute ${instituteId} not found`);
      }

      const detailUrl = `${this.mockApiBaseUrl}/api/${instituteId.toLowerCase()}/${certificateId}`;
      const response = await axios.get(detailUrl, { timeout: 5000 });

      if (response.data.status !== 'success') {
        throw new Error('Failed to fetch certificate details');
      }

      return {
        success: true,
        certificate: response.data.certificate,
        metadata_source: 'external_api'
      };

    } catch (error) {
      logger.error(`Error fetching certificate details:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Download certificate PDF from external API
  async downloadCertificatePDF(certificateId) {
    try {
      const downloadUrl = `${this.mockApiBaseUrl}/download/${certificateId}`;
      
      const response = await axios.get(downloadUrl, {
        responseType: 'stream',
        timeout: 15000
      });

      return {
        success: true,
        stream: response.data,
        filename: `${certificateId}.pdf`,
        contentType: 'application/pdf'
      };

    } catch (error) {
      logger.error(`Error downloading certificate PDF:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all external issuers
  getAllExternalIssuers() {
    return Object.values(this.externalIssuers).map(institute => ({
      ...institute,
      category: institute.type === 'NCVET_VERIFIED' ? 'NCVET Verified' : 'Industry Platform',
      badge: institute.type === 'NCVET_VERIFIED' ? '✅ Government Verified' : '⚠️ Industry Recognized'
    }));
  }

  // Check if external API is available
  async checkExternalAPIHealth() {
    try {
      const response = await axios.get(this.mockApiBaseUrl, { timeout: 3000 });
      return {
        available: true,
        status: 'healthy',
        message: 'External mock API is running'
      };
    } catch (error) {
      return {
        available: false,
        status: 'unavailable',
        message: 'External mock API is not running'
      };
    }
  }

  // Helper methods for NSQF level determination
  determineUniversityNSQFLevel(courseTitle) {
    const title = courseTitle.toLowerCase();
    if (title.includes('master') || title.includes('postgraduate') || title.includes('phd')) return 10;
    if (title.includes('bachelor') || title.includes('degree') || title.includes('graduate')) return 8;
    if (title.includes('diploma') || title.includes('advanced')) return 6;
    return 7; // Default for university courses
  }

  determineFutureSkillNSQFLevel(courseTitle) {
    const title = courseTitle.toLowerCase();
    if (title.includes('advanced') || title.includes('expert') || title.includes('professional')) return 7;
    if (title.includes('intermediate') || title.includes('specialist')) return 5;
    if (title.includes('basic') || title.includes('foundation') || title.includes('beginner')) return 4;
    return 5; // Default for FutureSkills
  }

  determineNCCTNSQFLevel(courseTitle) {
    const title = courseTitle.toLowerCase();
    if (title.includes('supervisor') || title.includes('manager') || title.includes('advanced')) return 6;
    if (title.includes('technician') || title.includes('skilled')) return 4;
    if (title.includes('operator') || title.includes('basic')) return 3;
    return 4; // Default for NCCT
  }

  calculateCreditPoints(nsqfLevel) {
    // Credit points based on NSQF level
    const creditMap = {
      3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6
    };
    return creditMap[nsqfLevel] || 3;
  }

  extractSkillsFromCourse(courseTitle) {
    // Extract skills based on course title keywords
    const skillKeywords = {
      'programming': ['Programming', 'Software Development'],
      'data': ['Data Analysis', 'Data Science'],
      'web': ['Web Development', 'Frontend', 'Backend'],
      'design': ['UI/UX Design', 'Graphic Design'],
      'marketing': ['Digital Marketing', 'SEO'],
      'business': ['Business Analysis', 'Management'],
      'ai': ['Artificial Intelligence', 'Machine Learning'],
      'cloud': ['Cloud Computing', 'DevOps'],
      'mobile': ['Mobile Development', 'App Development'],
      'security': ['Cybersecurity', 'Information Security']
    };

    const title = courseTitle.toLowerCase();
    const skills = [];

    Object.entries(skillKeywords).forEach(([keyword, skillList]) => {
      if (title.includes(keyword)) {
        skills.push(...skillList);
      }
    });

    // Default skills if none found
    if (skills.length === 0) {
      skills.push('Professional Development', 'Technical Skills');
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  // Simulate fetching credentials for a specific learner email
  async fetchCredentialsForLearner(learnerEmail) {
    const allCredentials = [];
    const results = [];

    for (const [instituteId, institute] of Object.entries(this.externalIssuers)) {
      try {
        const result = await this.fetchCredentialsFromExternalAPI(instituteId, learnerEmail);
        results.push(result);
        
        if (result.success && result.credentials.length > 0) {
          // Filter credentials that might belong to this learner (simulate matching)
          const matchingCredentials = result.credentials.filter(() => Math.random() > 0.7); // 30% chance of match
          allCredentials.push(...matchingCredentials);
        }
      } catch (error) {
        logger.error(`Error fetching from ${instituteId}:`, error);
      }
    }

    return {
      success: true,
      learner_email: learnerEmail,
      total_credentials: allCredentials.length,
      credentials: allCredentials,
      institute_results: results,
      fetch_timestamp: new Date().toISOString()
    };
  }
}

export default new ExternalApiService();
