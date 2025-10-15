import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployerDashboard = ({ user, onLogout }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  // const [selectedCandidate, setSelectedCandidate] = useState(null); // Future use

  const sampleCandidates = [
    'alice.johnson@example.com',
    'bob.smith@example.com',
    'charlie.lee@example.com',
    'diana.patel@example.com',
    'ethan.brown@example.com'
  ];

  useEffect(() => {
    loadVerificationHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadVerificationHistory = () => {
    // Mock verification history
    const mockHistory = [
      {
        id: 1,
        candidateEmail: 'alice.johnson@example.com',
        candidateName: 'Alice Johnson',
        verifiedAt: '2025-10-11T10:30:00Z',
        certificatesFound: 7,
        ncvetCertificates: 4,
        status: 'verified',
        position: 'Software Developer'
      },
      {
        id: 2,
        candidateEmail: 'bob.smith@example.com',
        candidateName: 'Bob Smith',
        verifiedAt: '2025-10-10T14:15:00Z',
        certificatesFound: 5,
        ncvetCertificates: 3,
        status: 'verified',
        position: 'Data Analyst'
      }
    ];
    setVerificationHistory(mockHistory);
  };

  const searchCandidate = async () => {
    if (!searchEmail) {
      setError('Please enter a candidate email');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const token = localStorage.getItem('token');
      const institutes = ['FUTURESKILL', 'NCCT', 'UNIVERSITY', 'UDEMY', 'COURSERA'];
      const allCertificates = [];

      // Search across all institutes
      for (const instituteId of institutes) {
        try {
          const response = await axios.post(
            'http://localhost:5000/api/simple/fetch-by-institute',
            {
              institute_id: instituteId,
              learner_email: searchEmail
            },
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          if (response.data.success && response.data.credentials) {
            allCertificates.push(...response.data.credentials);
          }
        } catch (error) {
          console.warn(`Failed to search ${instituteId}:`, error.message);
        }
      }

      setSearchResults(allCertificates);
      
      // Add to verification history
      const newVerification = {
        id: Date.now(),
        candidateEmail: searchEmail,
        candidateName: searchEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        verifiedAt: new Date().toISOString(),
        certificatesFound: allCertificates.length,
        ncvetCertificates: allCertificates.filter(c => c.status === 'GOVERNMENT_VERIFIED').length,
        status: allCertificates.length > 0 ? 'verified' : 'no_certificates',
        position: 'Candidate'
      };
      
      setVerificationHistory(prev => [newVerification, ...prev]);

    } catch (error) {
      setError('Search failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const verifyCertificate = async (certificate) => {
    try {
      // const token = localStorage.getItem('token'); // Future use for API calls
      // Mock verification call
      console.log('Verifying certificate:', certificate.credential_id);
      
      // Update certificate status
      setSearchResults(prev => 
        prev.map(cert => 
          cert.credential_id === certificate.credential_id 
            ? { ...cert, employer_verified: true, verification_score: 95 }
            : cert
        )
      );
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Candidate Credentials</h3>
        
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate Email Address
            </label>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter candidate's email address"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchCandidate}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search & Verify'}
            </button>
          </div>
        </div>

        {/* Quick Search Buttons */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Quick search sample candidates:</p>
          <div className="flex flex-wrap gap-2">
            {sampleCandidates.map((email) => (
              <button
                key={email}
                onClick={() => setSearchEmail(email)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                {email}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Verification Results for {searchEmail}
            </h3>
            <div className="flex space-x-4 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                ✅ {searchResults.filter(c => c.status === 'GOVERNMENT_VERIFIED').length} NCVET Verified
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                ⚠️ {searchResults.filter(c => c.status === 'INDUSTRY_VERIFIED').length} Industry Certified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {searchResults.map((cert, index) => (
              <div key={cert.credential_id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{cert.course_name}</h4>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cert.status === 'GOVERNMENT_VERIFIED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cert.status === 'GOVERNMENT_VERIFIED' ? 'NCVET' : 'Industry'}
                    </span>
                    {cert.employer_verified && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p><strong>ID:</strong> {cert.credential_id}</p>
                  <p><strong>Completed:</strong> {new Date(cert.completion_date).toLocaleDateString()}</p>
                  {cert.nsqf_level && <p><strong>NSQF Level:</strong> {cert.nsqf_level}</p>}
                  {cert.grade && <p><strong>Grade:</strong> {cert.grade}</p>}
                  {cert.verification_score && (
                    <p><strong>Verification Score:</strong> {cert.verification_score}%</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => verifyCertificate(cert)}
                    disabled={cert.employer_verified}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {cert.employer_verified ? 'Verified' : 'Verify'}
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    View Details
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                    Download Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults.length === 0 && searchEmail && !loading && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <p>No certificates found for {searchEmail}</p>
            <p className="text-sm mt-2">The candidate may not have any certificates from our partner institutes</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification History</h3>
        
        {verificationHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>No verification history yet</p>
            <p className="text-sm mt-2">Start by searching for candidates in the Search tab</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verificationHistory.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{record.candidateName}</h4>
                    <p className="text-sm text-gray-600">{record.candidateEmail}</p>
                    <p className="text-sm text-gray-600">Position: {record.position}</p>
                    <p className="text-xs text-gray-500">
                      Verified on {new Date(record.verifiedAt).toLocaleDateString()} at {new Date(record.verifiedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      record.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status === 'verified' ? '✅ Verified' : '❌ No Certificates'}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Total: {record.certificatesFound}</div>
                      <div>NCVET: {record.ncvetCertificates}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button 
                    onClick={() => setSearchEmail(record.candidateEmail)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Search Again
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                    Download Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{verificationHistory.length}</div>
          <div className="text-sm text-gray-600">Total Verifications</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">
            {verificationHistory.filter(r => r.status === 'verified').length}
          </div>
          <div className="text-sm text-gray-600">Successful Verifications</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-yellow-600">
            {verificationHistory.reduce((sum, r) => sum + r.certificatesFound, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Certificates Found</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600">
            {verificationHistory.reduce((sum, r) => sum + r.ncvetCertificates, 0)}
          </div>
          <div className="text-sm text-gray-600">NCVET Certificates</div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Trends</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p>Analytics dashboard coming soon</p>
          <p className="text-sm mt-2">Track verification patterns, success rates, and candidate insights</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="text-sm text-gray-600">
                Verify candidate credentials • {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                🏢 Employer
              </span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'search', name: 'Verify Candidates', icon: '🔍' },
              { id: 'history', name: 'Verification History', icon: '📋' },
              { id: 'analytics', name: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
};

export default EmployerDashboard;
