import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InstituteSelector from '../components/InstituteSelector';
import NSQFProgress from '../components/NSQFProgress';
import CredentialCard from '../components/CredentialCard';
import DigiLockerSimulator from '../components/DigiLockerSimulator';
import { blockchainAPI } from '../services/api';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [nsqfProgress, setNsqfProgress] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadBlockchainStats();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadBlockchainStats = async () => {
    try {
      const response = await blockchainAPI.getStats();
      if (response.success) {
        setBlockchainStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading blockchain stats:', error);
    }
  };

  const handleCredentialsFetched = (fetchResult) => {
    if (fetchResult.success && fetchResult.credentials) {
      setCredentials(prevCredentials => {
        // Merge new credentials with existing ones, avoiding duplicates
        const existingIds = prevCredentials.map(c => c.credential_id);
        const newCredentials = fetchResult.credentials.filter(
          c => !existingIds.includes(c.credential_id)
        );
        return [...prevCredentials, ...newCredentials];
      });

      // Update NSQF progress if provided
      if (fetchResult.nsqf_progress) {
        setNsqfProgress(fetchResult.nsqf_progress);
      }
    }
  };

  const handleInstituteCredentialsFetch = (fetchResult) => {
    console.log('🎯 EnhancedDashboard received fetch result:', fetchResult);
    if (fetchResult.success && fetchResult.credentials) {
      console.log('✅ Passing to handleCredentialsFetched with', fetchResult.credentials.length, 'credentials');
      handleCredentialsFetched(fetchResult);
    } else {
      console.error('❌ Fetch result invalid:', { success: fetchResult.success, hasCredentials: !!fetchResult.credentials });
    }
  };

  const calculateNSQFProgress = (creds) => {
    const ncvetCredentials = creds.filter(
      cred => cred.institute_info?.type === 'NCVET_VERIFIED' && cred.nsqf_level
    );

    if (ncvetCredentials.length === 0) {
      return {
        current_level: 0,
        max_level: 10,
        progress_percentage: 0,
        total_credits: 0,
        pathway_status: 'No NSQF credentials found',
        ncvet_credentials_count: 0
      };
    }

    const maxLevel = Math.max(...ncvetCredentials.map(c => c.nsqf_level));
    const totalCredits = ncvetCredentials.reduce((sum, c) => sum + (c.credit_points || 0), 0);
    
    let pathwayStatus = '';
    let progressPercentage = 0;

    if (maxLevel >= 8) {
      pathwayStatus = 'Eligible for Post-Graduate Programs';
      progressPercentage = 100;
    } else if (maxLevel >= 6) {
      pathwayStatus = 'Eligible for Graduate Programs';
      progressPercentage = 75;
    } else if (maxLevel >= 4) {
      pathwayStatus = 'Eligible for Diploma Programs';
      progressPercentage = 50;
    } else {
      pathwayStatus = 'Building towards Diploma eligibility';
      progressPercentage = 25;
    }

    return {
      current_level: maxLevel,
      max_level: 10,
      progress_percentage: progressPercentage,
      total_credits: totalCredits,
      pathway_status: pathwayStatus,
      ncvet_credentials_count: ncvetCredentials.length
    };
  };

  // Update NSQF progress when credentials change
  useEffect(() => {
    if (credentials.length > 0) {
      const progress = calculateNSQFProgress(credentials);
      setNsqfProgress(progress);
    }
  }, [credentials]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Debug logging
  console.log('🔍 Total credentials:', credentials.length);
  console.log('🔍 Credentials data:', credentials);
  
  const ncvetCredentials = credentials.filter(c => {
    console.log('🔍 Checking credential:', c.credential_id, 'institute_info:', c.institute_info);
    return c.institute_info?.type === 'NCVET_VERIFIED';
  });
  const industryCredentials = credentials.filter(c => c.institute_info?.type === 'NON_NCVET');
  
  console.log('🔍 NCVET credentials:', ncvetCredentials.length);
  console.log('🔍 Industry credentials:', industryCredentials.length);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EchoCred</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {credentials.length} credentials • {ncvetCredentials.length} NCVET verified
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
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
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'fetch', name: 'Fetch Credentials', icon: '🔄' },
              { id: 'digilocker', name: 'DigiLocker', icon: '🏛️' },
              { id: 'blockchain', name: 'Blockchain', icon: '⛓️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* NSQF Progress */}
            <NSQFProgress nsqfData={nsqfProgress} credentials={credentials} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-blue-600">{credentials.length}</div>
                <div className="text-sm text-gray-600">Total Credentials</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-green-600">{ncvetCredentials.length}</div>
                <div className="text-sm text-gray-600">NCVET Verified</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-yellow-600">{industryCredentials.length}</div>
                <div className="text-sm text-gray-600">Industry Platforms</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {blockchainStats?.total_transactions || 0}
                </div>
                <div className="text-sm text-gray-600">Blockchain Records</div>
              </div>
            </div>

            {/* Credentials Display */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Credentials</h2>
              
              {credentials.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📜</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Credentials Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start by fetching your credentials from institutes or DigiLocker
                  </p>
                  <button
                    onClick={() => setActiveTab('fetch')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    Fetch Credentials
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* DEBUG: Show ALL credentials */}
                  {credentials.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-medium text-yellow-800 mb-4">
                        🔍 DEBUG: All Fetched Credentials ({credentials.length})
                      </h3>
                      <div className="space-y-2">
                        {credentials.map((credential, index) => (
                          <div key={index} className="text-sm bg-white p-2 rounded border">
                            <strong>{credential.credential_id}</strong> - {credential.course_name} 
                            <br />
                            <span className="text-gray-600">
                              Institute: {credential.issuer} | Type: {credential.institute_info?.type || 'NO TYPE'} | Status: {credential.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* NCVET Verified Credentials */}
                  {ncvetCredentials.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-green-800 mb-4 flex items-center">
                        <span className="mr-2">✅</span>
                        NCVET Verified Credentials ({ncvetCredentials.length})
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {ncvetCredentials.map((credential) => (
                          <CredentialCard
                            key={credential.credential_id}
                            credential={credential}
                            showBlockchainInfo={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Industry Credentials */}
                  {industryCredentials.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-yellow-800 mb-4 flex items-center">
                        <span className="mr-2">⚠️</span>
                        Industry Platform Credentials ({industryCredentials.length})
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {industryCredentials.map((credential) => (
                          <CredentialCard
                            key={credential.credential_id}
                            credential={credential}
                            showBlockchainInfo={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fetch Credentials Tab */}
        {activeTab === 'fetch' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Fetch Credentials from Institutes</h2>
              <p className="text-gray-600 mb-6">
                Select an institute and enter your registered email to fetch your credentials directly from their system.
              </p>
            </div>
            
            <InstituteSelector
              onInstituteSelect={setSelectedInstitute}
              onCredentialsFetch={handleInstituteCredentialsFetch}
              userEmail={user?.email}
            />

            {selectedInstitute && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Selected Institute</h3>
                <p className="text-blue-700">{selectedInstitute.name}</p>
                <p className="text-sm text-blue-600">{selectedInstitute.badge}</p>
              </div>
            )}
          </div>
        )}

        {/* DigiLocker Tab */}
        {activeTab === 'digilocker' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">DigiLocker Integration</h2>
              <p className="text-gray-600 mb-6">
                Simulate fetching all your verified credentials from DigiLocker, India's digital document wallet.
              </p>
            </div>
            
            <DigiLockerSimulator
              userEmail={user?.email}
              onCredentialsFetched={handleCredentialsFetched}
            />
          </div>
        )}

        {/* Blockchain Tab */}
        {activeTab === 'blockchain' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Blockchain Verification</h2>
              <p className="text-gray-600 mb-6">
                View blockchain statistics and verify credential authenticity through our tamper-proof ledger.
              </p>
            </div>

            {blockchainStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {blockchainStats.total_transactions}
                  </div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {blockchainStats.government_verified}
                  </div>
                  <div className="text-sm text-gray-600">Government Verified</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {blockchainStats.industry_verified}
                  </div>
                  <div className="text-sm text-gray-600">Industry Verified</div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Blockchain Integrity</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Blockchain Verified</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                All credentials are stored with tamper-proof hashes in our blockchain simulation.
                This ensures the authenticity and integrity of your credentials.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;
