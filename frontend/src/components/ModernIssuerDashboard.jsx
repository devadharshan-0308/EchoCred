import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Award, 
  Users, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  Building,
  BookOpen,
  Star,
  BarChart3,
  PieChart,
  Send,
  FileText,
  Shield
} from 'lucide-react';

const ModernIssuerDashboard = ({ user, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalIssued: 0,
    activeCredentials: 0,
    verificationRequests: 0,
    blockchainEntries: 0
  });
  
  const [formData, setFormData] = useState({
    learnerName: '',
    learnerEmail: '',
    courseName: '',
    nsqfLevel: '4',
    creditPoints: '3',
    grade: 'A'
  });

  const issuerInfo = {
    id: 'FUTURESKILL',
    name: 'FutureSkills Prime',
    type: 'NCVET_VERIFIED',
    authority: 'NASSCOM / MeitY',
    accreditation: 'Government of India',
    established: '2020'
  };

  useEffect(() => {
    loadIssuerData();
  }, []);

  const loadIssuerData = async () => {
    setLoading(true);
    try {
      const mockCertificates = [
        {
          credential_id: 'FUTURE-1000',
          learner_name: 'Alice Johnson',
          learner_email: 'alice.johnson@example.com',
          course_name: 'AI & Machine Learning Foundations',
          issue_date: '2025-10-11',
          nsqf_level: 4,
          grade: 'B',
          status: 'active'
        },
        {
          credential_id: 'FUTURE-1001',
          learner_name: 'Bob Smith',
          learner_email: 'bob.smith@example.com',
          course_name: 'Data Analytics Foundation',
          issue_date: '2025-10-11',
          nsqf_level: 4,
          grade: 'A+',
          status: 'active'
        },
        {
          credential_id: 'FUTURE-1002',
          learner_name: 'Bob Smith',
          learner_email: 'bob.smith@example.com',
          course_name: 'Cybersecurity Basics',
          issue_date: '2025-10-11',
          nsqf_level: 4,
          grade: 'A',
          status: 'active'
        }
      ];

      setCertificates(mockCertificates);
      setStats({
        totalIssued: 1247,
        activeCredentials: 1189,
        verificationRequests: 3456,
        blockchainEntries: 1189
      });
    } catch (error) {
      console.error('Error loading issuer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const issueCertificate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate certificate issuance
      const newCert = {
        credential_id: `FUTURE-${Date.now()}`,
        ...formData,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      
      setCertificates([newCert, ...certificates]);
      setFormData({
        learnerName: '',
        learnerEmail: '',
        courseName: '',
        nsqfLevel: '4',
        creditPoints: '3',
        grade: 'A'
      });
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalIssued: prev.totalIssued + 1,
        activeCredentials: prev.activeCredentials + 1,
        blockchainEntries: prev.blockchainEntries + 1
      }));
      
      alert('Certificate issued successfully!');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      alert('Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+{trend}%</span>
          </div>
        )}
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
          <div className="p-2 rounded-lg bg-green-100">
            <Award className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{cert.course_name}</h4>
            <p className="text-xs text-gray-600">{cert.learner_name}</p>
            <p className="text-xs text-gray-500">{cert.learner_email}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {cert.status}
          </span>
          <p className="text-xs text-gray-500 mt-1">Grade: {cert.grade}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>ID: {cert.credential_id}</span>
        <span>NSQF Level {cert.nsqf_level}</span>
        <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
      </div>
    </div>
  );

  const ProgressRing = ({ percentage, size = 120, strokeWidth = 8, color = "#3B82F6" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Issuer Dashboard 🏛️
              </h1>
              <p className="text-gray-600 mt-1">Manage and issue digital certificates</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{issuerInfo.name}</span>
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
        {/* Issuer Info Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">{issuerInfo.name}</h2>
              <p className="text-green-100 mb-1">Authority: {issuerInfo.authority}</p>
              <p className="text-green-100">Accreditation: {issuerInfo.accreditation}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">{issuerInfo.type}</span>
              </div>
              <p className="text-green-100">Est. {issuerInfo.established}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Award}
            title="Total Issued"
            value={stats.totalIssued.toLocaleString()}
            subtitle="All time certificates"
            trend={15}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            title="Active Credentials"
            value={stats.activeCredentials.toLocaleString()}
            subtitle="Currently valid"
            trend={8}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            icon={Users}
            title="Verification Requests"
            value={stats.verificationRequests.toLocaleString()}
            subtitle="This month"
            trend={22}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            icon={Shield}
            title="Blockchain Entries"
            value={stats.blockchainEntries.toLocaleString()}
            subtitle="Secured records"
            trend={12}
            color="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'issue'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ➕ Issue Certificate
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'manage'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Manage Certificates
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Performance Metrics */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                          <ProgressRing percentage={95} color="#10B981" />
                          <h4 className="font-semibold text-gray-900 mt-4">Verification Success</h4>
                          <p className="text-sm text-gray-600">Certificate validity rate</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                          <ProgressRing percentage={87} color="#3B82F6" />
                          <h4 className="font-semibold text-gray-900 mt-4">Blockchain Sync</h4>
                          <p className="text-sm text-gray-600">Records synchronized</p>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Issuance Chart */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Monthly Issuance Trend
                      </h4>
                      <div className="flex items-end space-x-2 h-32">
                        {[65, 78, 82, 95, 88, 92].map((height, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500"
                              style={{ height: `${height}%` }}
                            ></div>
                            <span className="text-xs text-gray-500 mt-2">
                              {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button 
                          onClick={() => setActiveTab('issue')}
                          className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
                        >
                          <div className="p-2 bg-green-500 rounded-lg">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Issue New Certificate</span>
                        </button>
                        
                        <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Bulk Certificate Upload</span>
                        </button>
                        
                        <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-200">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <BarChart3 className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">View Analytics</span>
                        </button>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Certificate Issued</p>
                            <p className="text-xs text-gray-500">AI & ML Foundations - Alice Johnson</p>
                          </div>
                          <span className="text-xs text-gray-500">2m ago</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Verification Request</p>
                            <p className="text-xs text-gray-500">Data Analytics - Bob Smith</p>
                          </div>
                          <span className="text-xs text-gray-500">5m ago</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Blockchain Sync</p>
                            <p className="text-xs text-gray-500">15 certificates synchronized</p>
                          </div>
                          <span className="text-xs text-gray-500">10m ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issue Certificate Tab */}
            {activeTab === 'issue' && (
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Issue New Certificate</h3>
                <form onSubmit={issueCertificate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Learner Name</label>
                      <input
                        type="text"
                        name="learnerName"
                        value={formData.learnerName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter learner's full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Learner Email</label>
                      <input
                        type="email"
                        name="learnerEmail"
                        value={formData.learnerEmail}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter learner's email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name</label>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter course name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">NSQF Level</label>
                      <select
                        name="nsqfLevel"
                        value={formData.nsqfLevel}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(level => (
                          <option key={level} value={level}>Level {level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Credit Points</label>
                      <input
                        type="number"
                        name="creditPoints"
                        value={formData.creditPoints}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
                      <select
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="B+">B+</option>
                        <option value="B">B</option>
                        <option value="C+">C+</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Issue Certificate</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Manage Certificates Tab */}
            {activeTab === 'manage' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recently Issued Certificates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificates.map((cert, index) => (
                    <CertificateCard key={index} cert={cert} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernIssuerDashboard;
