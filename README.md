# EchoCred - Enterprise Certificate Verification Platform

<div align="center">
  <h3>🏆 Smart India Hackathon 2025 </h3>
  <p><em>Full-stack certificate verification platform with blockchain simulation</em></p>
  
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
</div>

## 🚀 Overview

EchoCred is a full-stack certificate verification platform designed to combat credential fraud and streamline the verification process for educational institutions, employers, and certification bodies. Built with Node.js backend and React frontend.

### ✨ Key Features

- **🔐 Dual-Layer Verification**: API validation and blockchain simulation
- **👥 Multi-Role Support**: Learners, employers, issuers, and administrators
- **🏛️ NSQF Compliance**: Aligned with National Skills Qualifications Framework
- **⚡ Real-time Verification**: Instant certificate validation and status updates
- **🔒 Enterprise Security**: JWT authentication, rate limiting, and data encryption
- **📊 Analytics Dashboard**: Comprehensive verification statistics and insights
- **📁 Certificate Management**: Upload, download, and organize certificates
- **🏢 Institute Integration**: Support for multiple certification bodies

## 🏗️ Architecture

```
EchoCred/
├── backend/                 # Node.js Express API server
├── frontend/               # React.js web application
└── EchoCred-api/       # Mock data generators (Python)
```

### Technology Stack

**Backend:**
- Node.js with Express.js framework
- MongoDB with Mongoose ODM
- JWT authentication & bcrypt encryption
- Winston logging & Express rate limiting

**Frontend:**
- React.js 18 with modern hooks
- Tailwind CSS for styling
- Lucide React for icons
- Framer Motion for animations
- Recharts for data visualization

**Mock Services:**
- Python scripts for mock certificate data
- Mock blockchain implementation for verification
- Support for multiple institutes (FUTURESKILL, NCCT, UNIVERSITY, UDEMY, COURSERA)

## 🚀 Quick Start

### Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/echocred.git
   cd echocred
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your MongoDB Atlas connection in .env
   npm run seed-atlas  # Seed test data
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=your_mongodb_atlas_connection_string
DB_NAME=echocred

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# API Keys
BLOCKCHAIN_API_KEY=your_blockchain_api_key
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get user profile
- `POST /api/auth/logout` - User logout

### Certificate Management
- `GET /api/simple/certificates/{email}` - Get user certificates
- `POST /api/simple/fetch-by-institute` - Fetch by institute
- `GET /api/simple/test-data` - View test data
- `POST /api/certificates/verify` - Verify certificate
- `POST /api/certificates/upload` - Upload certificate
- `GET /api/certificates/download/{id}` - Download certificate

## 👥 Test Credentials

The system comes pre-seeded with test users:

| Email | Password | Certificates |
|-------|----------|-------------|
| alice.johnson@example.com | password123 | 7 certificates |
| bob.smith@example.com | password123 | 7 certificates |
| diana.patel@example.com | password123 | 9 certificates |
| charlie.lee@example.com | password123 | 5 certificates |

## 🔍 Verification Methods

### 1. API Validation (50% Weight)
- Required fields validation (credential_id, learner_email, course_name, issuer)
- Email format validation
- Status verification (VERIFIED, GOVERNMENT_VERIFIED, INDUSTRY_VERIFIED)
- Issuer authenticity checks

### 2. Mock Blockchain Verification (50% Weight)
- Mock blockchain ledger with block structure
- Certificate hash storage and retrieval
- Block index and transaction hash generation
- Immutable record simulation with integrity validation

## 📊 Features Overview

### For Learners
- **Certificate Portfolio**: Centralized certificate management
- **Verification Status**: Real-time verification tracking
- **Upload & Download**: Certificate file management
- **Dashboard Analytics**: Personal verification statistics

### For Employers
- **Bulk Verification**: Verify multiple certificates simultaneously
- **Candidate Profiles**: Comprehensive skill assessments
- **Verification Reports**: Detailed authenticity reports
- **Integration APIs**: Connect with HR systems

### For Institutions
- **Certificate Issuance**: Digital certificate generation
- **Verification Dashboard**: Monitor verification requests
- **Analytics**: Usage statistics and trends
- **API Integration**: Connect with existing systems

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API abuse prevention
- **Data Encryption**: End-to-end data protection
- **Input Validation**: SQL injection and XSS prevention
- **CORS Configuration**: Cross-origin request security
- **Helmet.js**: Security headers implementation

## 📈 Performance

- **Response Time**: < 200ms average API response
- **Scalability**: Horizontal scaling support
- **Caching**: Redis integration for improved performance
- **CDN Ready**: Static asset optimization
- **Database Indexing**: Optimized MongoDB queries

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE-SETUP.md)
- [Architecture Guide](./docs/PROCESS_FLOW_ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Smart India Hackathon 2025

This project was developed for the Smart India Hackathon 2024, addressing the critical need for reliable certificate verification in India's rapidly growing digital education ecosystem.

### Problem Statement
- Certificate fraud costs Indian industries ₹50,000+ crores annually
- Manual verification processes are time-consuming and error-prone
- Lack of standardized verification protocols across institutions

### Our Solution
EchoCred provides a unified, secure, and scalable platform that:
- Reduces verification time from days to seconds
- Eliminates certificate fraud through multi-layer validation
- Provides NSQF-compliant verification standards
- Offers seamless integration with existing systems

## 🌟 Acknowledgments

- Smart India Hackathon organizing committee
- Ministry of Education, Government of India
- All contributing developers and testers
- Open source community for amazing tools and libraries

## 📞 Support

For support and queries:
- 📧 Email: devadharshan03082006@gmail.com 
- 🐛 Issues: [GitHub Issues](https://github.com/devadharshan-0308/EchoCred/issues) 

---

<div align="center">
  <p>Made with ❤️ for Smart India Hackathon 2024</p>
  <p><strong>EchoCred - Verifying Excellence, Ensuring Trust</strong></p>
</div>
