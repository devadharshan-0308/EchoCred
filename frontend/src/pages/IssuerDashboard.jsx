import React, { useState, useEffect } from 'react';
import { certificatesAPI, institutesAPI, blockchainAPI } from '../services/api';
import toast from 'react-hot-toast';

const IssuerDashboard = () => {
  const [pendingCertificates, setPendingCertificates] = useState([]);
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [newCertificate, setNewCertificate] = useState({
    learnerEmail: '',
    courseName: '',
    courseCode: '',
    grade: 'A',
    nsqfLevel: '',
    skills: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchInstitutes();
    loadCertificates();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await institutesAPI.getAll();
      if (response.success) {
        setInstitutes(response.institutes);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
    }
  };

  const loadCertificates = () => {
    const pending = JSON.parse(localStorage.getItem('pendingCertificates') || '[]');
    const issued = JSON.parse(localStorage.getItem('issuedCertificates') || '[]');
    setPendingCertificates(pending);
    setIssuedCertificates(issued);
  };

  const issueCertificate = async () => {
    if (!newCertificate.learnerEmail || !newCertificate.courseName) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const certificateData = {
        credential_id: `ISSUER_${Date.now()}`,
        learner_email: newCertificate.learnerEmail,
        learner_name: newCertificate.learnerEmail.split('@')[0].replace('.', ' '),
        course_name: newCertificate.courseName,
        course_code: newCertificate.courseCode || `COURSE_${Date.now()}`,
        issuer: user.name || 'Issuer',
        issue_date: new Date().toISOString().split('T')[0],
        completion_date: new Date().toISOString().split('T')[0],
        nsqf_level: newCertificate.nsqfLevel ? parseInt(newCertificate.nsqfLevel) : null,
        credit_points: newCertificate.nsqfLevel ? Math.ceil(parseInt(newCertificate.nsqfLevel) / 2) : null,
        grade: newCertificate.grade,
        certificate_type: 'Course Completion',
        status: 'ISSUED',
        skills: newCertificate.skills.split(',').map(s => s.trim()).filter(s => s),
        issued_by: user.name,
        verification_status: 'PENDING'
      };

      // Add to blockchain
      try {
        await blockchainAPI.addCredential({
          credential_id: certificateData.credential_id,
          learner_email: certificateData.learner_email,
          issuer: certificateData.issuer,
          course_name: certificateData.course_name,
          verification_type: 'PENDING'
        });
      } catch (blockchainError) {
        console.warn('Blockchain addition failed:', blockchainError);
      }

      // Add to issued certificates
      const issued = JSON.parse(localStorage.getItem('issuedCertificates') || '[]');
      issued.unshift(certificateData);
      localStorage.setItem('issuedCertificates', JSON.stringify(issued));
      setIssuedCertificates(issued);

      // Reset form
      setNewCertificate({
        learnerEmail: '',
        courseName: '',
        courseCode: '',
        grade: 'A',
        nsqfLevel: '',
        skills: ''
      });

      toast.success('Certificate issued successfully!');
      setActiveTab('issued');

    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const approvePendingCertificate = (certificateId) => {
    const pending = pendingCertificates.filter(cert => cert.credential_id !== certificateId);
    const approved = pendingCertificates.find(cert => cert.credential_id === certificateId);
    
    if (approved) {
      approved.verification_status = 'APPROVED';
      approved.approved_by = user.name;
      approved.approved_date = new Date().toISOString().split('T')[0];
      
      const issued = [...issuedCertificates, approved];
      
      setPendingCertificates(pending);
      setIssuedCertificates(issued);
      
      localStorage.setItem('pendingCertificates', JSON.stringify(pending));
      localStorage.setItem('issuedCertificates', JSON.stringify(issued));
      
      toast.success('Certificate approved and issued!');
    }
  };

  const rejectPendingCertificate = (certificateId) => {
    const pending = pendingCertificates.filter(cert => cert.credential_id !== certificateId);
    setPendingCertificates(pending);
    localStorage.setItem('pendingCertificates', JSON.stringify(pending));
    toast.success('Certificate rejected');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Issuer Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Issue and manage digital certificates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Certificate Issuer</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-medium text-sm">🏛️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('issue')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'issue'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 Issue Certificate
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⏳ Pending ({pendingCertificates.length})
              </button>
              <button
                onClick={() => setActiveTab('issued')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'issued'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✅ Issued ({issuedCertificates.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Issue Certificate Tab */}
        {activeTab === 'issue' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📝 Issue New Certificate
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learner Email *
                </label>
                <input
                  type="email"
                  value={newCertificate.learnerEmail}
                  onChange={(e) => setNewCertificate({...newCertificate, learnerEmail: e.target.value})}
                  placeholder="learner@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={newCertificate.courseName}
                  onChange={(e) => setNewCertificate({...newCertificate, courseName: e.target.value})}
                  placeholder="Advanced Web Development"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code
                </label>
                <input
                  type="text"
                  value={newCertificate.courseCode}
                  onChange={(e) => setNewCertificate({...newCertificate, courseCode: e.target.value})}
                  placeholder="AWD2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>
                <select
                  value={newCertificate.grade}
                  onChange={(e) => setNewCertificate({...newCertificate, grade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NSQF Level (if applicable)
                </label>
                <select
                  value={newCertificate.nsqfLevel}
                  onChange={(e) => setNewCertificate({...newCertificate, nsqfLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Not NSQF Aligned</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={newCertificate.skills}
                  onChange={(e) => setNewCertificate({...newCertificate, skills: e.target.value})}
                  placeholder="JavaScript, React, Node.js"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={issueCertificate}
                disabled={loading}
                className="bg-orange-600 text-white py-2 px-6 rounded-md hover:bg-orange-700 disabled:bg-orange-400 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Issuing...
                  </>
                ) : (
                  '📝 Issue Certificate'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pending Certificates Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              ⏳ Pending Certificates ({pendingCertificates.length})
            </h2>
            
            {pendingCertificates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending certificates</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCertificates.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{cert.course_name}</h4>
                        <p className="text-sm text-gray-600">For: {cert.learner_email}</p>
                        <p className="text-sm text-gray-600">Grade: {cert.grade}</p>
                        {cert.nsqf_level && (
                          <p className="text-sm text-gray-600">NSQF Level: {cert.nsqf_level}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approvePendingCertificate(cert.credential_id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => rejectPendingCertificate(cert.credential_id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Issued Certificates Tab */}
        {activeTab === 'issued' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              ✅ Issued Certificates ({issuedCertificates.length})
            </h2>
            
            {issuedCertificates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No certificates issued yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issuedCertificates.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{cert.course_name}</h4>
                        <p className="text-sm text-gray-600">Certificate ID: {cert.credential_id}</p>
                        <p className="text-sm text-gray-600">Issued to: {cert.learner_email}</p>
                        <p className="text-sm text-gray-600">Grade: {cert.grade}</p>
                        <p className="text-sm text-gray-600">Issue Date: {cert.issue_date}</p>
                        {cert.nsqf_level && (
                          <p className="text-sm text-gray-600">NSQF Level: {cert.nsqf_level}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          ✅ Issued
                        </span>
                        {cert.verification_status === 'APPROVED' && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded ml-2">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {cert.skills && cert.skills.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-sm">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cert.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuerDashboard;
