import React, { useState } from 'react';
import { institutesAPI } from '../services/api';

const DigiLockerSimulator = ({ userEmail, onCredentialsFetched }) => {
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);
  const [error, setError] = useState('');

  const simulateDigiLockerFetch = async () => {
    if (!userEmail) {
      setError('Please ensure you are logged in');
      return;
    }

    try {
      setFetching(true);
      setError('');
      setFetchResult(null);

      const response = await institutesAPI.digiLockerFetch(userEmail);
      
      if (response.success) {
        setFetchResult(response);
        if (onCredentialsFetched) {
          onCredentialsFetched(response);
        }
      } else {
        setError(response.error || 'DigiLocker fetch failed');
      }
    } catch (error) {
      setError('Failed to connect to DigiLocker simulation');
      console.error('DigiLocker fetch error:', error);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">DigiLocker Integration</h3>
            <p className="text-sm text-gray-600">Government's Digital Document Wallet</p>
          </div>
        </div>
        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          SIMULATION
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-3">
          DigiLocker automatically aggregates your verified credentials from multiple government 
          and approved institutions. This simulation demonstrates how credentials would be fetched 
          from your DigiLocker account.
        </p>
        
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">What DigiLocker Provides:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• ✅ NCVET verified credentials (automatically trusted)</li>
            <li>• ⚠️ Industry platform certificates (stored but not NSQF aligned)</li>
            <li>• 🔒 Government-grade security and authenticity</li>
            <li>• 📊 Automatic NSQF level mapping for verified credentials</li>
          </ul>
        </div>
      </div>

      <button
        onClick={simulateDigiLockerFetch}
        disabled={!userEmail || fetching}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
          !userEmail || fetching
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
        }`}
      >
        {fetching ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            <div className="text-left">
              <div>Connecting to DigiLocker...</div>
              <div className="text-xs opacity-75">Fetching from multiple institutes</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Fetch from DigiLocker</span>
          </div>
        )}
      </button>

      {fetchResult && (
        <div className="mt-6 bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-green-800">DigiLocker Fetch Successful</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">
                {fetchResult.summary?.total_credentials || 0}
              </div>
              <div className="text-xs text-green-700">Total Credentials</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">
                {fetchResult.summary?.ncvet_verified || 0}
              </div>
              <div className="text-xs text-blue-700">NCVET Verified</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-lg font-bold text-yellow-600">
                {fetchResult.summary?.non_ncvet || 0}
              </div>
              <div className="text-xs text-yellow-700">Industry Platforms</div>
            </div>
          </div>

          {fetchResult.nsqf_progress && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">NSQF Progress</span>
                <span className="text-sm text-purple-600">
                  Level {fetchResult.nsqf_progress.current_level}/10
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${fetchResult.nsqf_progress.progress_percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-purple-700">
                {fetchResult.nsqf_progress.pathway_status}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
            <div>Fetched at: {new Date(fetchResult.fetch_timestamp).toLocaleString()}</div>
            <div>Source: {fetchResult.source}</div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p className="mb-1">
          <strong>Note:</strong> This is a simulation of DigiLocker integration. 
          In production, this would connect to the actual DigiLocker API with proper authentication.
        </p>
        <p>
          DigiLocker is India's flagship digital platform for authentic document storage and sharing.
        </p>
      </div>
    </div>
  );
};

export default DigiLockerSimulator;
