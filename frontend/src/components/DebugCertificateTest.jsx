import React, { useState } from 'react';
import axios from 'axios';

const DebugCertificateTest = () => {
  const [email, setEmail] = useState('alice.johnson@example.com');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testFetch = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Testing certificate fetch for:', email);
      const response = await axios.get(`http://localhost:5000/api/simple/certificates/${email}`);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setCertificates(response.data.certificates || []);
        console.log('Certificates loaded:', response.data.certificates?.length);
      } else {
        setError('API returned success: false');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDownload = async (certId) => {
    try {
      console.log('Testing download for:', certId);
      const response = await fetch(`http://localhost:5001/download/${certId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${certId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('Download successful');
      } else {
        console.error('Download failed:', response.status);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 Certificate Debug Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Email:</label>
        <div className="flex space-x-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
            placeholder="Enter email to test"
          />
          <button
            onClick={testFetch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Fetch'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          Error: {error}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          Results: {certificates.length} certificates found
        </h3>
        
        {certificates.length > 0 && (
          <div className="space-y-2">
            {certificates.map((cert, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{cert.course_title}</h4>
                    <p className="text-sm text-gray-600">
                      ID: {cert.credential_id} | Issuer: {cert.issuer} | Grade: {cert.grade}
                    </p>
                  </div>
                  <button
                    onClick={() => testDownload(cert.credential_id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Test Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Backend:</strong> http://localhost:5000</p>
        <p><strong>Mock API:</strong> http://localhost:5001</p>
        <p><strong>Frontend:</strong> http://localhost:3000</p>
      </div>
    </div>
  );
};

export default DebugCertificateTest;
