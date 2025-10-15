import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  Users, 
  Calendar,
  ChevronRight,
  Star,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Building
} from 'lucide-react';
import axios from 'axios';
import DebugCertificateTest from './DebugCertificateTest';

const ModernDashboard = ({ user, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ncvet: 0,
    industry: 0,
    nsqfLevels: {}
  });
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState([]);

  // Remove automatic loading - certificates will only load when user clicks fetch
  // useEffect(() => {
  //   loadUserData();
  // }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading certificates for user:', user);
      console.log('📧 User email:', user?.email);
      
      if (!user?.email) {
        console.error('❌ No user email available');
        return;
      }
      
      const response = await axios.get(
        `http://localhost:5000/api/simple/certificates/${user.email}`
      );
      
      console.log('📥 Certificate response:', response.data);
      
      if (response.data.success) {
        const certs = response.data.certificates || [];
        console.log('✅ Certificates loaded:', certs.length);
        setCertificates(certs);
        calculateStats(certs);
        generateProgressData(certs);
      } else {
        console.error('❌ API returned success: false');
      }
    } catch (error) {
      console.error('❌ Error loading certificates:', error);
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

  const generateProgressData = (certs) => {
    const monthlyData = {};
    certs.forEach(cert => {
      const month = new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const progress = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      certificates: count,
      progress: Math.min((count / 5) * 100, 100) // Assuming 5 certs per month is 100%
    }));

    setProgressData(progress);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, bgColor }) => (
    <div className={`${bgColor} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const ProgressBar = ({ label, progress, color }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        ></div>
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
            <h4 className="font-semibold text-gray-900 text-sm">{cert.course_title}</h4>
            <p className="text-xs text-gray-500">{cert.issuer}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          cert.status === 'GOVERNMENT_VERIFIED' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {cert.status === 'GOVERNMENT_VERIFIED' ? 'Verified' : 'Industry'}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>NSQF Level {cert.nsqf_level}</span>
        <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
      </div>
      
      <div className="flex items-center space-x-2 mt-3">
        <button className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700">
          <Eye className="w-3 h-3" />
          <span>View</span>
        </button>
        <button className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-700">
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>
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
                Welcome back, {user.firstName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Track your learning progress and achievements</p>
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
        {/* Debug Component - Remove after testing */}
        <div className="mb-8">
          <DebugCertificateTest />
        </div>
        {/* Fetch Certificates Section - Show when no certificates loaded */}
        {certificates.length === 0 && !loading && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8 text-center">
            <div className="max-w-md mx-auto">
              <Download className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">Ready to View Your Certificates?</h2>
              <p className="text-blue-100 mb-6">
                Click below to fetch your certificates from all connected institutes and platforms.
              </p>
              <button
                onClick={loadUserData}
                disabled={loading}
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                <Download className="w-5 h-5" />
                <span>{loading ? 'Fetching...' : 'Fetch My Certificates'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 text-center mb-8 border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fetching Your Certificates</h3>
            <p className="text-gray-600">Connecting to institutes and gathering your credentials...</p>
          </div>
        )}

        {/* Stats Grid - Only show when certificates are loaded */}
        {certificates.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Award}
                title="Total Certificates"
                value={stats.total}
                subtitle="Across all platforms"
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                bgColor="bg-white"
              />
              <StatCard
                icon={CheckCircle}
            title="Government Verified"
            value={stats.ncvet}
            subtitle="NCVET Approved"
            color="bg-gradient-to-r from-green-500 to-green-600"
            bgColor="bg-white"
          />
          <StatCard
            icon={Building}
            title="Industry Recognized"
            value={stats.industry}
            subtitle="Professional Skills"
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            bgColor="bg-white"
          />
          <StatCard
            icon={TrendingUp}
            title="NSQF Levels"
            value={Object.keys(stats.nsqfLevels).length}
            subtitle="Skill Levels Achieved"
            color="bg-gradient-to-r from-orange-500 to-orange-600"
            bgColor="bg-white"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Learning Progress</h2>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">This Year</span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4 mb-6">
                <ProgressBar 
                  label="NSQF Level 4 Completion" 
                  progress={Math.min((stats.nsqfLevels[4] || 0) * 20, 100)} 
                  color="bg-gradient-to-r from-blue-500 to-blue-600" 
                />
                <ProgressBar 
                  label="Government Certifications" 
                  progress={Math.min((stats.ncvet / stats.total) * 100, 100)} 
                  color="bg-gradient-to-r from-green-500 to-green-600" 
                />
                <ProgressBar 
                  label="Industry Skills" 
                  progress={Math.min((stats.industry / stats.total) * 100, 100)} 
                  color="bg-gradient-to-r from-purple-500 to-purple-600" 
                />
              </div>

              {/* Monthly Progress Chart */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Achievement</h3>
                <div className="flex items-end space-x-2 h-32">
                  {progressData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                        style={{ height: `${data.progress}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Certificates */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={loadUserData}
                  disabled={loading}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {loading ? 'Fetching Certificates...' : 'Fetch My Certificates'}
                  </span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Set Learning Goals</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-200">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">View Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Certificates */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Certificates</h3>
              <div className="space-y-3">
                {certificates.slice(0, 3).map((cert, index) => (
                  <CertificateCard key={index} cert={cert} />
                ))}
              </div>
              
              {certificates.length > 3 && (
                <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All Certificates →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Achievement Timeline */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Achievement Timeline</h2>
          <div className="space-y-4">
            {certificates.slice(0, 5).map((cert, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    cert.status === 'GOVERNMENT_VERIFIED' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      cert.status === 'GOVERNMENT_VERIFIED' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{cert.course_title}</h4>
                  <p className="text-sm text-gray-600">{cert.issuer} • NSQF Level {cert.nsqf_level}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{cert.grade}</p>
                  <p className="text-xs text-gray-500">{new Date(cert.issue_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModernDashboard;
