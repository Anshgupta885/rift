/**
 * Main App Component
 * Routes between Home (upload) and Dashboard pages
 */

import { useState, useCallback } from 'react';
import type { AnalysisResponse, UploadStatus } from './types';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = useCallback((data: AnalysisResponse, session: string) => {
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

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        hasAnalysis={analysisData !== null}
        onReset={handleReset}
      />
      
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'home' ? (
          <HomePage
            uploadStatus={uploadStatus}
            setUploadStatus={setUploadStatus}
            error={error}
            setError={setError}
            onAnalysisComplete={handleAnalysisComplete}
          />
        ) : (
          <DashboardPage
            analysisData={analysisData}
            sessionId={sessionId}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
