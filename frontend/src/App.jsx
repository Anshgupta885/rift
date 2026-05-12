/**
 * Main App Component
 * Routes between Home (upload) and Dashboard pages
 */

import { useState, useCallback } from 'react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Header from './components/Header';
import { logoutUser } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [analysisData, setAnalysisData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const handleAnalysisComplete = useCallback((data, session) => {
    setAnalysisData(data);
    setSessionId(session);
    setUploadStatus('success');
    setCurrentPage('dashboard');
  }, []);

  const handleReset = useCallback(() => {
    setCurrentPage('home');
    setUploadStatus('idle');
    setAnalysisData(null);
    setSessionId(null);
    setError(null);
  }, []);

  function handleLoginSuccess(userData) {
    setUser(userData);
    setCurrentPage('home');
  }

  function handleSignupSuccess() {
    setCurrentPage('login');
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        hasAnalysis={analysisData !== null}
        onReset={handleReset}
        user={user}
        onLogout={() => { logoutUser(); setUser(null); setCurrentPage('home'); }}
      />
      
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'home' ? (
          <HomePage
            uploadStatus={uploadStatus}
            setUploadStatus={setUploadStatus}
            error={error}
            setError={setError}
            onAnalysisComplete={handleAnalysisComplete}
            onNavigate={setCurrentPage}
          />
        ) : currentPage === 'dashboard' ? (
          <DashboardPage
            analysisData={analysisData}
            sessionId={sessionId}
            onReset={handleReset}
          />
        ) : currentPage === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} onNavigate={setCurrentPage} />
        ) : currentPage === 'signup' ? (
          <Signup onSignupSuccess={handleSignupSuccess} onNavigate={setCurrentPage} />
        ) : null}
      </main>
    </div>
  );
}

export default App;
