import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Certificates API
export const certificatesAPI = {
  // Get all certificates
  list: async () => {
    const response = await api.get('/microcreds/list');
    return response.data;
  },

  // Upload certificate
  upload: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const response = await api.post('/microcreds/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Fetch certificates from external APIs
  fetch: async () => {
    const response = await api.post('/microcreds/fetch');
    return response.data;
  },

  // Verify certificate by ID
  verify: async (id) => {
    const response = await api.get(`/microcreds/verify/${id}`);
    return response.data;
  },

  // Download certificate
  download: async (id) => {
    const response = await api.get(`/microcreds/download/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download certificate from external API
  downloadExternal: async (certificateId) => {
    const response = await api.get(`/certificates/download/${certificateId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get certificate details from external API
  getDetails: async (instituteId, certificateId) => {
    const response = await api.get(`/certificates/details/${instituteId}/${certificateId}`);
    return response.data;
  },

  // Check external API health
  checkExternalHealth: async () => {
    const response = await api.get('/certificates/health');
    return response.data;
  },
};

// Institutes API
export const institutesAPI = {
  // Get all institutes
  getAll: async () => {
    const response = await api.get('/institutes');
    return response.data;
  },

  // Get NCVET verified institutes only
  getNCVET: async () => {
    const response = await api.get('/institutes/categories/ncvet');
    return response.data;
  },

  // Get industry institutes only
  getIndustry: async () => {
    const response = await api.get('/institutes/categories/industry');
    return response.data;
  },

  // Fetch credentials from specific institute (using simple endpoint)
  fetchCredentials: async (instituteId, learnerEmail) => {
    const response = await api.post('/simple/fetch-by-institute', {
      institute_id: instituteId,
      learner_email: learnerEmail
    });
    return response.data;
  },

  // Simulate DigiLocker fetch
  digiLockerFetch: async (learnerEmail) => {
    const response = await api.post('/institutes/digilocker-fetch', {
      learner_email: learnerEmail
    });
    return response.data;
  },

  // Get specific institute details
  getInstitute: async (instituteId) => {
    const response = await api.get(`/institutes/${instituteId}`);
    return response.data;
  }
};

// Blockchain API
export const blockchainAPI = {
  // Get blockchain ledger
  getLedger: async (limit = 50) => {
    const response = await api.get(`/blockchain/ledger?limit=${limit}`);
    return response.data;
  },

  // Get blockchain statistics
  getStats: async () => {
    const response = await api.get('/blockchain/stats');
    return response.data;
  },

  // Add credential to blockchain
  addCredential: async (credentialData) => {
    const response = await api.post('/blockchain/add', credentialData);
    return response.data;
  },

  // Verify credential hash
  verifyHash: async (hash) => {
    const response = await api.get(`/blockchain/verify?hash=${hash}`);
    return response.data;
  },

  // Get learner's blockchain transactions
  getLearnerTransactions: async (email) => {
    const response = await api.get(`/blockchain/learner/${email}`);
    return response.data;
  },

  // Validate blockchain integrity
  validateIntegrity: async () => {
    const response = await api.get('/blockchain/validate');
    return response.data;
  },

  // Generate hash for credential
  generateHash: async (credentialData) => {
    const response = await api.post('/blockchain/generate-hash', credentialData);
    return response.data;
  }
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await axios.get('http://localhost:3000/health');
    return response.data;
  },
};

export default api;