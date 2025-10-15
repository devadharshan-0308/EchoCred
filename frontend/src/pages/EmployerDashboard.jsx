import React, { useState, useEffect } from 'react';
import { certificatesAPI, institutesAPI } from '../services/api';
import toast from 'react-hot-toast';

const EmployerDashboard = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [verificationHistory, setVerificationHistory] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchInstitutes();
    loadVerificationHistory();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await institutesAPI.getAll();
      if (response.success) {
        setInstitutes(response.institutes);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
    }
  };

  const loadVerificationHistory = () => {
    const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
    setVerificationHistory(history);
  };

  const saveVerificationHistory = (verification) => {
    const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
    history.unshift({
      ...verification,
      timestamp: new Date().toISOString(),
      verifiedBy: user.name
    });
    localStorage.setItem('verificationHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50
    setVerificationHistory(history.slice(0, 50));
  };

  const searchCandidateCredentials = async () => {
    if (!searchEmail.trim()) {
      toast.error('Please enter candidate email');
      return;
    }

    setLoading(true);
    try {
      let results = [];

      if (selectedInstitute) {
        // Search specific institute
        const response = await institutesAPI.fetchCredentials(selectedInstitute, searchEmail);
        if (response.success && response.credentials.length > 0) {
          results = response.credentials;
        }
      } else {
        // Search all institutes via DigiLocker simulation
        const response = await institutesAPI.digiLockerFetch(searchEmail);
        if (response.success && response.credentials.length > 0) {
          results = response.credentials;
        }
      }

      setSearchResults(results);

      if (results.length === 0) {
        toast.info('No credentials found for this candidate');
      } else {
        toast.success(`Found ${results.length} credentials`);
        
        // Save to verification history
        saveVerificationHistory({
          candidateEmail: searchEmail,
          institute: selectedInstitute || 'All Institutes',
          credentialsFound: results.length,
          status: 'verified'
        });
      }

    } catch (error) {
      console.error('Error searching credentials:', error);
      toast.error('Failed to search credentials');
    } finally {
      setLoading(false);
    }
  };

  const getTrustBadge = (credential) => {
    const isNCVET = credential.institute_info?.type === 'NCVET_VERIFIED';
    return {
      text: isNCVET ? '✅ Government Verified' : '⚠️ Industry Recognized',
      bgColor: isNCVET ? 'bg-green-100' : 'bg-yellow-100',
      textColor: isNCVET ? 'text-green-800' : 'text-yellow-800'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Verify candidate credentials and qualifications
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Employer</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-medium text-sm">🏢</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Search Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                🔍 Candidate Credential Verification
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate Email Address
                  </label>
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter candidate's email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Institute (Optional)
                  </label>
                  <select
                    value={selectedInstitute}
                    onChange={(e) => setSelectedInstitute(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Institutes</option>
                    <optgroup label="NCVET Verified">
                      {institutes.filter(inst => inst.type === 'NCVET_VERIFIED').map(institute => (
                        <option key={institute.id} value={institute.id}>
                          {institute.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Industry Platforms">
                      {institutes.filter(inst => inst.type === 'NON_NCVET').map(institute => (
                        <option key={institute.id} value={institute.id}>
                          {institute.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <button
                  onClick={searchCandidateCredentials}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-purple-400 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    '🔍 Verify Credentials'
                  )}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Verification Results ({searchResults.length} credentials found)
                </h3>
                
                <div className="space-y-4">
                  {searchResults.map((credential, index) => {
                    const trustBadge = getTrustBadge(credential);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{credential.course_name}</h4>
                            <p className="text-sm text-gray-600">{credential.institute_info?.name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${trustBadge.bgColor} ${trustBadge.textColor}`}>
                            {trustBadge.text}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Certificate ID:</span> {credential.credential_id}
                          </div>
                          <div>
                            <span className="font-medium">Grade:</span> {credential.grade}
                          </div>
                          <div>
                            <span className="font-medium">Completion Date:</span> {credential.completion_date}
                          </div>
                          {credential.nsqf_level && (
                            <div>
                              <span className="font-medium">NSQF Level:</span> {credential.nsqf_level}
                            </div>
                          )}
                        </div>
                        
                        {credential.skills && (
                          <div className="mt-3">
                            <span className="font-medium text-sm">Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {credential.skills.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Verifications</span>
                  <span className="font-semibold">{verificationHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available Institutes</span>
                  <span className="font-semibold">{institutes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">NCVET Verified</span>
                  <span className="font-semibold text-green-600">
                    {institutes.filter(i => i.type === 'NCVET_VERIFIED').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Verifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Verifications</h3>
              <div className="space-y-3">
                {verificationHistory.slice(0, 5).map((verification, index) => (
                  <div key={index} className="border-l-4 border-purple-400 pl-3 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {verification.candidateEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      {verification.credentialsFound} credentials found
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(verification.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {verificationHistory.length === 0 && (
                  <p className="text-sm text-gray-500">No verifications yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
