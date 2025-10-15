import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { certificatesAPI } from '../services/api';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Shield,
  Calendar,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import Card from '../components/Card';

const Dashboard = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCertificates = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const data = await certificatesAPI.list();
      setCertificates(data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownload = async (certificate) => {
    try {
      console.log('Starting download for certificate:', certificate.id);
      const blob = await certificatesAPI.download(certificate.id);
      
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = certificate.originalName || certificate.filename || `certificate-${certificate.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded successfully');
      console.log('Download completed for certificate:', certificate.id);
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download certificate';
      toast.error(`Download failed: ${errorMessage}`);
    }
  };

  const handleView = (certificate) => {
    navigate(`/certificate/${certificate.id}`);
  };

  const getStatusBadge = (certificate) => {
    if (certificate.verified) {
      return (
        <span className="status-verified">
          <CheckCircle className="w-3 h-3 inline mr-1" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="status-unverified">
          <AlertCircle className="w-3 h-3 inline mr-1" />
          Unverified
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" text="Loading your certificates..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.user?.name || 'User'}!
              </h1>
              <p className="mt-2 text-gray-600">
                Manage and verify your digital certificates
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fetchCertificates(true)}
                disabled={refreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Certificate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{certificates.length}</h3>
            <p className="text-gray-600">Total Certificates</p>
          </Card>

          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {certificates.filter(cert => cert.verified).length}
            </h3>
            <p className="text-gray-600">Verified</p>
          </Card>

          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-warning-100 rounded-lg mx-auto mb-4">
              <Shield className="w-6 h-6 text-warning-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {certificates.filter(cert => !cert.verified).length}
            </h3>
            <p className="text-gray-600">Pending Verification</p>
          </Card>
        </div>

        {/* Certificates List */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Certificates</h2>
            {certificates.length > 0 && (
              <button
                onClick={() => navigate('/fetch')}
                className="btn-secondary text-sm"
              >
                Fetch More Certificates
              </button>
            )}
          </div>

          {certificates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
              <p className="text-gray-600 mb-6">
                Start by uploading your first certificate or fetching from external providers
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/upload')}
                  className="btn-primary"
                >
                  Upload Certificate
                </button>
                <button
                  onClick={() => navigate('/fetch')}
                  className="btn-secondary"
                >
                  Fetch Certificates
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((certificate) => (
                    <tr key={certificate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {certificate.originalName || certificate.filename || `Certificate ${certificate.id}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {certificate.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(certificate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(certificate.uploadedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleView(certificate)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(certificate)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;