import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Filter,
  Download,
  Eye,
  Star,
  Building,
  Award,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import axios from 'axios';

const ModernEmployerDashboard = ({ user, onLogout }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [stats, setStats] = useState({
    totalVerifications: 0,
    successfulVerifications: 0,
    averageCertificates: 0,
    topSkills: []
  });

  const sampleCandidates = [
    'alice.johnson@example.com',
    'bob.smith@example.com',
    'charlie.lee@example.com',
    'diana.patel@example.com',
    'ethan.brown@example.com'
  ];

  useEffect(() => {
    loadVerificationHistory();
    calculateStats();
  }, []);

  const loadVerificationHistory = () => {
    const mockHistory = [
      {
        id: 1,
        candidateEmail: 'alice.johnson@example.com',
        candidateName: 'Alice Johnson',
        verifiedAt: '2025-10-11T10:30:00Z',
        certificatesFound: 7,
        ncvetCertificates: 4,
        status: 'verified',
        position: 'Software Developer',
        score: 95
      },
      {
        id: 2,
        candidateEmail: 'bob.smith@example.com',
        candidateName: 'Bob Smith',
        verifiedAt: '2025-10-10T14:15:00Z',
        certificatesFound: 7,
        ncvetCertificates: 3,
        status: 'verified',
        position: 'Data Analyst',
        score: 88
      },
      {
        id: 3,
        candidateEmail: 'diana.patel@example.com',
        candidateName: 'Diana Patel',
        verifiedAt: '2025-10-09T09:20:00Z',
        certificatesFound: 9,
        ncvetCertificates: 6,
        status: 'verified',
        position: 'Project Manager',
        score: 92
      }
    ];
    setVerificationHistory(mockHistory);
  };

  const calculateStats = () => {
    setStats({
      totalVerifications: 156,
      successfulVerifications: 142,
      averageCertificates: 6.2,
      topSkills: [
        { skill: 'Data Analytics', count: 45 },
        { skill: 'AI/ML', count: 38 },
        { skill: 'Cybersecurity', count: 32 },
        { skill: 'Cloud Computing', count: 28 }
      ]
    });
  };

  const searchCandidate = async () => {
    if (!searchEmail) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/simple/certificates/${searchEmail}`
      );
      
      if (response.data.success) {
        setSearchResults(response.data.certificates || []);
      }
    } catch (error) {
      console.error('Error searching candidate:', error);
      setSearchResults([]);
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

  const CandidateCard = ({ candidate }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {candidate.candidateName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{candidate.candidateName}</h3>
            <p className="text-sm text-gray-600">{candidate.position}</p>
            <p className="text-xs text-gray-500">{candidate.candidateEmail}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 mb-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-900">{candidate.score}/100</span>
          </div>
          <span className="text-xs text-gray-500">Verification Score</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{candidate.certificatesFound}</div>
          <div className="text-xs text-gray-500">Total Certs</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{candidate.ncvetCertificates}</div>
          <div className="text-xs text-gray-500">NCVET Verified</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {Math.round((candidate.ncvetCertificates / candidate.certificatesFound) * 100)}%
          </div>
          <div className="text-xs text-gray-500">Compliance</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Verified {new Date(candidate.verifiedAt).toLocaleDateString()}
        </span>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm">
            <Eye className="w-3 h-3" />
            <span>View Details</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm">
            <Download className="w-3 h-3" />
            <span>Report</span>
          </button>
        </div>
      </div>
    </div>
  );

  const CertificateResult = ({ cert }) => (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${cert.status === 'GOVERNMENT_VERIFIED' ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Award className={`w-4 h-4 ${cert.status === 'GOVERNMENT_VERIFIED' ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{cert.course_title}</h4>
            <p className="text-sm text-gray-600">{cert.issuer}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          cert.status === 'GOVERNMENT_VERIFIED' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {cert.status === 'GOVERNMENT_VERIFIED' ? 'Gov. Verified' : 'Industry'}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">NSQF Level:</span>
          <span className="ml-1 font-medium">{cert.nsqf_level}</span>
        </div>
        <div>
          <span className="text-gray-500">Grade:</span>
          <span className="ml-1 font-medium">{cert.grade}</span>
        </div>
        <div>
          <span className="text-gray-500">Issued:</span>
          <span className="ml-1 font-medium">{new Date(cert.issue_date).toLocaleDateString()}</span>
        </div>
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
                Employer Dashboard 🏢
              </h1>
              <p className="text-gray-600 mt-1">Verify candidate credentials and manage hiring</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">HR Manager</span>
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
            icon={Users}
            title="Total Verifications"
            value={stats.totalVerifications}
            subtitle="This month"
            trend={12}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            title="Successful Verifications"
            value={stats.successfulVerifications}
            subtitle={`${Math.round((stats.successfulVerifications/stats.totalVerifications)*100)}% success rate`}
            trend={8}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            icon={Award}
            title="Avg. Certificates"
            value={stats.averageCertificates}
            subtitle="Per candidate"
            trend={5}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            icon={TrendingUp}
            title="Top Skills Found"
            value={stats.topSkills.length}
            subtitle="Skill categories"
            color="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Search Candidates
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Verification History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Analytics
            </button>
          </div>

          <div className="p-6">
            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Verification</h3>
                  <div className="flex space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="Enter candidate email address"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={searchCandidate}
                      disabled={loading || !searchEmail}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loading ? 'Fetching Certificates...' : 'Fetch & Verify'}
                    </button>
                  </div>
                </div>

                {/* Quick Search Options */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Search</h4>
                  <div className="flex flex-wrap gap-2">
                    {sampleCandidates.map((email, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchEmail(email)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                      >
                        {email.split('@')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Verification Results ({searchResults.length} certificates found)
                    </h4>
                    <div className="space-y-3">
                      {searchResults.map((cert, index) => (
                        <CertificateResult key={index} cert={cert} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Verifications</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {verificationHistory.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Hiring Analytics</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Skills Chart */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Top Skills in Candidates
                      </h4>
                      <div className="space-y-4">
                        {stats.topSkills.map((skill, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${(skill.count / 50) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8">{skill.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verification Trends */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Verification Trends
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-lg font-bold text-green-600">91%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg. Processing Time</span>
                          <span className="text-lg font-bold text-blue-600">2.3s</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">NCVET Compliance</span>
                          <span className="text-lg font-bold text-purple-600">78%</span>
                        </div>
                      </div>
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

export default ModernEmployerDashboard;
