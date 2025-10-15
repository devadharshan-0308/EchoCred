import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DebugCertificates from './DebugCertificates';
import FetchAllCertificates from './FetchAllCertificates';

const LearnerDashboard = ({ user, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    ncvet: 0,
    industry: 0,
    nsqfLevels: {}
  });

  const availableInstitutes = [
    { id: 'FUTURESKILL', name: 'FutureSkills Prime', type: 'NCVET_VERIFIED', category: 'Government' },
    { id: 'NCCT', name: 'National Council for Cement and Building Materials', type: 'NCVET_VERIFIED', category: 'Government' },
    { id: 'UNIVERSITY', name: 'University Grants Commission', type: 'NCVET_VERIFIED', category: 'Academic' },
    { id: 'UDEMY', name: 'Udemy Business', type: 'NON_NCVET', category: 'Industry' },
    { id: 'COURSERA', name: 'Coursera Learning Platform', type: 'NON_NCVET', category: 'Industry' }
  ];

  useEffect(() => {
    setInstitutes(availableInstitutes);
    // Don't auto-load certificates - user must click "Fetch All Certificates" button
    console.log('📋 Dashboard loaded for user:', user?.email);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllCertificates = async () => {
    setLoading(true);
    
    try {
      console.log('🔍 Loading all certificates for user:', user.email);
      
      const token = localStorage.getItem('token');
      
      // Use the simple API to get all certificates at once
      const response = await axios.get(
        `http://localhost:5000/api/simple/certificates/${user.email}`
      );
      
      console.log('📥 All certificates response:', response.data);
      
      if (response.data.success) {
        const allCerts = response.data.certificates || [];
        console.log('✅ Loaded certificates:', allCerts.length);
        
        // Enhance certificates with category info
        const enhancedCerts = allCerts.map(cert => {
          const institute = availableInstitutes.find(inst => inst.id === cert.issuer);
          return {
            ...cert,
            institute_info: {
              ...cert.institute_info,
              category: institute?.category || 'Unknown'
            }
          };
        });
        
        setCertificates(enhancedCerts);
        calculateStats(enhancedCerts);
      } else {
        console.warn('Failed to load certificates:', response.data.message);
        setCertificates([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Error loading certificates:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Don't show error to user for auto-loading, just log it
      if (error.response?.status !== 404) {
        setError('Failed to load certificates: ' + (error.response?.data?.message || error.message));
      }
      
      // Set empty certificates but don't show error for missing data
      setCertificates([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (certs) => {
    const nsqfLevels = {};
    certs.forEach(cert => {
      if (cert.nsqf_level) {
        nsqfLevels[cert.nsqf_level] = (nsqfLevels[cert.nsqf_level] || 0) + 1;
      }
    });

    setStats({
      total: certs.length,
      ncvet: certs.filter(c => c.status === 'GOVERNMENT_VERIFIED').length,
      industry: certs.filter(c => c.status === 'INDUSTRY_VERIFIED').length,
      nsqfLevels
    });
  };

  const handleAllCertificatesFetched = (fetchedCertificates) => {
    console.log('📥 All certificates fetched:', fetchedCertificates);
    setCertificates(fetchedCertificates);
    calculateStats(fetchedCertificates);
    // Switch to certificates tab to show the results
    setActiveTab('certificates');
  };

  const fetchFromInstitute = async () => {
    if (!selectedInstitute) {
      setError('Please select an institute');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔍 Fetching certificates from institute:', selectedInstitute, 'for user:', user.email);
      
      const token = localStorage.getItem('token');
      
      // Use the simple credentials API
      const response = await axios.post(
        'http://localhost:5000/api/simple/fetch-by-institute',
        {
          learner_email: user.email,
          institute_id: selectedInstitute
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📥 API Response:', response.data);

      if (response.data.success) {
        const newCerts = response.data.credentials || [];
        console.log('✅ Found certificates:', newCerts.length);
        
        // Update certificates with new data
        setCertificates(prev => {
          // Remove existing certificates from this institute
          const filtered = prev.filter(c => c.issuer !== selectedInstitute);
          // Add new certificates
          return [...filtered, ...newCerts];
        });
        
        // Recalculate stats
        calculateStats([...certificates.filter(c => c.issuer !== selectedInstitute), ...newCerts]);
        
        if (newCerts.length === 0) {
          setError(`No certificates found from ${selectedInstitute} for ${user.email}`);
        }
      } else {
        setError('Failed to fetch certificates: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const viewCertificateDetails = async (certificate) => {
    if (!certificate.credential_id) {
      alert('Certificate ID not available');
      return;
    }

    try {
      console.log('👁️ Viewing certificate details:', certificate.credential_id);
      
      // Map institute names to IDs for API calls
      const instituteIdMap = {
        'FutureSkills Prime': 'FUTURESKILL',
        'National Council for Cement and Building Materials': 'NCCT', 
        'University Grants Commission': 'UNIVERSITY',
        'Udemy Business': 'UDEMY',
        'Coursera Learning Platform': 'COURSERA',
        'FUTURESKILL': 'FUTURESKILL',
        'NCCT': 'NCCT',
        'UNIVERSITY': 'UNIVERSITY', 
        'UDEMY': 'UDEMY',
        'COURSERA': 'COURSERA'
      };
      
      const instituteId = instituteIdMap[certificate.issuer] || certificate.issuer;
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/certificates/details/${instituteId}/${certificate.credential_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedCertificate({
          ...certificate,
          details: data.certificate
        });
        setShowCertificateModal(true);
      } else {
        alert('Failed to load certificate details: ' + data.message);
      }
      
    } catch (error) {
      console.error('❌ Error viewing certificate details:', error);
      console.error('Certificate object:', certificate);
      alert(`Failed to view certificate details: ${error.message}`);
    }
  };

  const downloadCertificate = async (certificate) => {
    if (!certificate.credential_id) {
      alert('Certificate ID not available for download');
      return;
    }

    try {
      console.log('🔽 Downloading certificate:', certificate.credential_id);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/certificates/download/${certificate.credential_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Try direct download from mock API as fallback
        console.log('🔄 Trying direct download from mock API...');
        const directResponse = await fetch(`http://localhost:5001/download/${certificate.credential_id}`);
        
        if (!directResponse.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        const blob = await directResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${certificate.credential_id}_${certificate.course_name || 'certificate'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Certificate downloaded successfully (direct)');
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.credential_id}_${certificate.course_name || 'certificate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Certificate downloaded successfully');
      
    } catch (error) {
      console.error('❌ Error downloading certificate:', error);
      console.error('Certificate object:', certificate);
      alert(`Failed to download certificate: ${error.message}`);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Fetch All Certificates Component */}
      {certificates.length === 0 && (
        <FetchAllCertificates 
          user={user} 
          onCertificatesFetched={handleAllCertificatesFetched}
        />
      )}

      {/* Stats Cards - only show when certificates are loaded */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Certificates</div>
          </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">{stats.ncvet}</div>
          <div className="text-sm text-gray-600">NCVET Verified</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-yellow-600">{stats.industry}</div>
          <div className="text-sm text-gray-600">Industry Certified</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600">
            {Object.keys(stats.nsqfLevels).length}
          </div>
          <div className="text-sm text-gray-600">NSQF Levels</div>
        </div>
      </div>
      )}

      {/* NSQF Progress - only show when certificates are loaded */}
      {certificates.length > 0 && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">NSQF Level Distribution</h3>
        <div className="space-y-2">
          {Object.entries(stats.nsqfLevels).map(([level, count]) => (
            <div key={level} className="flex items-center">
              <div className="w-20 text-sm font-medium text-gray-700">Level {level}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-2 mx-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(count / stats.total) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-sm text-gray-600">{count}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Recent Certificates - only show when certificates are loaded */}
      {certificates.length > 0 && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Certificates</h3>
        <div className="space-y-3">
          {certificates.slice(0, 5).map((cert, index) => (
            <div key={cert.credential_id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{cert.course_name}</div>
                <div className="text-sm text-gray-600">{cert.issuer} • {cert.completion_date}</div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                cert.status === 'GOVERNMENT_VERIFIED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {cert.status === 'GOVERNMENT_VERIFIED' ? 'NCVET' : 'Industry'}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All My Certificates</h3>
        
        {certificates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📜</div>
            <p>No certificates found</p>
            <p className="text-sm mt-2">Use the "Fetch from Institute" tab to load your certificates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificates.map((cert, index) => (
              <div key={cert.credential_id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">{cert.course_name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    cert.status === 'GOVERNMENT_VERIFIED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cert.status === 'GOVERNMENT_VERIFIED' ? '✅ NCVET' : '⚠️ Industry'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Certificate ID:</strong> {cert.credential_id}</p>
                  <p><strong>Issuer:</strong> {cert.issuer}</p>
                  <p><strong>Completed:</strong> {new Date(cert.completion_date).toLocaleDateString()}</p>
                  {cert.nsqf_level && <p><strong>NSQF Level:</strong> {cert.nsqf_level}</p>}
                  {cert.credit_points && <p><strong>Credits:</strong> {cert.credit_points}</p>}
                  {cert.grade && <p><strong>Grade:</strong> {cert.grade}</p>}
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('VIEW CLICKED - Certificate:', cert);
                      alert(`Certificate Details:\n\nID: ${cert.credential_id || 'N/A'}\nCourse: ${cert.course_name || 'N/A'}\nIssuer: ${cert.issuer || 'N/A'}\nDate: ${cert.completion_date || 'N/A'}`);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    type="button"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('DOWNLOAD CLICKED - Certificate:', cert);
                      const certId = cert.credential_id;
                      if (certId) {
                        console.log('Opening download URL:', `http://localhost:5001/download/${certId}`);
                        window.open(`http://localhost:5001/download/${certId}`, '_blank');
                      } else {
                        alert('Certificate ID not found!');
                      }
                    }}
                    className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                    type="button"
                  >
                    Download PDF
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      const text = `Certificate: ${cert.course_name || 'Unknown'} - ID: ${cert.credential_id || 'N/A'}`;
                      navigator.clipboard.writeText(text).then(() => {
                        alert('Certificate details copied to clipboard!');
                      }).catch(() => {
                        alert('Failed to copy to clipboard');
                      });
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    type="button"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCertificateModal = () => {
    if (!showCertificateModal || !selectedCertificate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Certificate Details</h2>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedCertificate.course_name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Certificate ID:</strong> {selectedCertificate.credential_id}</p>
                    <p><strong>Issuer:</strong> {selectedCertificate.issuer}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedCertificate.status === 'GOVERNMENT_VERIFIED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedCertificate.status === 'GOVERNMENT_VERIFIED' ? '✅ NCVET Verified' : '⚠️ Industry Verified'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p><strong>Completion Date:</strong> {new Date(selectedCertificate.completion_date).toLocaleDateString()}</p>
                    {selectedCertificate.nsqf_level && <p><strong>NSQF Level:</strong> {selectedCertificate.nsqf_level}</p>}
                    {selectedCertificate.credit_points && <p><strong>Credit Points:</strong> {selectedCertificate.credit_points}</p>}
                    {selectedCertificate.grade && <p><strong>Grade:</strong> {selectedCertificate.grade}</p>}
                  </div>
                </div>
              </div>

              {selectedCertificate.details && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Additional Details</h4>
                  <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                    {JSON.stringify(selectedCertificate.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedCertificate.skills && selectedCertificate.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Skills Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCertificate.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => downloadCertificate(selectedCertificate)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Download PDF
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Certificate: ${selectedCertificate.course_name} - ID: ${selectedCertificate.credential_id}`);
                  alert('Certificate details copied to clipboard!');
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Share Certificate
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFetchTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fetch Certificates from Institute</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Institute</label>
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an institute...</option>
              {institutes.map((institute) => (
                <option key={institute.id} value={institute.id}>
                  {institute.name} ({institute.category})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchFromInstitute}
              disabled={loading || !selectedInstitute}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Fetching...' : 'Fetch My Certificates'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Institute Categories */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">✅ Government Verified</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• FutureSkills Prime</li>
              <li>• NCCT</li>
              <li>• University Grants Commission</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Industry Platforms</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Udemy Business</li>
              <li>• Coursera Learning</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">📊 Your Progress</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Total: {stats.total} certificates</div>
              <div>NCVET: {stats.ncvet}</div>
              <div>Industry: {stats.industry}</div>
            </div>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Learner Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.firstName} {user.lastName} • {user.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                👨‍🎓 Learner
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
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'certificates', name: 'My Certificates', icon: '📜' },
              { id: 'fetch', name: 'Fetch from Institute', icon: '🔍' },
              { id: 'debug', name: 'Debug APIs', icon: '🔧' }
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
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'certificates' && renderCertificates()}
        {activeTab === 'fetch' && renderFetchTab()}
        {activeTab === 'debug' && <DebugCertificates user={user} />}
      </div>

      {/* Certificate Details Modal */}
      {renderCertificateModal()}
    </div>
  );
};

export default LearnerDashboard;
