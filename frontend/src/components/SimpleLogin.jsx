import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimpleLogin = ({ onLoginSuccess, onShowRegister }) => {
  const [email, setEmail] = useState('alice.johnson@example.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('learner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend status on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get('http://localhost:5000/health', { timeout: 5000 });
        setBackendStatus('online');
        console.log('✅ Backend is online');
      } catch (error) {
        setBackendStatus('offline');
        console.error('❌ Backend is offline:', error.message);
      }
    };
    
    checkBackend();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login with:', email);
      console.log('🌐 Backend URL:', 'http://localhost:5000/api/auth/login');
      
      // Test backend connectivity first
      console.log('🔍 Testing backend connectivity...');
      await axios.get('http://localhost:5000/health');
      console.log('✅ Backend is reachable');
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        // Store token and user with selected role
        const userWithRole = {
          ...response.data.data.user,
          role: selectedRole
        };
        
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(userWithRole));
        
        console.log('✅ Token stored, calling onLoginSuccess with role:', selectedRole);
        onLoginSuccess(userWithRole);
      } else {
        setError('Login failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Login failed: ';
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage += 'Cannot connect to backend server. Please check if the backend is running on port 5000.';
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail, role = 'learner') => {
    setEmail(userEmail);
    setPassword('password123');
    setSelectedRole(role);
    // Trigger login automatically
    setTimeout(() => {
      document.getElementById('loginForm').requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">EchoCred</h1>
          <p className="text-gray-600 mt-2">Simple Certificate Verification</p>
          
          {/* Backend Status Indicator */}
          <div className="mt-4">
            {backendStatus === 'checking' && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                🔄 Checking backend...
              </div>
            )}
            {backendStatus === 'online' && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                ✅ Backend Online
              </div>
            )}
            {backendStatus === 'offline' && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                ❌ Backend Offline - Please start the backend server
              </div>
            )}
          </div>
        </div>

        <form id="loginForm" onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Login as</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="learner">👨‍🎓 Learner (View & Fetch Certificates)</option>
              <option value="employer">🏢 Employer (Verify Candidates)</option>
              <option value="issuer">🏛️ Issuer (Issue & Manage Certificates)</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Login Options */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Login (Test Different Roles)</h3>
          
          {/* Learner Options */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-blue-700 mb-2">👨‍🎓 As Learner:</h4>
            <div className="space-y-1">
              <button
                onClick={() => quickLogin('alice.johnson@example.com', 'learner')}
                className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border"
              >
                Alice Johnson (7 certificates)
              </button>
              <button
                onClick={() => quickLogin('bob.smith@example.com', 'learner')}
                className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border"
              >
                Bob Smith (7 certificates)
              </button>
              <button
                onClick={() => quickLogin('diana.patel@example.com', 'learner')}
                className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border"
              >
                Diana Patel (9 certificates)
              </button>
              <button
                onClick={() => quickLogin('charlie.lee@example.com', 'learner')}
                className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border"
              >
                Charlie Lee (5 certificates)
              </button>
            </div>
          </div>

          {/* Employer Options */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-purple-700 mb-2">🏢 As Employer:</h4>
            <div className="space-y-1">
              <button
                onClick={() => quickLogin('alice.johnson@example.com', 'employer')}
                className="w-full text-left px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 rounded border"
              >
                HR Manager (Verify Candidates)
              </button>
            </div>
          </div>

          {/* Issuer Options */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-green-700 mb-2">🏛️ As Issuer:</h4>
            <div className="space-y-1">
              <button
                onClick={() => quickLogin('bob.smith@example.com', 'issuer')}
                className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded border"
              >
                FutureSkills Prime (Issue Certificates)
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            All test users have password: <code>password123</code>
          </p>
        </div>

        {/* Registration Link */}
        <div className="mt-6 text-center border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
          <button
            onClick={onShowRegister}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
