import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimpleDashboard = ({ user, onLogout }) => {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Available institutes (hardcoded for simplicity)
  const availableInstitutes = [
    { id: 'FUTURESKILL', name: 'FutureSkills Prime', type: 'NCVET_VERIFIED' },
    { id: 'NCCT', name: 'National Council for Cement and Building Materials', type: 'NCVET_VERIFIED' },
    { id: 'UNIVERSITY', name: 'University Grants Commission', type: 'NCVET_VERIFIED' },
    { id: 'UDEMY', name: 'Udemy Business', type: 'NON_NCVET' },
    { id: 'COURSERA', name: 'Coursera Learning Platform', type: 'NON_NCVET' }
  ];

  useEffect(() => {
    setInstitutes(availableInstitutes);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCertificates = async () => {
    if (!selectedInstitute) {
      setError('Please select an institute');
      return;
    }

    setLoading(true);
    setError('');
    setCertificates([]);

    try {
      console.log('🔍 Fetching certificates from:', selectedInstitute, 'for:', user.email);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/simple/fetch-by-institute',
        {
          institute_id: selectedInstitute,
          learner_email: user.email
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📥 API Response:', response.data);

      if (response.data.success) {
        setCertificates(response.data.credentials || []);
        console.log('✅ Found', response.data.credentials?.length || 0, 'certificates');
      } else {
        setError('Failed to fetch certificates: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EchoCred</h1>
              <p className="text-sm text-gray-600">Welcome, {user.firstName} {user.lastName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Fetch Your Certificates</h2>
          
          {/* Institute Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Institute
            </label>
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an institute...</option>
              {institutes.map((institute) => (
                <option key={institute.id} value={institute.id}>
                  {institute.name} {institute.type === 'NCVET_VERIFIED' ? '✅' : '⚠️'}
                </option>
              ))}
            </select>
          </div>

          {/* Fetch Button */}
          <button
            onClick={fetchCertificates}
            disabled={loading || !selectedInstitute}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fetching...' : 'Fetch My Certificates'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Debug Info */}
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p><strong>User Email:</strong> {user.email}</p>
            <p><strong>Selected Institute:</strong> {selectedInstitute || 'None'}</p>
            <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          </div>

          {/* Certificates Display */}
          {certificates.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Found {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-4">
                {certificates.map((cert, index) => (
                  <div key={cert.credential_id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {cert.course_name || cert.course_title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Certificate ID:</strong> {cert.credential_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Issuer:</strong> {cert.issuer}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Status:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            cert.status === 'GOVERNMENT_VERIFIED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cert.status}
                          </span>
                        </p>
                        {cert.completion_date && (
                          <p className="text-sm text-gray-600">
                            <strong>Completed:</strong> {new Date(cert.completion_date).toLocaleDateString()}
                          </p>
                        )}
                        {cert.nsqf_level && (
                          <p className="text-sm text-gray-600">
                            <strong>NSQF Level:</strong> {cert.nsqf_level}
                          </p>
                        )}
                        {cert.credit_points && (
                          <p className="text-sm text-gray-600">
                            <strong>Credit Points:</strong> {cert.credit_points}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {cert.institute_info?.type === 'NCVET_VERIFIED' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ NCVET Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⚠️ Industry Platform
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Certificates Message */}
          {!loading && certificates.length === 0 && selectedInstitute && !error && (
            <div className="mt-8 text-center py-8 text-gray-500">
              <p>No certificates found for this institute.</p>
              <p className="text-sm mt-2">Try selecting a different institute.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
