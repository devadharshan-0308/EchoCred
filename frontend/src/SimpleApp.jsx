import React, { useState, useEffect } from 'react';
import ModernLogin from './components/ModernLogin';
import RegisterForm from './components/RegisterForm';
import InteractiveDashboard from './components/InteractiveDashboard';
import EnhancedEmployerDashboard from './components/EnhancedEmployerDashboard';
import EnhancedIssuerDashboard from './components/EnhancedIssuerDashboard';

const SimpleApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('✅ Found existing user session:', parsedUser.email);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    console.log('✅ Login successful, setting user:', userData);
    setUser(userData);
    setShowRegister(false);
  };

  const handleRegisterSuccess = (userData) => {
    console.log('✅ Registration successful, setting user:', userData);
    setUser(userData);
    setShowRegister(false);
  };

  const handleLogout = () => {
    console.log('👋 User logged out');
    setUser(null);
    setShowRegister(false);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case 'employer':
        return <EnhancedEmployerDashboard user={user} onLogout={handleLogout} />;
      case 'issuer':
        return <EnhancedIssuerDashboard user={user} onLogout={handleLogout} />;
      case 'learner':
      default:
        return <InteractiveDashboard user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="App">
      {user ? (
        renderDashboard()
      ) : showRegister ? (
        <RegisterForm 
          onRegisterSuccess={handleRegisterSuccess}
          onBackToLogin={handleBackToLogin}
        />
      ) : (
        <ModernLogin 
          onLoginSuccess={handleLoginSuccess}
          onShowRegister={handleShowRegister}
        />
      )}
    </div>
  );
};

export default SimpleApp;
