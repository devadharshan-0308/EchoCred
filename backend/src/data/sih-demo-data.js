// SIH Demo Data - Impressive certificates for demonstration
export const sihDemoCertificates = [
  {
    id: 'SIH2024_001',
    title: 'Advanced AI & Machine Learning Certification',
    issuer: 'IIT Delhi',
    learnerName: 'Rahul Sharma',
    issueDate: '2024-09-15',
    nsqfLevel: 8,
    credits: 600,
    skills: ['Machine Learning', 'Deep Learning', 'Python', 'TensorFlow'],
    verificationStatus: 'verified',
    confidenceScore: 96.8,
    blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890',
    digitalSignature: true,
    qrCodePresent: true,
    category: 'Technology'
  },
  {
    id: 'SIH2024_002', 
    title: 'Digital India Cyber Security Specialist',
    issuer: 'NIELIT',
    learnerName: 'Priya Patel',
    issueDate: '2024-08-20',
    nsqfLevel: 7,
    credits: 480,
    skills: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Incident Response'],
    verificationStatus: 'verified',
    confidenceScore: 98.2,
    blockchainHash: '0x2b3c4d5e6f7890abcdef1234567890ab',
    digitalSignature: true,
    qrCodePresent: true,
    category: 'Security'
  },
  {
    id: 'SIH2024_003',
    title: 'Skill India Digital Marketing Expert',
    issuer: 'NSDC',
    learnerName: 'Amit Kumar',
    issueDate: '2024-07-10',
    nsqfLevel: 6,
    credits: 360,
    skills: ['Digital Marketing', 'SEO', 'Social Media', 'Analytics'],
    verificationStatus: 'verified',
    confidenceScore: 94.5,
    blockchainHash: '0x3c4d5e6f7890abcdef1234567890abcd',
    digitalSignature: true,
    qrCodePresent: true,
    category: 'Marketing'
  },
  {
    id: 'SIH2024_004',
    title: 'Blockchain Developer Certification',
    issuer: 'IIT Bombay',
    learnerName: 'Sneha Reddy',
    issueDate: '2024-09-01',
    nsqfLevel: 8,
    credits: 720,
    skills: ['Blockchain', 'Smart Contracts', 'Solidity', 'Web3'],
    verificationStatus: 'verified',
    confidenceScore: 97.3,
    blockchainHash: '0x4d5e6f7890abcdef1234567890abcdef',
    digitalSignature: true,
    qrCodePresent: true,
    category: 'Blockchain'
  },
  {
    id: 'SIH2024_005',
    title: 'Data Science & Analytics Professional',
    issuer: 'Indian Statistical Institute',
    learnerName: 'Vikash Singh',
    issueDate: '2024-08-05',
    nsqfLevel: 7,
    credits: 540,
    skills: ['Data Science', 'Statistics', 'R', 'Python', 'Tableau'],
    verificationStatus: 'verified',
    confidenceScore: 95.7,
    blockchainHash: '0x5e6f7890abcdef1234567890abcdef12',
    digitalSignature: true,
    qrCodePresent: true,
    category: 'Data Science'
  }
];

export const sihDemoEmployers = [
  {
    id: 'EMP_001',
    companyName: 'Tata Consultancy Services',
    industry: 'IT Services',
    verificationRequests: 2340,
    successfulVerifications: 2298,
    topSkillsRequired: ['Java', 'Python', 'Cloud Computing', 'AI/ML']
  },
  {
    id: 'EMP_002',
    companyName: 'Infosys Limited',
    industry: 'Technology',
    verificationRequests: 1890,
    successfulVerifications: 1876,
    topSkillsRequired: ['Full Stack Development', 'DevOps', 'Microservices']
  },
  {
    id: 'EMP_003',
    companyName: 'Wipro Technologies',
    industry: 'Digital Services',
    verificationRequests: 1560,
    successfulVerifications: 1534,
    topSkillsRequired: ['Cybersecurity', 'Data Analytics', 'Blockchain']
  }
];

export const sihDemoStats = {
  totalCertificatesVerified: 15847,
  governmentIssuers: 45,
  privateIssuers: 128,
  universitiesConnected: 67,
  averageVerificationTime: 2.3,
  successRate: 94.7,
  nsqfComplianceRate: 98.2,
  blockchainTransactions: 12456,
  qrCodesProcessed: 8934,
  digitalSignaturesVerified: 11234
};

export const sihDemoVerificationMethods = {
  digitalSignature: { weight: 30, successRate: 96.8 },
  blockchain: { weight: 25, successRate: 98.2 },
  apiValidation: { weight: 20, successRate: 94.5 },
  qrCode: { weight: 15, successRate: 92.1 },
  fileIntegrity: { weight: 10, successRate: 99.1 }
};

export const sihDemoNSQFMapping = {
  level1_2: { certificates: 2340, description: 'Basic Skills & Literacy' },
  level3_4: { certificates: 4560, description: 'Vocational & Technical Skills' },
  level5_6: { certificates: 5670, description: 'Diploma & Advanced Skills' },
  level7_8: { certificates: 2890, description: 'Bachelor & Professional' },
  level9_10: { certificates: 387, description: 'Master & Research Level' }
};

export const sihDemoIntegrations = [
  {
    name: 'DigiLocker',
    status: 'Connected',
    certificatesSync: 3456,
    lastSync: '2024-10-10T15:30:00Z'
  },
  {
    name: 'Skill India Digital',
    status: 'Connected', 
    certificatesSync: 2890,
    lastSync: '2024-10-10T14:45:00Z'
  },
  {
    name: 'NSDC Portal',
    status: 'Connected',
    certificatesSync: 4567,
    lastSync: '2024-10-10T16:00:00Z'
  },
  {
    name: 'UGC Academic Bank',
    status: 'In Progress',
    certificatesSync: 0,
    lastSync: null
  }
];
