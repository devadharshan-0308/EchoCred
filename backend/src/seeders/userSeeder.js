import User from '../models/User.js';
import logger from '../config/logger.js';
import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';

// Mock users with their certificates
const mockUsers = [
  {
    email: 'john.learner@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'learner',
    learnerProfile: {
      institution: 'Delhi University',
      studentId: 'DU2024001'
    },
    certificates: [
      {
        institute: 'AICTE',
        credential_id: 'AICTE_JD_001',
        course_name: 'Advanced Computer Networks',
        course_code: 'ACN2024',
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
        institute: 'ESSCI',
        credential_id: 'ESSCI_JD_001',
        course_name: 'Digital Marketing Specialist',
        course_code: 'DMS2024',
        issue_date: '2024-07-10',
        completion_date: '2024-07-10',
        nsqf_level: 5,
        credit_points: 3,
        grade: 'A+',
        certificate_type: 'Professional Certification',
        status: 'VERIFIED',
        skills: ['SEO', 'Social Media Marketing', 'Content Strategy']
      },
      {
        institute: 'FUTURESKILL',
        credential_id: 'FUTURE_JD_001',
        course_name: 'AI/ML Fundamentals',
        course_code: 'AIML2024',
        issue_date: '2024-06-20',
        completion_date: '2024-06-20',
        nsqf_level: 6,
        credit_points: 4,
        grade: 'A',
        certificate_type: 'Government Certification',
        status: 'GOVERNMENT_VERIFIED',
        skills: ['Machine Learning', 'Python', 'Data Science']
      },
      {
        institute: 'UDEMY',
        credential_id: 'UDEMY_JD_001',
        course_name: 'Complete React Development',
        course_code: 'REACT2024',
        issue_date: '2024-05-15',
        completion_date: '2024-05-15',
        nsqf_level: null,
        credit_points: null,
        grade: 'Completed',
        certificate_type: 'Course Certificate',
        status: 'INDUSTRY_VERIFIED',
        skills: ['React', 'JavaScript', 'Frontend Development']
      },
      {
        institute: 'COURSERA',
        credential_id: 'COURSERA_JD_001',
        course_name: 'Google Data Analytics Professional',
        course_code: 'GDA2024',
        issue_date: '2024-04-10',
        completion_date: '2024-04-10',
        nsqf_level: null,
        credit_points: null,
        grade: 'Completed',
        certificate_type: 'Professional Certificate',
        status: 'INDUSTRY_VERIFIED',
        skills: ['Data Analysis', 'SQL', 'Tableau', 'Python']
      },
      {
        institute: 'NCCT',
        credential_id: 'NCCT_JD_001',
        course_name: 'Construction Project Management',
        course_code: 'CPM2024',
        issue_date: '2024-03-25',
        completion_date: '2024-03-25',
        nsqf_level: 5,
        credit_points: 3,
        grade: 'A',
        certificate_type: 'Trade Certification',
        status: 'GOVERNMENT_VERIFIED',
        skills: ['Project Management', 'Construction Planning', 'Quality Control']
      }
    ]
  },
  {
    email: 'jane.learner@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'learner',
    learnerProfile: {
      institution: 'Mumbai University',
      studentId: 'MU2024002'
    },
    certificates: [
      {
        institute: 'AICTE',
        credential_id: 'AICTE_JS_001',
        course_name: 'Data Structures and Algorithms',
        course_code: 'DSA2024',
        issue_date: '2024-07-20',
        completion_date: '2024-07-20',
        nsqf_level: 6,
        credit_points: 3,
        grade: 'A+',
        certificate_type: 'Course Completion',
        status: 'VERIFIED',
        skills: ['Data Structures', 'Algorithms', 'Problem Solving']
      },
      {
        institute: 'BFSI',
        credential_id: 'BFSI_JS_001',
        course_name: 'Banking Operations Specialist',
        course_code: 'BOS2024',
        issue_date: '2024-06-15',
        completion_date: '2024-06-15',
        nsqf_level: 5,
        credit_points: 4,
        grade: 'A',
        certificate_type: 'Professional Certification',
        status: 'VERIFIED',
        skills: ['Banking Operations', 'Risk Management', 'Customer Service']
      },
      {
        institute: 'UNIVERSITY',
        credential_id: 'UNI_JS_001',
        course_name: 'Master of Computer Applications',
        course_code: 'MCA2024',
        issue_date: '2024-05-30',
        completion_date: '2024-05-30',
        nsqf_level: 8,
        credit_points: 6,
        grade: 'A+',
        certificate_type: 'Degree Certificate',
        status: 'GOVERNMENT_VERIFIED',
        skills: ['Software Engineering', 'Database Management', 'System Design']
      },
      {
        institute: 'UDEMY',
        credential_id: 'UDEMY_JS_001',
        course_name: 'Python for Data Science',
        course_code: 'PDS2024',
        issue_date: '2024-04-25',
        completion_date: '2024-04-25',
        nsqf_level: null,
        credit_points: null,
        grade: 'Completed',
        certificate_type: 'Course Certificate',
        status: 'INDUSTRY_VERIFIED',
        skills: ['Python', 'Data Analysis', 'Pandas', 'NumPy']
      },
      {
        institute: 'COURSERA',
        credential_id: 'COURSERA_JS_001',
        course_name: 'IBM Data Science Professional',
        course_code: 'IBMDS2024',
        issue_date: '2024-03-15',
        completion_date: '2024-03-15',
        nsqf_level: null,
        credit_points: null,
        grade: 'Completed',
        certificate_type: 'Professional Certificate',
        status: 'INDUSTRY_VERIFIED',
        skills: ['Data Science', 'Machine Learning', 'Statistics', 'R']
      }
    ]
  },
  {
    email: 'alex.learner@example.com',
    password: 'password123',
    firstName: 'Alex',
    lastName: 'Johnson',
    role: 'learner',
    learnerProfile: {
      institution: 'IIT Bombay',
      studentId: 'IITB2024003'
    },
    certificates: [
      {
        institute: 'ASDC',
        credential_id: 'ASDC_AJ_001',
        course_name: 'Automotive Electronics Technician',
        course_code: 'AET2024',
        issue_date: '2024-08-05',
        completion_date: '2024-08-05',
        nsqf_level: 4,
        credit_points: 2,
        grade: 'A',
        certificate_type: 'Trade Certification',
        status: 'VERIFIED',
        skills: ['Vehicle Electronics', 'Diagnostic Tools', 'Repair Techniques']
      },
      {
        institute: 'FUTURESKILL',
        credential_id: 'FUTURE_AJ_001',
        course_name: 'Blockchain Development',
        course_code: 'BLOCK2024',
        issue_date: '2024-07-12',
        completion_date: '2024-07-12',
        nsqf_level: 7,
        credit_points: 4,
        grade: 'A+',
        certificate_type: 'Government Certification',
        status: 'GOVERNMENT_VERIFIED',
        skills: ['Blockchain', 'Smart Contracts', 'Ethereum', 'Solidity']
      },
      {
        institute: 'NCCT',
        credential_id: 'NCCT_AJ_001',
        course_name: 'Civil Engineering Fundamentals',
        course_code: 'CEF2024',
        issue_date: '2024-06-18',
        completion_date: '2024-06-18',
        nsqf_level: 6,
        credit_points: 4,
        grade: 'A',
        certificate_type: 'Trade Certification',
        status: 'GOVERNMENT_VERIFIED',
        skills: ['Structural Design', 'Construction Materials', 'Project Planning']
      },
      {
        institute: 'LINKEDIN',
        credential_id: 'LINKEDIN_AJ_001',
        course_name: 'Leadership and Management',
        course_code: 'LM2024',
        issue_date: '2024-05-22',
        completion_date: '2024-05-22',
        nsqf_level: null,
        credit_points: null,
        grade: 'Completed',
        certificate_type: 'Professional Certificate',
        status: 'PLATFORM_VERIFIED',
        skills: ['Leadership', 'Management', 'Team Building']
      },
      {
        institute: 'UDEMY',
        credential_id: 'UDEMY_AJ_001',
        course_name: 'Full Stack Web Development',
        course_code: 'FSWD2024',
        issue_date: '2024-04-08',
        completion_date: '2024-04-08',
        nsqf_level: null,
        credit_points: null,
        grade: 'Completed',
        certificate_type: 'Course Certificate',
        status: 'INDUSTRY_VERIFIED',
        skills: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'MongoDB']
      }
    ]
  },
  // EMPLOYER ACCOUNTS
  {
    email: 'hr.manager@techcorp.com',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'employer',
    employerProfile: {
      companyName: 'TechCorp Solutions',
      industry: 'Information Technology',
      companySize: '500-1000',
      hrId: 'HR2024001'
    },
    certificates: [] // Employers don't have certificates
  },
  {
    email: 'recruiter@innovate.com',
    password: 'password123',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'employer',
    employerProfile: {
      companyName: 'Innovate Industries',
      industry: 'Manufacturing',
      companySize: '1000+',
      hrId: 'HR2024002'
    },
    certificates: []
  },
  // ISSUER ACCOUNTS
  {
    email: 'admin@futureskills.gov.in',
    password: 'password123',
    firstName: 'Dr. Priya',
    lastName: 'Sharma',
    role: 'issuer',
    issuerProfile: {
      instituteName: 'FutureSkills Prime',
      instituteType: 'NCVET_VERIFIED',
      authorityLevel: 'GOVERNMENT',
      issuerCode: 'FUTURESKILL'
    },
    certificates: []
  },
  {
    email: 'certify@aicte.ac.in',
    password: 'password123',
    firstName: 'Prof. Rajesh',
    lastName: 'Kumar',
    role: 'issuer',
    issuerProfile: {
      instituteName: 'All India Council for Technical Education',
      instituteType: 'NCVET_VERIFIED',
      authorityLevel: 'GOVERNMENT',
      issuerCode: 'AICTE'
    },
    certificates: []
  },
  {
    email: 'admin@ncct.org.in',
    password: 'password123',
    firstName: 'Dr. Anjali',
    lastName: 'Patel',
    role: 'issuer',
    issuerProfile: {
      instituteName: 'National Council for Cement and Building Materials',
      instituteType: 'NCVET_VERIFIED',
      authorityLevel: 'GOVERNMENT',
      issuerCode: 'NCCT'
    },
    certificates: []
  }
];

