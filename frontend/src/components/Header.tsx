/**
 * Header Component
 * Navigation and branding
 */

interface HeaderProps {
  currentPage: 'home' | 'dashboard';
  onNavigate: (page: 'home' | 'dashboard') => void;
  hasAnalysis: boolean;
  onReset: () => void;
}

function Header({ currentPage, onNavigate, hasAnalysis, onReset }: HeaderProps) {
  return (
    <header className="bg-dark-800 border-b border-dark-600">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Financial Crime Detection</h1>
              <p className="text-xs text-gray-400">Graph-Based Fraud Analysis Engine</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'home'
                  ? 'bg-accent-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              Upload
            </button>
            
            <button
              onClick={() => onNavigate('dashboard')}
              disabled={!hasAnalysis}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-accent-primary text-white'
                  : hasAnalysis
                  ? 'text-gray-400 hover:text-white hover:bg-dark-700'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
            >
              Dashboard
            </button>

            {hasAnalysis && (
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
              >
                New Analysis
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
