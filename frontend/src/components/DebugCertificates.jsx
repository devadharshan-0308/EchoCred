import React, { useState } from 'react';
import axios from 'axios';

const DebugCertificates = ({ user }) => {
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const config = {
        method,
        url: `http://localhost:5000${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (body) {
        config.data = body;
      }
      
      console.log('🔍 Testing API:', config);
      console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');
      const response = await axios(config);
      
      const result = `✅ ${method} ${endpoint}\nStatus: ${response.status}\nResponse: ${JSON.stringify(response.data, null, 2)}\n\n`;
      setResults(prev => prev + result);
      
    } catch (error) {
      const result = `❌ ${method} ${endpoint}\nError: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}\n\n`;
      setResults(prev => prev + result);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      setResults('🔄 REFRESHING AUTHENTICATION...\n\n');
      
      // Re-login to get fresh token
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: user.email,
        password: 'password123' // Default password for test users
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        setResults(prev => prev + '✅ Authentication refreshed successfully!\n\n');
        return true;
      } else {
        setResults(prev => prev + '❌ Failed to refresh authentication\n\n');
        return false;
      }
    } catch (error) {
      setResults(prev => prev + `❌ Authentication refresh failed: ${error.message}\n\n`);
      return false;
    }
  };

  const runAllTests = async () => {
    setResults('🔍 DEBUGGING CERTIFICATE FETCHING...\n\n');
    
    // Add user info
    setResults(prev => prev + `👤 Current User: ${user.email}\n`);
    setResults(prev => prev + `🔑 Token Status: ${localStorage.getItem('token') ? 'Present' : 'Missing'}\n\n`);
    
    // Test 1: Old skill-valut-api endpoint
    await testAPI(`/api/skill-vault-api/certificates/${user.email}`);
    
    // Test 2: New credentials API
    await testAPI(`/api/credentials/all/${user.email}`);
    
    // Test 3: Search API
    await testAPI('/api/credentials/search', 'POST', {
      learner_email: user.email,
      institute_id: 'FUTURESKILL'
    });
    
    // Test 4: Simple API
    await testAPI('/api/simple/fetch-by-institute', 'POST', {
      institute_id: 'FUTURESKILL',
      learner_email: user.email
    });
    
    setResults(prev => prev + '🎉 ALL TESTS COMPLETED!\n');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Certificate Fetching Debug</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          User: <strong>{user.email}</strong>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Token: <strong>{localStorage.getItem('token') ? 'Present' : 'Missing'}</strong>
        </p>
        
        <div className="flex space-x-4">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing APIs...' : 'Run All API Tests'}
          </button>
          
          <button
            onClick={refreshToken}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Refresh Authentication
          </button>
        </div>
      </div>
      
      {results && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Test Results:</h4>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
            {results}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugCertificates;
