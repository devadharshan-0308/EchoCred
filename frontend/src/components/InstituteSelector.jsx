import React, { useState, useEffect } from 'react';
import { institutesAPI } from '../services/api';

const InstituteSelector = ({ onInstituteSelect, onCredentialsFetch, userEmail }) => {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCredentials, setFetchingCredentials] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInstitutes();
  }, []);

  const loadInstitutes = async () => {
    try {
      setLoading(true);
      const response = await institutesAPI.getAll();
      if (response.success) {
        setInstitutes(response.institutes);
      }
    } catch (error) {
      setError('Failed to load institutes');
      console.error('Error loading institutes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteChange = (e) => {
    const instituteId = e.target.value;
    setSelectedInstitute(instituteId);
    
    if (instituteId && onInstituteSelect) {
      const institute = institutes.find(inst => inst.id === instituteId);
      onInstituteSelect(institute);
    }
  };

  const handleFetchCredentials = async () => {
    if (!selectedInstitute || !userEmail) {
      setError('Please select an institute and ensure you are logged in');
      return;
    }

    console.log('🔍 Fetching credentials for:', { selectedInstitute, userEmail });
    console.log('🔑 Token present:', !!localStorage.getItem('token'));

    try {
      setFetchingCredentials(true);
      setError('');
      
      console.log('📡 Making API call to fetch credentials...');
      const response = await institutesAPI.fetchCredentials(selectedInstitute, userEmail);
      console.log('📥 API Response received:', response);
      
      if (response && response.success) {
        console.log('✅ Success! Credentials found:', response.credentials?.length || 0);
        if (onCredentialsFetch) {
          console.log('📤 Calling onCredentialsFetch callback');
          onCredentialsFetch(response);
        } else {
          console.warn('⚠️ No onCredentialsFetch callback provided');
          setError('No callback function provided to handle credentials');
        }
      } else {
        console.error('❌ API returned error:', response);
        setError(response?.message || 'Failed to fetch credentials - no success flag');
      }
    } catch (error) {
      console.error('💥 Exception during fetch:', error);
      console.error('💥 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      setError(`Failed to fetch credentials: ${error.response?.data?.message || error.message}`);
    } finally {
      setFetchingCredentials(false);
      console.log('🏁 Fetch operation completed');
    }
  };

  const groupedInstitutes = institutes.reduce((groups, institute) => {
    const category = institute.type === 'NCVET_VERIFIED' ? 'NCVET Verified' : 'Industry Platforms';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(institute);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Select Institute to Fetch Credentials
      </h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Institute
          </label>
          <select
            value={selectedInstitute}
            onChange={handleInstituteChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an institute...</option>
            {Object.entries(groupedInstitutes).map(([category, categoryInstitutes]) => (
              <optgroup key={category} label={category}>
                {categoryInstitutes.map((institute) => (
                  <option key={institute.id} value={institute.id}>
                    {institute.badge} {institute.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedInstitute && (
          <div className="bg-gray-50 rounded-md p-4">
            {(() => {
              const institute = institutes.find(inst => inst.id === selectedInstitute);
              return institute ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{institute.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      institute.type === 'NCVET_VERIFIED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {institute.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Trust Level:</strong> {institute.trust_level.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Sectors:</strong> {institute.sectors.join(', ')}
                  </p>
                  {institute.nsqf_levels.length > 0 && (
                    <p className="text-sm text-gray-600">
                      <strong>NSQF Levels:</strong> {institute.nsqf_levels.join(', ')}
                    </p>
                  )}
                </div>
              ) : null;
            })()}
          </div>
        )}

        <button
          onClick={handleFetchCredentials}
          disabled={!selectedInstitute || !userEmail || fetchingCredentials}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            !selectedInstitute || !userEmail || fetchingCredentials
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {fetchingCredentials ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Fetching Credentials...
            </div>
          ) : (
            'Fetch My Credentials'
          )}
        </button>

        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p><strong>Selected Institute:</strong> {selectedInstitute || 'None'}</p>
          <p><strong>User Email:</strong> {userEmail || 'Not logged in'}</p>
          <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          <p>• NCVET Verified institutes provide government-recognized credentials</p>
          <p>• Industry platforms provide market-valuable but non-NSQF credentials</p>
        </div>
      </div>
    </div>
  );
};

export default InstituteSelector;
