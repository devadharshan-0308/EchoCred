import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to skill-valut-api data
const SKILL_VAULT_API_PATH = path.resolve(__dirname, '../../../skill-valut-api/skill-valut-api/mocks/data');

class SkillVaultApiIntegration {
  constructor() {
    this.institutes = {
      // NCVET Verified Institutes
      'FUTURESKILL': {
        id: 'FUTURESKILL',
        name: 'FutureSkills Prime',
        type: 'NCVET_VERIFIED',
        nsqf_authority: true,
        trust_level: 'GOVERNMENT_VERIFIED',
        sectors: ['Technology', 'AI/ML', 'Digital Skills'],
        nsqf_levels: [4, 5, 6, 7, 8],
        dataPath: 'futureskill'
      },
      'NCCT': {
        id: 'NCCT',
        name: 'National Council for Cement and Building Materials',
        type: 'NCVET_VERIFIED',
        nsqf_authority: true,
        trust_level: 'GOVERNMENT_VERIFIED',
        sectors: ['Construction', 'Building Materials', 'Infrastructure'],
        nsqf_levels: [4, 5, 6, 7],
        dataPath: 'ncct'
      },
      'UNIVERSITY': {
        id: 'UNIVERSITY',
        name: 'University Grants Commission',
        type: 'NCVET_VERIFIED',
        nsqf_authority: true,
        trust_level: 'GOVERNMENT_VERIFIED',
        sectors: ['Higher Education', 'Academic Research', 'Degree Programs'],
        nsqf_levels: [6, 7, 8, 9, 10],
        dataPath: 'university'
      },
      
      // Non-NCVET Institutes
      'UDEMY': {
        id: 'UDEMY',
        name: 'Udemy Business',
        type: 'NON_NCVET',
        nsqf_authority: false,
        trust_level: 'INDUSTRY_RECOGNIZED',
        sectors: ['Programming', 'Design', 'Marketing', 'Business'],
        nsqf_levels: [],
        dataPath: 'udemy'
      },
      'COURSERA': {
        id: 'COURSERA',
        name: 'Coursera Inc.',
        type: 'NON_NCVET',
        nsqf_authority: false,
        trust_level: 'INDUSTRY_RECOGNIZED',
        sectors: ['Technology', 'Business', 'Data Science', 'Computer Science'],
        nsqf_levels: [],
        dataPath: 'coursera'
      }
    };
    
    this.allCertificates = [];
    this.loadAllCertificates();
  }

  // Load all certificates from skill-valut-api
  loadAllCertificates() {
    try {
      this.allCertificates = [];
      
      Object.values(this.institutes).forEach(institute => {
        const institutePath = path.join(SKILL_VAULT_API_PATH, institute.dataPath);
        
        if (fs.existsSync(institutePath)) {
          const files = fs.readdirSync(institutePath).filter(f => f.endsWith('.json'));
          
          files.forEach(file => {
            try {
              const filePath = path.join(institutePath, file);
              const rawData = fs.readFileSync(filePath, 'utf8');
              const certData = JSON.parse(rawData);
              
              // Enhance certificate data with institute info
              const enhancedCert = this.enhanceCertificateData(certData, institute);
              this.allCertificates.push(enhancedCert);
              
            } catch (error) {
              logger.error(`Error loading certificate ${file}:`, error);
            }
          });
        }
      });
      
      logger.info(`Loaded ${this.allCertificates.length} certificates from skill-valut-api`);
      
    } catch (error) {
      logger.error('Error loading certificates from skill-valut-api:', error);
    }
  }

