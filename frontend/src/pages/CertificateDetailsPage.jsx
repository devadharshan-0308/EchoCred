import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { certificatesAPI } from '../services/api';
import { 
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Calendar,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import Card from '../components/Card';

const CertificateDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchCertificateDetails();
  }, [id]);

  const fetchCertificateDetails = async () => {
    try {
      // First get the certificate list to find our certificate
      const certificates = await certificatesAPI.list();
      const cert = certificates.find(c => c.id === parseInt(id));
      
      if (!cert) {
        toast.error('Certificate not found');
        navigate('/dashboard');
        return;
      }
      
      setCertificate(cert);
      
      // If we have verification data, set it
      if (cert.report) {
        setVerificationData({
          ...cert,
          report: cert.report
        });
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
      toast.error('Failed to load certificate details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await certificatesAPI.verify(id);
      setVerificationData(response);
      toast.success('Certificate verification completed!');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await certificatesAPI.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = certificate.originalName || certificate.filename || `certificate-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    }
  };

  const getStatusBadge = (cert) => {
    if (cert?.verified) {
      return (
        <span className="status-verified text-base">
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="status-unverified text-base">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Unverified
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" text="Loading certificate details..." />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Certificate Not Found</h2>
          <p className="text-gray-600 mb-4">The requested certificate could not be found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificate Details</h1>
              <p className="mt-2 text-gray-600">
                View and verify certificate information
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="btn-secondary flex items-center space-x-2"
              >
                {verifying ? (
                  <>
                    <Loader size="sm" text="" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Re-verify</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {certificate.originalName || certificate.filename || `Certificate ${certificate.id}`}
                    </h2>
                    <p className="text-gray-600">Certificate ID: {certificate.id}</p>
                  </div>
                </div>
                {getStatusBadge(certificate)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">File Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Filename:</span>
                      <span className="text-gray-900 font-medium">{certificate.filename}</span>
                    </div>
                    {certificate.originalName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Original Name:</span>
                        <span className="text-gray-900 font-medium">{certificate.originalName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Upload Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upload Date:</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(certificate.uploadedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${certificate.verified ? 'text-success-600' : 'text-warning-600'}`}>
                        {certificate.verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Verification Report */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Report</h3>
              
              {verificationData?.report ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
                      {verificationData.report}
                    </pre>
                  </div>
                  
                  {/* Quick Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium text-blue-900">API Check</h4>
                      <p className="text-sm text-blue-700">
                        {verificationData.report.includes('✅ Certificate found') ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium text-green-900">QR Code</h4>
                      <p className="text-sm text-green-700">
                        {verificationData.report.includes('✅ QR code') ? 'Detected' : 'Not Found'}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium text-purple-900">Signature</h4>
                      <p className="text-sm text-purple-700">
                        {verificationData.report.includes('✅ Digital signature') ? 'Valid' : 'Invalid'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Verification Report</h4>
                  <p className="text-gray-600 mb-4">
                    Click "Re-verify" to generate a detailed verification report
                  </p>
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="btn-primary"
                  >
                    {verifying ? 'Verifying...' : 'Verify Now'}
                  </button>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  {verifying ? (
                    <>
                      <Loader size="sm" text="" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Re-verify</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary w-full"
                >
                  Back to Dashboard
                </button>
              </div>
            </Card>

            {/* Certificate Stats */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification Status</span>
                  {certificate.verified ? (
                    <CheckCircle className="w-5 h-5 text-success-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-warning-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">File Type</span>
                  <span className="text-gray-900 font-medium">PDF</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Certificate ID</span>
                  <span className="text-gray-900 font-medium">#{certificate.id}</span>
                </div>
                
                {certificate.uploadedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Added</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(certificate.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Help */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>Verification Failed?</strong><br />
                  Try re-verifying the certificate or check if the original file is valid.
                </p>
                <p>
                  <strong>Download Issues?</strong><br />
                  Make sure your browser allows downloads and check your internet connection.
                </p>
                <p>
                  <strong>Questions?</strong><br />
                  Contact support for help with certificate verification.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetailsPage;