// Seed users and their certificates
export const seedUsers = async () => {
  try {
    logger.info('Starting user seeding...');

    for (const userData of mockUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        // Create user without certificates first
        const { certificates, ...userDataWithoutCerts } = userData;
        
        const user = new User({
          ...userDataWithoutCerts,
          isActive: true
        });
        
        await user.save();
        logger.info(`Created user: ${userData.email}`);
      } else {
        logger.info(`User already exists: ${userData.email}`);
      }
    }

    logger.info('User seeding completed successfully');
    return {
      success: true,
      message: 'Users seeded successfully',
      users: mockUsers.map(u => ({ email: u.email, certificateCount: u.certificates.length }))
    };

  } catch (error) {
    logger.error('Error seeding users:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get mock certificates for a specific user and institute
export const getUserCertificatesForInstitute = (userEmail, instituteId) => {
  // First check skill-valut-api data
  const skillVaultCerts = skillVaultApiIntegration.getCertificatesByLearner(userEmail);
  const instituteCerts = skillVaultCerts.filter(cert => cert.issuer === instituteId);
  
  if (instituteCerts.length > 0) {
    return instituteCerts;
  }
  
  // Fallback to mock users
  const user = mockUsers.find(u => u.email === userEmail);
  if (!user) return [];
  
  return user.certificates.filter(cert => cert.institute === instituteId);
};

// Get all certificates for a user
export const getAllUserCertificates = (userEmail) => {
  // First check skill-valut-api data
  const skillVaultCerts = skillVaultApiIntegration.getCertificatesByLearner(userEmail);
  
  if (skillVaultCerts.length > 0) {
    return skillVaultCerts;
  }
  
  // Fallback to mock users
  const user = mockUsers.find(u => u.email === userEmail);
  if (!user) return [];
  
  return user.certificates;
};

export default { seedUsers, getUserCertificatesForInstitute, getAllUserCertificates };