  // Enhance certificate data with additional fields
  enhanceCertificateData(certData, institute) {
    return {
      // Original data
      ...certData,
      
      // Enhanced fields
      credential_id: certData.certificate_id,
      learner_email: this.generateLearnerEmail(certData.learner_name),
      course_name: certData.course_title,
      course_code: this.generateCourseCode(certData.course_title),
      issuer: institute.id,
      issue_date: certData.completion_date,
      completion_date: certData.completion_date,
      
      // NSQF and credit calculation
      nsqf_level: this.calculateNSQFLevel(certData, institute),
      credit_points: this.calculateCreditPoints(certData, institute),
      
      // Grading
      grade: this.generateGrade(),
      certificate_type: certData.metadata?.credential_type || 'Course Completion',
      
      // Verification status
      status: institute.nsqf_authority ? 'GOVERNMENT_VERIFIED' : 'INDUSTRY_VERIFIED',
      verification_status: 'VERIFIED',
      
      // Skills extraction
      skills: this.extractSkills(certData.course_title),
      
      // Institute information
      institute_info: {
        name: institute.name,
        type: institute.type,
        trust_level: institute.trust_level,
        nsqf_authority: institute.nsqf_authority
      },
      
      // Additional metadata
      instructor_name: certData.metadata?.instructor_name || 'Certified Instructor',
      course_duration: certData.metadata?.course_duration || 'Variable',
      language: certData.metadata?.language || 'English',
      organization_name: certData.metadata?.organization_name || institute.name,
      
      // Blockchain and verification
      blockchain_hash: this.generateBlockchainHash(certData.certificate_id),
      digital_signature: true,
      qr_code_present: true,
      
      // External API info
      external_api: true,
      download_endpoint: `http://localhost:5001/download/${certData.certificate_id}.pdf`,
      verification_url: certData.verification_url
    };
  }

  // Generate learner email from name
  generateLearnerEmail(learnerName) {
    return learnerName.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') + '@example.com';
  }

  // Generate course code
  generateCourseCode(courseTitle) {
    return courseTitle.toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(' ')
      .map(word => word.substring(0, 3))
      .join('') + '2024';
  }

  // Calculate NSQF level based on course and institute
  calculateNSQFLevel(certData, institute) {
    if (!institute.nsqf_authority) return null;
    
    // Use metadata nsqf_alignment if available
    if (certData.metadata?.nsqf_alignment) {
      return parseInt(certData.metadata.nsqf_alignment);
    }
    
    // Calculate based on course content
    const courseTitle = certData.course_title.toLowerCase();
    
    if (courseTitle.includes('foundation') || courseTitle.includes('basic')) return 4;
    if (courseTitle.includes('intermediate') || courseTitle.includes('specialist')) return 5;
    if (courseTitle.includes('advanced') || courseTitle.includes('expert')) return 6;
    if (courseTitle.includes('master') || courseTitle.includes('professional')) return 7;
    if (courseTitle.includes('research') || courseTitle.includes('phd')) return 8;
    
    // Default based on institute type
    if (institute.id === 'UNIVERSITY') return 7;
    if (institute.id === 'FUTURESKILL') return 5;
    if (institute.id === 'NCCT') return 5;
    
    return 5; // Default NSQF level
  }

  // Calculate credit points
  calculateCreditPoints(certData, institute) {
    if (!institute.nsqf_authority) return null;
    
    const nsqfLevel = this.calculateNSQFLevel(certData, institute);
    if (!nsqfLevel) return null;
    
    // Credit points based on NSQF level and course duration
    const duration = certData.metadata?.course_duration || '';
    let baseCredits = Math.ceil(nsqfLevel / 2);
    
    if (duration.includes('40') || duration.includes('50')) baseCredits += 2;
    else if (duration.includes('20') || duration.includes('30')) baseCredits += 1;
    
    return Math.max(baseCredits, 2);
  }

  // Generate realistic grade
  generateGrade() {
    const grades = ['A+', 'A', 'A', 'B+', 'B'];
    return grades[Math.floor(Math.random() * grades.length)];
  }

