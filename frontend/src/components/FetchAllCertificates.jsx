import React, { useState } from 'react';
import axios from 'axios';

const FetchAllCertificates = ({ user, onCertificatesFetched }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAllCertificates = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Fetching ALL certificates for user:', user.email);
      
      // Call the fetch-all-certificates endpoint
      const response = await axios.post(
        'http://localhost:5000/api/simple/fetch-all-certificates',
        {
          learner_email: user.email
        },
        {
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Fetch All Response:', response.data);

      if (response.data.success) {
        const { certificates, total_certificates, institutes_found } = response.data;
        
        setSuccess(`Successfully fetched ${total_certificates} certificates from ${institutes_found} institutes!`);
        
        // Call the callback to update parent component
        if (onCertificatesFetched) {
          onCertificatesFetched(certificates);
        }
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
        
      } else {
        setError('Failed to fetch certificates: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Fetch All Error:', error);
      setError('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <div className="text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-xl font-bold text-blue-900 mb-2">Fetch All Certificates</h3>
        <p className="text-blue-700 mb-6">
          Click below to fetch ALL your certificates from ALL institutes at once
        </p>
        
        <button
          onClick={fetchAllCertificates}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Fetching All Certificates...</span>
            </>
          ) : (
            <>
              <span>🔄 Fetch All My Certificates</span>
            </>
          )}
        </button>

        {/* Success Message */}
        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            ✅ {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            ❌ {error}
          </div>
        )}

        <div className="mt-4 text-xs text-blue-600">
          <p>• Fetches from UDEMY, COURSERA, FUTURESKILL, NCCT, UNIVERSITY</p>
          <p>• Automatically organizes certificates by institute</p>
          <p>• Updates your certificate list instantly</p>
        </div>
      </div>
    </div>
  );
};

export default FetchAllCertificates;
