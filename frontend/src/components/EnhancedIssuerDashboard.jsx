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
  Shield,
  Globe,
  Download,
  Eye,
  Filter,
  Search
} from 'lucide-react';

const EnhancedIssuerDashboard = ({ user, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalIssued: 1247,
    activeCredentials: 1156,
    verificationRequests: 89,
    blockchainEntries: 1247,
    monthlyIssuance: [
      { month: 'Jan', count: 95 },
      { month: 'Feb', count: 112 },
      { month: 'Mar', count: 128 },
      { month: 'Apr', count: 145 },
      { month: 'May', count: 167 },
      { month: 'Jun', count: 189 }
    ],
    topCourses: [
      { course: 'AI & Machine Learning', issued: 245 },
      { course: 'Data Science Fundamentals', issued: 198 },
      { course: 'Cybersecurity Essentials', issued: 167 },
      { course: 'Cloud Computing', issued: 134 }
    ]
  });

  const [newCertificate, setNewCertificate] = useState({
    learnerEmail: '',
    courseName: '',
    courseCode: '',
    nsqfLevel: '4',
    grade: 'A',
    creditPoints: '3'
  });

  const sampleCertificates = [
    {
      id: 'FUTURE-1000',
      learnerName: 'Alice Johnson',
      learnerEmail: 'alice.johnson@example.com',
      courseName: 'AI & Machine Learning Foundations',
      courseCode: 'AIMACLEAFOU2024',
      issueDate: '2025-10-11',
      nsqfLevel: 4,
      grade: 'A',
      status: 'ACTIVE',
      verificationCount: 12
    },
    {
      id: 'FUTURE-1001',
      learnerName: 'Bob Smith',
      learnerEmail: 'bob.smith@example.com',
      courseName: 'Data Science Fundamentals',
      courseCode: 'DATASCIFU2024',
      issueDate: '2025-10-10',
      nsqfLevel: 5,
      grade: 'B',
      status: 'ACTIVE',
      verificationCount: 8
    },
    {
      id: 'FUTURE-1002',
      learnerName: 'Charlie Lee',
      learnerEmail: 'charlie.lee@example.com',
      courseName: 'Cybersecurity Essentials',
      courseCode: 'CYBERSECUR2024',
      issueDate: '2025-10-09',
      nsqfLevel: 4,
      grade: 'A',
      status: 'ACTIVE',
      verificationCount: 15
    }
  ];

  useEffect(() => {
    setCertificates(sampleCertificates);
  }, []);

  const handleIssueCertificate = () => {
    if (!newCertificate.learnerEmail || !newCertificate.courseName) {
      alert('Please fill in required fields');
      return;
    }

    const certificate = {
      id: `FUTURE-${Date.now()}`,
      learnerName: newCertificate.learnerEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      ...newCertificate,
      issueDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      verificationCount: 0
    };

    setCertificates(prev => [certificate, ...prev]);
    setStats(prev => ({
      ...prev,
      totalIssued: prev.totalIssued + 1,
      activeCredentials: prev.activeCredentials + 1,
      blockchainEntries: prev.blockchainEntries + 1
    }));

    // Reset form
    setNewCertificate({
      learnerEmail: '',
      courseName: '',
      courseCode: '',
      nsqfLevel: '4',
      grade: 'A',
      creditPoints: '3'
    });

    alert('Certificate issued successfully!');
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color, onClick }) => (
    <div 
      className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
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
          <div className="p-2 rounded-lg bg-purple-100">
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{cert.courseName}</h4>
            <p className="text-xs text-gray-600">{cert.learnerName}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          cert.status === 'ACTIVE' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {cert.status}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
        <div>ID: {cert.id}</div>
        <div>NSQF: {cert.nsqfLevel}</div>
        <div>Grade: {cert.grade}</div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{cert.verificationCount} verifications</span>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs">
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
          <button className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs">
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
        </div>
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
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{item.course || item.month}</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((item.issued || item.count) / Math.max(...data.map(d => d.issued || d.count)) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">{item.issued || item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Issuer Dashboard 🏛️
              </h1>
              <p className="text-gray-600 mt-1">Issue and manage certificates with government compliance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">FutureSkills Prime</span>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Award}
            title="Total Issued"
            value={stats.totalIssued}
            subtitle="Lifetime certificates"
            trend={15}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            icon={CheckCircle}
            title="Active Credentials"
            value={stats.activeCredentials}
            subtitle="Currently valid"
            trend={8}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            icon={Clock}
            title="Verification Requests"
            value={stats.verificationRequests}
            subtitle="This month"
            trend={22}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Shield}
            title="Blockchain Entries"
            value={stats.blockchainEntries}
            subtitle="Immutable records"
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
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'issue'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ➕ Issue Certificate
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'manage'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Manage Certificates
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 Analytics
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <BarChart data={stats.monthlyIssuance} title="Monthly Issuance Trend" />
                    <BarChart data={stats.topCourses} title="Top Courses Issued" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Issued Certificates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certificates.slice(0, 6).map((cert, index) => (
                      <CertificateCard key={index} cert={cert} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Issue Certificate Tab */}
            {activeTab === 'issue' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Plus className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Issue New Certificate</h2>
                      <p className="text-purple-100">Create government-compliant digital credentials</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Learner Email *</label>
                        <input
                          type="email"
                          value={newCertificate.learnerEmail}
                          onChange={(e) => setNewCertificate(prev => ({ ...prev, learnerEmail: e.target.value }))}
                          placeholder="learner@example.com"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
                        <input
                          type="text"
                          value={newCertificate.courseName}
                          onChange={(e) => setNewCertificate(prev => ({ ...prev, courseName: e.target.value }))}
                          placeholder="AI & Machine Learning Foundations"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                        <input
                          type="text"
                          value={newCertificate.courseCode}
                          onChange={(e) => setNewCertificate(prev => ({ ...prev, courseCode: e.target.value }))}
                          placeholder="AIMACLEAFOU2024"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">NSQF Level</label>
                        <select
                          value={newCertificate.nsqfLevel}
                          onChange={(e) => setNewCertificate(prev => ({ ...prev, nsqfLevel: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="1">Level 1</option>
                          <option value="2">Level 2</option>
                          <option value="3">Level 3</option>
                          <option value="4">Level 4</option>
                          <option value="5">Level 5</option>
                          <option value="6">Level 6</option>
                          <option value="7">Level 7</option>
                          <option value="8">Level 8</option>
                          <option value="9">Level 9</option>
                          <option value="10">Level 10</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                        <select
                          value={newCertificate.grade}
                          onChange={(e) => setNewCertificate(prev => ({ ...prev, grade: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="A">A - Excellent</option>
                          <option value="B">B - Good</option>
                          <option value="C">C - Satisfactory</option>
                          <option value="D">D - Pass</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Credit Points</label>
                        <input
                          type="number"
                          value={newCertificate.creditPoints}
                          onChange={(e) => setNewCertificate(prev => ({ ...prev, creditPoints: e.target.value }))}
                          placeholder="3"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={handleIssueCertificate}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Send className="w-5 h-5" />
                        <span>Issue Certificate</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Certificates Tab */}
            {activeTab === 'manage' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Issued Certificates ({certificates.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">All Status</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificates.map((cert, index) => (
                    <CertificateCard key={index} cert={cert} />
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold text-gray-900">Issuance Analytics</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <BarChart data={stats.monthlyIssuance} title="Monthly Issuance Trend" />
                  <BarChart data={stats.topCourses} title="Popular Courses" />
                  
                  {/* Performance Metrics */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Performance Metrics
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Issuance Rate</span>
                        <span className="text-lg font-bold text-purple-600">24.5/day</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Verification Rate</span>
                        <span className="text-lg font-bold text-green-600">98.7%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg. Processing Time</span>
                        <span className="text-lg font-bold text-blue-600">1.2s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Blockchain Success</span>
                        <span className="text-lg font-bold text-orange-600">100%</span>
                      </div>
                    </div>
                  </div>

                  {/* NSQF Compliance */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      NSQF Compliance
                    </h4>
                    <div className="space-y-3">
                      {[4, 5, 6, 7].map(level => {
                        const count = certificates.filter(c => c.nsqfLevel === level).length;
                        const percentage = certificates.length > 0 ? Math.round((count / certificates.length) * 100) : 0;
                        return (
                          <div key={level} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Level {level}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12">{count} ({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIssuerDashboard;