  // Extract skills from course title
  extractSkills(courseTitle) {
    const skillMap = {
      'python': ['Python', 'Programming', 'Software Development'],
      'data science': ['Data Science', 'Analytics', 'Machine Learning'],
      'machine learning': ['Machine Learning', 'AI', 'Data Science'],
      'ai': ['Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
      'web development': ['HTML', 'CSS', 'JavaScript', 'Web Development'],
      'javascript': ['JavaScript', 'Web Development', 'Frontend'],
      'react': ['React', 'JavaScript', 'Frontend Development'],
      'node': ['Node.js', 'Backend Development', 'JavaScript'],
      'marketing': ['Digital Marketing', 'SEO', 'Social Media'],
      'cybersecurity': ['Cybersecurity', 'Network Security', 'Ethical Hacking'],
      'blockchain': ['Blockchain', 'Cryptocurrency', 'Smart Contracts'],
      'construction': ['Construction Management', 'Project Planning', 'Quality Control']
    };
    
    const title = courseTitle.toLowerCase();
    let skills = [];
    
    Object.keys(skillMap).forEach(keyword => {
      if (title.includes(keyword)) {
        skills.push(...skillMap[keyword]);
      }
    });
    
    // Remove duplicates and limit to 4 skills
    skills = [...new Set(skills)].slice(0, 4);
    
    // Default skills if none found
    if (skills.length === 0) {
      skills = ['Professional Development', 'Skill Enhancement'];
    }
    
    return skills;
  }

  // Generate blockchain hash
  generateBlockchainHash(certificateId) {
    return `0x${certificateId.toLowerCase().replace(/-/g, '')}${'0'.repeat(32)}`.substring(0, 42);
  }

  // Get all certificates
  getAllCertificates() {
    return this.allCertificates;
  }

  // Get certificates by institute
  getCertificatesByInstitute(instituteId) {
    return this.allCertificates.filter(cert => cert.issuer === instituteId);
  }

  // Get certificates by learner email
  getCertificatesByLearner(learnerEmail) {
    // First try exact match
    let certificates = this.allCertificates.filter(cert => cert.learner_email === learnerEmail);
    
    // If no exact match found, try to find certificates by name matching
    if (certificates.length === 0) {
      // Extract first name from email for matching
      const emailParts = learnerEmail.split('@')[0].split('.');
      const firstName = emailParts[0];
      const lastName = emailParts[1] || '';
      
      // Try to match by name components
      certificates = this.allCertificates.filter(cert => {
        const learnerName = cert.learner_name?.toLowerCase() || '';
        const firstNameMatch = learnerName.includes(firstName.toLowerCase());
        const lastNameMatch = lastName ? learnerName.includes(lastName.toLowerCase()) : true;
        return firstNameMatch && lastNameMatch;
      });
      
      // If still no match, return a sample set of certificates for demo purposes
      if (certificates.length === 0) {
        // Return first 5-7 certificates as demo data for any user
        certificates = this.allCertificates.slice(0, Math.floor(Math.random() * 3) + 5);
        
        // Update the certificates to show the current user's email
        certificates = certificates.map(cert => ({
          ...cert,
          learner_email: learnerEmail,
          learner_name: this.extractNameFromEmail(learnerEmail)
        }));
      }
    }
    
    return certificates;
  }
  
  // Helper function to extract name from email
  extractNameFromEmail(email) {
    const emailParts = email.split('@')[0].split('.');
    const firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
    const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : '';
    return `${firstName} ${lastName}`.trim();
  }

  // Get certificate by ID
  getCertificateById(certificateId) {
    return this.allCertificates.find(cert => cert.credential_id === certificateId);
  }

  // Get institutes
  getAllInstitutes() {
    return Object.values(this.institutes).map(institute => ({
      ...institute,
      badge: institute.nsqf_authority ? '✅ Government Verified' : '⚠️ Industry Recognized',
      category: institute.nsqf_authority ? 'NCVET Verified' : 'Industry Platforms',
      source: 'skill-valut-api'
    }));
  }

  // Get statistics
  getStatistics() {
    const totalCerts = this.allCertificates.length;
    const ncvetCerts = this.allCertificates.filter(cert => cert.institute_info.nsqf_authority).length;
    const nonNcvetCerts = totalCerts - ncvetCerts;
    
    const learners = [...new Set(this.allCertificates.map(cert => cert.learner_email))];
    
    return {
      total_certificates: totalCerts,
      ncvet_verified: ncvetCerts,
      non_ncvet: nonNcvetCerts,
      total_institutes: Object.keys(this.institutes).length,
      unique_learners: learners.length,
      certificates_by_institute: Object.keys(this.institutes).reduce((acc, instituteId) => {
        acc[instituteId] = this.getCertificatesByInstitute(instituteId).length;
        return acc;
      }, {})
    };
  }

  // Simulate DigiLocker fetch for a learner
  simulateDigiLockerFetch(learnerEmail) {
    const userCertificates = this.getCertificatesByLearner(learnerEmail);
    
    return {
      success: true,
      message: `DigiLocker simulation: Found ${userCertificates.length} certificates`,
      learner_email: learnerEmail,
      credentials_count: userCertificates.length,
      credentials: userCertificates,
      source: 'skill-valut-api-integration',
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
export default new SkillVaultApiIntegration();
