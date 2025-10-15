import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalCertificates: 15847,
    verifiedToday: 342,
    successRate: 94.7,
    avgVerificationTime: 2.3
  });

  const verificationData = [
    { name: 'Digital Signature', value: 30, color: '#3B82F6' },
    { name: 'Blockchain', value: 25, color: '#10B981' },
    { name: 'API Validation', value: 20, color: '#F59E0B' },
    { name: 'QR Code', value: 15, color: '#EF4444' },
    { name: 'File Integrity', value: 10, color: '#8B5CF6' }
  ];

  const nsqfLevelData = [
    { level: 'Level 1-2', certificates: 2340, color: '#EF4444' },
    { level: 'Level 3-4', certificates: 4560, color: '#F59E0B' },
    { level: 'Level 5-6', certificates: 5670, color: '#10B981' },
    { level: 'Level 7-8', certificates: 2890, color: '#3B82F6' },
    { level: 'Level 9-10', certificates: 387, color: '#8B5CF6' }
  ];

  const monthlyTrends = [
    { month: 'Jan', verifications: 1200, success: 92 },
    { month: 'Feb', verifications: 1450, success: 94 },
    { month: 'Mar', verifications: 1680, success: 96 },
    { month: 'Apr', verifications: 1890, success: 95 },
    { month: 'May', verifications: 2100, success: 97 },
    { month: 'Jun', verifications: 2340, success: 94 }
  ];

  const topIssuers = [
    { name: 'IIT Delhi', certificates: 2340, verified: 2298 },
    { name: 'NSDC', certificates: 1890, verified: 1876 },
    { name: 'Coursera', certificates: 1560, verified: 1534 },
    { name: 'Udemy', certificates: 1234, verified: 1198 },
    { name: 'NIELIT', certificates: 987, verified: 976 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 EchoCred Analytics
          </h1>
          <p className="text-gray-600">
            Real-time insights into certificate verification performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                🎓
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCertificates.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                ✅
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.verifiedToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                📈
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                ⚡
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Time (sec)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avgVerificationTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Verification Methods */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔍 Verification Methods Usage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={verificationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {verificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* NSQF Levels */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 NSQF Level Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nsqfLevelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="certificates" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Monthly Verification Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="verifications" fill="#3B82F6" />
              <Line yAxisId="right" type="monotone" dataKey="success" stroke="#10B981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Issuers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Top Certificate Issuers
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issuer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Certificates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topIssuers.map((issuer, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {issuer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issuer.certificates.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issuer.verified.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {((issuer.verified / issuer.certificates) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">🚀 System Status</h3>
              <p className="text-blue-100">All verification services operational</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm text-blue-100">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">2.1s</div>
                  <div className="text-sm text-blue-100">Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-blue-100">Availability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
