import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificatesAPI } from '../services/api';
import { 
  Download, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  FileText,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import Card from '../components/Card';

const FetchPage = () => {
  const [fetching, setFetching] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const handleFetch = async () => {
    setFetching(true);
    setResults(null);

    try {
      const response = await certificatesAPI.fetch();
      setResults(response);
      toast.success(`Successfully fetched ${response.length} certificates!`);
    } catch (error) {
      console.error('Fetch error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch certificates. Please try again.';
      toast.error(errorMessage);
      setResults({
        error: true,
        message: errorMessage,
      });
    } finally {
      setFetching(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Fetch External Certificates</h1>
          <p className="mt-2 text-gray-600">
            Import certificates from external providers like Udemy, Coursera, and more
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fetch Section */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">External Providers</h2>
              
              {/* Provider List */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">U</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">MockUdemy</h4>
                    <p className="text-sm text-gray-600">Online learning platform</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">MockCoursera</h4>
                    <p className="text-sm text-gray-600">University courses online</p>
                  </div>
                </div>
              </div>

              {/* Fetch Button */}
              <button
                onClick={handleFetch}
                disabled={fetching}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {fetching ? (
                  <>
                    <Loader size="sm" text="" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Fetch Certificates</span>
                  </>
                )}
              </button>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Connects to external APIs</li>
                  <li>• Retrieves your certificates</li>
                  <li>• Adds them to your vault</li>
                  <li>• Avoids duplicates</li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Fetch Results</h2>
              
              {!results ? (
                <div className="text-center py-12">
                  <ExternalLink className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No fetch results yet</h3>
                  <p className="text-gray-600">
                    Click "Fetch Certificates" to import from external providers
                  </p>
                </div>
              ) : results.error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-900 mb-2">Fetch Failed</h3>
                  <p className="text-red-600 mb-4">{results.message}</p>
                  <button
                    onClick={handleFetch}
                    className="btn-secondary"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Success Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-6 h-6 text-success-500" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Successfully fetched {results.length} certificates
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="btn-secondary text-sm"
                    >
                      View Dashboard
                    </button>
                  </div>

                  {/* Certificates List */}
                  {results.length > 0 ? (
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
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.map((certificate) => (
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
                                <div className="text-sm text-gray-900">
                                  {certificate.report?.includes('MockUdemy') ? 'MockUdemy' :
                                   certificate.report?.includes('MockCoursera') ? 'MockCoursera' :
                                   'External API'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No new certificates found</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="btn-primary"
                    >
                      View All Certificates
                    </button>
                    <button
                      onClick={handleFetch}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Fetch Again</span>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About External Fetching</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Supported Providers</h4>
              <ul className="space-y-1">
                <li>• MockUdemy (Demo)</li>
                <li>• MockCoursera (Demo)</li>
                <li>• More providers coming soon</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What Gets Imported</h4>
              <ul className="space-y-1">
                <li>• Certificate metadata</li>
                <li>• Verification status</li>
                <li>• Issue dates and details</li>
                <li>• Provider information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Security & Privacy</h4>
              <ul className="space-y-1">
                <li>• Secure API connections</li>
                <li>• No sensitive data stored</li>
                <li>• Duplicate detection</li>
                <li>• Local verification</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FetchPage;
