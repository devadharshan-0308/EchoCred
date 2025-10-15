import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Future use for API calls

const IssuerDashboard = ({ user, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalIssued: 0,
    activeCredentials: 0,
    verificationRequests: 0,
    blockchainEntries: 0
  });
  
  // Form data for issuing certificates
  const [formData, setFormData] = useState({
    learnerName: '',
    learnerEmail: '',
    courseName: '',
    nsqfLevel: '4',
    creditPoints: '3',
    grade: 'A'
  });

  // Mock issuer data based on user
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadIssuerData = async () => {
    setLoading(true);
    try {
      // Mock data for issued certificates
      const mockCertificates = [
        {
          credential_id: 'FUTURE-1000',
          learner_name: 'Alice Johnson',
          learner_email: 'alice.johnson@example.com',
          course_name: 'AI & Machine Learning Foundations',
          issue_date: '2025-10-11',
          status: 'ACTIVE',
          nsqf_level: 4,
          credit_points: 3,
          grade: 'A+',
          verification_count: 5
        },
        {
          credential_id: 'FUTURE-1001',
          learner_name: 'Bob Smith',
          learner_email: 'bob.smith@example.com',
          course_name: 'Data Analytics Foundation',
          issue_date: '2025-10-11',
          status: 'ACTIVE',
          nsqf_level: 4,
          credit_points: 3,
          grade: 'B',
          verification_count: 2
        },
        {
          credential_id: 'FUTURE-1002',
          learner_name: 'Bob Smith',
          learner_email: 'bob.smith@example.com',
          course_name: 'Cybersecurity Basics',
          issue_date: '2025-10-11',
          status: 'ACTIVE',
          nsqf_level: 4,
          credit_points: 3,
          grade: 'A+',
          verification_count: 8
        }
      ];

      setCertificates(mockCertificates);
      
      setStats({
        totalIssued: mockCertificates.length,
        activeCredentials: mockCertificates.filter(c => c.status === 'ACTIVE').length,
        verificationRequests: mockCertificates.reduce((sum, c) => sum + c.verification_count, 0),
        blockchainEntries: mockCertificates.length
      });

    } catch (error) {
      setError('Failed to load issuer data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const issueCertificate = async (certificateData) => {
    try {
      setLoading(true);
      
      // Mock certificate issuance
      const newCertificate = {
        credential_id: `FUTURE-${Date.now()}`,
        learner_name: certificateData.learnerName,
        learner_email: certificateData.learnerEmail,
        course_name: certificateData.courseName,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        nsqf_level: certificateData.nsqfLevel,
        credit_points: certificateData.creditPoints,
        grade: certificateData.grade,
        verification_count: 0
      };

      setCertificates(prev => [newCertificate, ...prev]);
      setStats(prev => ({
        ...prev,
        totalIssued: prev.totalIssued + 1,
        activeCredentials: prev.activeCredentials + 1,
        blockchainEntries: prev.blockchainEntries + 1
      }));

      console.log('Certificate issued:', newCertificate);
    } catch (error) {
      setError('Failed to issue certificate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeCertificate = async (credentialId) => {
    try {
      setCertificates(prev => 
        prev.map(cert => 
          cert.credential_id === credentialId 
            ? { ...cert, status: 'REVOKED' }
            : cert
        )
      );
      
      setStats(prev => ({
        ...prev,
        activeCredentials: prev.activeCredentials - 1
      }));

      console.log('Certificate revoked:', credentialId);
    } catch (error) {
      setError('Failed to revoke certificate: ' + error.message);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Issuer Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Institute Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Institute Name</label>
                <p className="text-gray-900">{issuerInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Institute ID</label>
                <p className="text-gray-900 font-mono">{issuerInfo.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ {issuerInfo.type}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Authority</label>
                <p className="text-gray-900">{issuerInfo.authority}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Accreditation</label>
                <p className="text-gray-900">{issuerInfo.accreditation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Established</label>
                <p className="text-gray-900">{issuerInfo.established}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.totalIssued}</div>
          <div className="text-sm text-gray-600">Total Certificates Issued</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">{stats.activeCredentials}</div>
          <div className="text-sm text-gray-600">Active Credentials</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-yellow-600">{stats.verificationRequests}</div>
          <div className="text-sm text-gray-600">Verification Requests</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600">{stats.blockchainEntries}</div>
          <div className="text-sm text-gray-600">Blockchain Entries</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {certificates.slice(0, 5).map((cert, index) => (
            <div key={cert.credential_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">
                  Certificate issued to {cert.learner_name}
                </div>
                <div className="text-sm text-gray-600">
                  {cert.course_name} • {cert.credential_id} • {cert.issue_date}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  cert.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {cert.status}
                </span>
                <span className="text-xs text-gray-500">
                  {cert.verification_count} verifications
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Issued Certificates</h3>
          <button
            onClick={() => setActiveTab('issue')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Issue New Certificate
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Learner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificates.map((cert) => (
                <tr key={cert.credential_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cert.credential_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cert.learner_name}</div>
                      <div className="text-sm text-gray-500">{cert.learner_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{cert.course_name}</div>
                      <div className="text-sm text-gray-500">NSQF Level {cert.nsqf_level} • Grade: {cert.grade}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cert.issue_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cert.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cert.verification_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                    <button className="text-green-600 hover:text-green-900">Verify</button>
                    {cert.status === 'ACTIVE' && (
                      <button 
                        onClick={() => revokeCertificate(cert.credential_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    issueCertificate(formData);
    setFormData({
      learnerName: '',
      learnerEmail: '',
      courseName: '',
      nsqfLevel: '4',
      creditPoints: '3',
      grade: 'A'
    });
  };

  const renderIssueTab = () => {

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue New Certificate</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learner Name
                </label>
                <input
                  type="text"
                  value={formData.learnerName}
                  onChange={(e) => setFormData({...formData, learnerName: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learner Email
                </label>
                <input
                  type="email"
                  value={formData.learnerEmail}
                  onChange={(e) => setFormData({...formData, learnerEmail: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({...formData, courseName: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NSQF Level
                </label>
                <select
                  value={formData.nsqfLevel}
                  onChange={(e) => setFormData({...formData, nsqfLevel: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Points
                </label>
                <input
                  type="number"
                  value={formData.creditPoints}
                  onChange={(e) => setFormData({...formData, creditPoints: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="10"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Issuing...' : 'Issue Certificate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Issuer Dashboard</h1>
              <p className="text-sm text-gray-600">
                {issuerInfo.name} • Certificate Management Portal
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                🏛️ Issuer
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
              { id: 'certificates', name: 'Certificates', icon: '📜' },
              { id: 'issue', name: 'Issue Certificate', icon: '➕' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
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
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'certificates' && renderCertificates()}
        {activeTab === 'issue' && renderIssueTab()}
      </div>
    </div>
  );
};

export default IssuerDashboard;
