import React, { useState, useEffect } from 'react';
import { 
  Award, 
  TrendingUp, 
  Users, 
  Building,
  ChevronDown,
  Download,
  Eye,
  CheckCircle,
  BarChart3,
  PieChart,
  Map,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Star,
  Shield,
  Globe
} from 'lucide-react';
import axios from 'axios';

const InteractiveDashboard = ({ user, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [allCertificates, setAllCertificates] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeView, setActiveView] = useState('overview'); // overview, certificates, analytics
  const [stats, setStats] = useState({
    total: 0,
    ncvet: 0,
    industry: 0,
    institutes: {},
    nsqfLevels: {},
    monthlyData: []
  });

  useEffect(() => {
    loadInstitutes();
    // Removed auto-loading of certificates - they should only load when user clicks "Fetch All"
  }, [user]);

  const loadInstitutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/institutes');
      if (response.data.success) {
        setInstitutes(response.data.institutes);
      }
    } catch (error) {
      console.error('Error loading institutes:', error);
    }
  };

  const fetchAllCertificates = async () => {
    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Initializing...');
    
    try {
      // Simulate progress steps
      setLoadingProgress(20);
      setLoadingMessage('Connecting to certificate database...');
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      setLoadingProgress(40);
      setLoadingMessage('Fetching your certificates...');
      
      const response = await axios.get(`http://localhost:5000/api/simple/certificates/${user.email}`);
      
      setLoadingProgress(70);
      setLoadingMessage('Processing certificate data...');
      
      if (response.data.success) {
        const certs = response.data.certificates || [];
        
        setLoadingProgress(90);
        setLoadingMessage('Calculating statistics...');
        
        setAllCertificates(certs);
        setCertificates(certs);
        calculateStats(certs);
        
        setLoadingProgress(100);
        setLoadingMessage(`Successfully loaded ${certs.length} certificates!`);
        
        // Brief delay to show completion
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Error fetching all certificates:', error);
      setLoadingMessage('Error loading certificates. Please try again.');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
      setLoadingMessage('');
    }
  };

  const fetchByInstitute = async (instituteId) => {
    if (!instituteId) return;
    
    const instituteName = institutes.find(i => i.id === instituteId)?.name || 'Selected Institute';
    
    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Initializing...');
    
    try {
      setLoadingProgress(25);
      setLoadingMessage(`Connecting to ${instituteName}...`);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setLoadingProgress(50);
      setLoadingMessage(`Fetching certificates from ${instituteName}...`);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/simple/fetch-by-institute',
        {
          institute_id: instituteId,
          learner_email: user.email
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setLoadingProgress(80);
      setLoadingMessage('Processing certificates...');
      
      if (response.data.success) {
        const certs = response.data.credentials || [];
        setCertificates(certs);
        calculateStats(certs);
        
        setLoadingProgress(100);
        setLoadingMessage(`Found ${certs.length} certificates from ${instituteName}!`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Error fetching by institute:', error);
      setLoadingMessage(`Error fetching from ${instituteName}. Please try again.`);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
      setLoadingMessage('');
    }
  };

  const calculateStats = (certs) => {
    const nsqfLevels = {};
    const institutes = {};
    const monthlyData = {};

    certs.forEach(cert => {
      // NSQF Levels
      if (cert.nsqf_level) {
        nsqfLevels[cert.nsqf_level] = (nsqfLevels[cert.nsqf_level] || 0) + 1;
      }
      
      // Institutes
      if (cert.issuer) {
        institutes[cert.issuer] = (institutes[cert.issuer] || 0) + 1;
      }
      
      // Monthly data
      if (cert.issue_date) {
        const month = new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      }
    });

    setStats({
      total: certs.length,
      ncvet: certs.filter(c => c.status === 'GOVERNMENT_VERIFIED').length,
      industry: certs.filter(c => c.status === 'INDUSTRY_VERIFIED').length,
      institutes,
      nsqfLevels,
      monthlyData: Object.entries(monthlyData).map(([month, count]) => ({ month, count }))
    });
  };

  const downloadCertificate = async (certId) => {
    console.log('🔽 Starting download for certificate ID:', certId);
    
    if (!certId) {
      alert('Certificate ID is missing!');
      return;
    }

    try {
      // Use backend proxy to avoid CORS issues
      const downloadUrl = `http://localhost:5000/api/certificates/download/${certId}`;
      console.log('📥 Fetching via backend proxy:', downloadUrl);
      
      const token = localStorage.getItem('token');
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('📦 Blob size:', blob.size, 'bytes');
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${certId}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Download completed successfully via backend proxy');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert(`Download failed: ${error.message}`);
    }
  };

  const viewCertificate = async (cert) => {
    console.log('👁️ Viewing certificate PDF:', cert);
    
    const certId = cert.credential_id || cert.certificate_id;
    if (!certId) {
      alert('Certificate ID is missing!');
      return;
    }

    try {
      // Use backend proxy to get PDF for preview
      const viewUrl = `http://localhost:5000/api/certificates/download/${certId}`;
      console.log('📄 Opening PDF preview:', viewUrl);
      
      const token = localStorage.getItem('token');
      const response = await fetch(viewUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const pdfUrl = window.URL.createObjectURL(blob);
        
        // Open PDF in new tab for preview
        const newWindow = window.open(pdfUrl, '_blank');
        if (newWindow) {
          newWindow.focus();
          console.log('✅ PDF preview opened successfully');
          
          // Clean up the blob URL after a delay
          setTimeout(() => {
            window.URL.revokeObjectURL(pdfUrl);
          }, 1000);
        } else {
          alert('Please allow popups to view the certificate PDF');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ PDF preview failed:', error);
      alert(`Failed to preview certificate: ${error.message}`);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
    <div 
      className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const CertificateCard = ({ cert }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${cert.status === 'GOVERNMENT_VERIFIED' ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Award className={`w-4 h-4 ${cert.status === 'GOVERNMENT_VERIFIED' ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{cert.course_title || cert.course_name}</h4>
            <p className="text-xs text-gray-600">{cert.issuer}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          cert.status === 'GOVERNMENT_VERIFIED' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {cert.status === 'GOVERNMENT_VERIFIED' ? 'Gov. Verified' : 'Industry'}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
        <div>NSQF: {cert.nsqf_level}</div>
        <div>Grade: {cert.grade}</div>
        <div>{new Date(cert.issue_date).toLocaleDateString()}</div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => {
            console.log('🔽 Download button clicked for certificate:', cert);
            const certId = cert.credential_id || cert.certificate_id;
            console.log('📋 Using certificate ID:', certId);
            downloadCertificate(certId);
          }}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>
        <button 
          onClick={() => viewCertificate(cert)}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs"
        >
          <Eye className="w-3 h-3" />
          <span>Preview PDF</span>
        </button>
      </div>
    </div>
  );

  const BarChart = ({ data, title }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2" />
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{key}</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((value / Math.max(...Object.values(data))) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PieChartComponent = ({ data, title }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <PieChart className="w-5 h-5 mr-2" />
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value], index) => {
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
          const percentage = Math.round((value / Object.values(data).reduce((a, b) => a + b, 0)) * 100);
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                <span className="text-sm font-medium text-gray-700">{key}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{value}</span>
                <span className="text-xs text-gray-500">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.firstName}! 🎓
              </h1>
              <p className="text-gray-600 mt-1">Manage your certificates and track your learning progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</span>
              </div>
              <button 
                onClick={onLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeView === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveView('certificates')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeView === 'certificates'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📜 View All Certificates
            </button>
          </div>

          <div className="p-6">
            {/* Institute Selection */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Institute to Fetch Certificates
                  </label>
                  <div className="relative">
                    <select
                      value={selectedInstitute}
                      onChange={(e) => setSelectedInstitute(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Choose an institute...</option>
                      {institutes.map(institute => (
                        <option key={institute.id} value={institute.id}>
                          {institute.name} {institute.type === 'NCVET_VERIFIED' ? '✅' : '🏢'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchByInstitute(selectedInstitute)}
                    disabled={!selectedInstitute || loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? 'Fetching...' : 'Fetch from Institute'}
                  </button>
                  <button
                    onClick={fetchAllCertificates}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? 'Fetching...' : 'Fetch All'}
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Loading State with Progress Bar */}
            {loading && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center mb-6 border border-blue-100">
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fetching Certificates</h3>
                  <p className="text-gray-600 mb-4">{loadingMessage}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{loadingProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      >
                        <div className="h-full bg-white bg-opacity-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Loading Steps Indicator */}
                <div className="flex justify-center space-x-4 text-xs text-gray-500">
                  <div className={`flex items-center space-x-1 ${loadingProgress >= 20 ? 'text-blue-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${loadingProgress >= 20 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <span>Connect</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${loadingProgress >= 50 ? 'text-blue-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${loadingProgress >= 50 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <span>Fetch</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${loadingProgress >= 80 ? 'text-blue-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${loadingProgress >= 80 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <span>Process</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${loadingProgress >= 100 ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${loadingProgress >= 100 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    <span>Complete</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content based on active view */}
            {activeView === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={Award}
                    title="Total Certificates"
                    value={stats.total}
                    subtitle="Across all platforms"
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                    onClick={() => setActiveView('certificates')}
                  />
                  <StatCard
                    icon={CheckCircle}
                    title="Government Verified"
                    value={stats.ncvet}
                    subtitle="NCVET Approved"
                    color="bg-gradient-to-r from-green-500 to-green-600"
                  />
                  <StatCard
                    icon={Building}
                    title="Industry Recognized"
                    value={stats.industry}
                    subtitle="Professional Skills"
                    color="bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                  <StatCard
                    icon={Globe}
                    title="Institutes"
                    value={Object.keys(stats.institutes).length}
                    subtitle="Connected platforms"
                    color="bg-gradient-to-r from-orange-500 to-orange-600"
                    onClick={() => setActiveView('analytics')}
                  />
                </div>

                {/* Recent Certificates Preview */}
                {certificates.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Recent Certificates</h2>
                      <button 
                        onClick={() => setActiveView('certificates')}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {certificates.slice(0, 6).map((cert, index) => (
                        <CertificateCard key={index} cert={cert} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
                    <Award className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to EchoCred! 🎓</h3>
                    <p className="text-gray-600 mb-6">Your certificate dashboard is ready. Click "Fetch All" above to load all your certificates from connected institutes.</p>
                    <button
                      onClick={fetchAllCertificates}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loading ? 'Fetching...' : '🚀 Fetch All My Certificates'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeView === 'certificates' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    All Certificates ({certificates.length})
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedInstitute ? institutes.find(i => i.id === selectedInstitute)?.name : 'All Institutes'}
                    </span>
                  </div>
                </div>
                
                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certificates.map((cert, index) => (
                      <CertificateCard key={index} cert={cert} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Load Your Certificates</h3>
                    <p className="text-gray-600 mb-4">Click "Fetch All" to load all your certificates, or select a specific institute and click "Fetch from Institute".</p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={fetchAllCertificates}
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {loading ? 'Fetching...' : 'Fetch All Certificates'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboard;
