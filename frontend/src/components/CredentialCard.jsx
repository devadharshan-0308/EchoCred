import React, { useState } from 'react';
import { blockchainAPI, certificatesAPI } from '../services/api';

const CredentialCard = ({ credential, showBlockchainInfo = false }) => {
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [verifyingBlockchain, setVerifyingBlockchain] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isNCVETVerified = credential.institute_info?.type === 'NCVET_VERIFIED';
  const hasNSQFLevel = credential.nsqf_level !== null && credential.nsqf_level !== undefined;

  const getTrustBadge = () => {
    if (isNCVETVerified) {
      return {
        text: '✅ Government Verified',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        text: '⚠️ Industry Recognized',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200'
      };
    }
  };

  const getStatusBadge = () => {
    const status = credential.verification_status || credential.status;
    switch (status) {
      case 'GOVERNMENT_VERIFIED':
        return { text: 'Verified', color: 'bg-green-500' };
      case 'INDUSTRY_VERIFIED':
        return { text: 'Industry Verified', color: 'bg-blue-500' };
      case 'PENDING':
        return { text: 'Pending', color: 'bg-yellow-500' };
      default:
        return { text: 'Unknown', color: 'bg-gray-500' };
    }
  };

  const verifyInBlockchain = async () => {
    if (!credential.credential_hash) {
      // Generate hash first
      try {
        setVerifyingBlockchain(true);
        const hashResponse = await blockchainAPI.generateHash({
          credential_id: credential.credential_id,
          learner_email: credential.learner_email,
          issuer: credential.issuer,
          course_name: credential.course_name
        });
        
        if (hashResponse.success) {
          const verifyResponse = await blockchainAPI.verifyHash(hashResponse.generated_hash);
          setBlockchainStatus(verifyResponse);
        }
      } catch (error) {
        console.error('Error verifying in blockchain:', error);
        setBlockchainStatus({ verified: false, error: 'Verification failed' });
      } finally {
        setVerifyingBlockchain(false);
      }
    } else {
      try {
        setVerifyingBlockchain(true);
        const response = await blockchainAPI.verifyHash(credential.credential_hash);
        setBlockchainStatus(response);
      } catch (error) {
        console.error('Error verifying in blockchain:', error);
        setBlockchainStatus({ verified: false, error: 'Verification failed' });
      } finally {
        setVerifyingBlockchain(false);
      }
    }
  };

  const downloadCertificate = async () => {
    if (!credential.credential_id) {
      alert('Certificate ID not available for download');
      return;
    }

    try {
      setDownloading(true);
      console.log('🔽 Downloading certificate:', credential.credential_id);
      
      // Use the mock API download endpoint
      const response = await fetch(`http://localhost:5001/download/${credential.credential_id}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${credential.credential_id}_${credential.course_name || 'certificate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Certificate downloaded successfully');
      
    } catch (error) {
      console.error('❌ Error downloading certificate:', error);
      alert(`Failed to download certificate: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const trustBadge = getTrustBadge();
  const statusBadge = getStatusBadge();

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${
      isNCVETVerified ? 'border-l-green-500' : 'border-l-yellow-500'
    } p-6 hover:shadow-lg transition-shadow`}>
      
      {/* Header with Trust Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {credential.course_name}
          </h3>
          <p className="text-sm text-gray-600">
            {credential.institute_info?.name || credential.issuer}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${trustBadge.bgColor} ${trustBadge.textColor} ${trustBadge.borderColor}`}>
            {trustBadge.text}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs text-white ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
        </div>
      </div>

      {/* Credential Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">
            <strong>Credential ID:</strong> {credential.credential_id}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Issue Date:</strong> {new Date(credential.issue_date).toLocaleDateString()}
          </p>
          {credential.grade && (
            <p className="text-sm text-gray-600">
              <strong>Grade:</strong> {credential.grade}
            </p>
          )}
        </div>
        <div>
          {hasNSQFLevel && (
            <p className="text-sm text-gray-600">
              <strong>NSQF Level:</strong> 
              <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                Level {credential.nsqf_level}
              </span>
            </p>
          )}
          {credential.credit_points && (
            <p className="text-sm text-gray-600">
              <strong>Credits:</strong> {credential.credit_points}
            </p>
          )}
          <p className="text-sm text-gray-600">
            <strong>Type:</strong> {credential.certificate_type || 'Certificate'}
          </p>
        </div>
      </div>

      {/* Skills */}
      {credential.skills && credential.skills.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Skills Acquired:</p>
          <div className="flex flex-wrap gap-2">
            {credential.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* NSQF Information */}
      {isNCVETVerified && (
        <div className="bg-green-50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">NSQF Compliance</span>
          </div>
          <div className="text-xs text-green-700 mt-1">
            {hasNSQFLevel ? (
              <>
                This credential is aligned with NSQF Level {credential.nsqf_level} and 
                contributes to your qualification pathway. It is recognized by government 
                agencies and eligible for formal education credit transfer.
              </>
            ) : (
              'This credential is from an NCVET verified institute and contributes to your professional development.'
            )}
          </div>
        </div>
      )}

      {/* Non-NSQF Information */}
      {!isNCVETVerified && (
        <div className="bg-yellow-50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-yellow-800">Industry Recognition</span>
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            This credential is valuable for industry employment but is not part of the 
            NSQF framework. It may not be eligible for formal education credit transfer 
            or government job applications.
          </div>
        </div>
      )}

      {/* Blockchain Verification */}
      {showBlockchainInfo && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Blockchain Verification</span>
            <button
              onClick={verifyInBlockchain}
              disabled={verifyingBlockchain}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
            >
              {verifyingBlockchain ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          
          {blockchainStatus && (
            <div className={`mt-2 p-2 rounded text-xs ${
              blockchainStatus.verified 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {blockchainStatus.verified ? (
                <div>
                  <div className="font-medium">✓ Verified in Blockchain</div>
                  <div>Transaction ID: {blockchainStatus.transaction?.tx_id}</div>
                  <div>Verified at: {new Date(blockchainStatus.verification_time).toLocaleString()}</div>
                </div>
              ) : (
                <div>
                  <div className="font-medium">✗ Not Found in Blockchain</div>
                  <div>{blockchainStatus.message || blockchainStatus.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Download Section */}
      {credential.external_api && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Certificate PDF</span>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                External API
              </span>
            </div>
            <button
              onClick={downloadCertificate}
              disabled={downloading}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-1"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Fetch Timestamp */}
      {credential.fetch_timestamp && (
        <div className="text-xs text-gray-500 mt-4 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span>Fetched: {new Date(credential.fetch_timestamp).toLocaleString()}</span>
            {credential.source && (
              <span className={`px-2 py-1 rounded text-xs ${
                credential.source === 'external_api' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {credential.source === 'external_api' ? 'External API' : 'Internal'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialCard;
