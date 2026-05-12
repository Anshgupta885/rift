/**
 * Header Component — editorial/warm aesthetic
 */

function Header({ currentPage, onNavigate, hasAnalysis, onReset, user, onLogout }) {
  return (
    <header style={{ background: 'rgba(253, 250, 245, 0.92)', backdropFilter: 'blur(12px)' }}
      className="border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        {/* Top bar with publication-style layout */}
        <div className="flex items-center justify-between py-3 border-b border-stone-200">
          <p className="annotation" style={{ color: '#a09590' }}>
            Financial Crime Detection Engine
          </p>
          <p className="annotation" style={{ color: '#a09590' }}>
            Graph-Based Pattern Analysis
          </p>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{
                background: 'var(--ink-900)',
                borderRadius: '3px',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 3v1.5M6.343 6.343l-1.06-1.06M3 12H1.5M6.343 17.657l-1.06 1.06M12 21v-1.5M17.657 17.657l1.06 1.06M21 12h1.5M17.657 6.343l1.06-1.06M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.1 }}>
                Ledger<span style={{ color: 'var(--amber)' }}>Lens</span>
              </h1>
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavButton
              active={currentPage === 'home'}
              onClick={() => onNavigate('home')}
            >
              Upload
            </NavButton>

            <NavButton
              active={currentPage === 'dashboard'}
              onClick={() => hasAnalysis && onNavigate('dashboard')}
              disabled={!hasAnalysis}
            >
              Analysis
            </NavButton>

            {hasAnalysis && (
              <>
                <span style={{ color: '#c8bfb5', margin: '0 0.25rem' }}>|</span>
                <button
                  onClick={onReset}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8rem',
                    color: '#a09590',
                    background: 'none',
                    border: 'none',
                    padding: '0.375rem 0.75rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink-900)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#a09590')}
                >
                  New file ↻
                </button>
              </>
            )}
            {/* Auth buttons */}
            <div style={{ width: '1px', height: '28px', background: 'transparent' }} />
            {user ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-900)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>{user.name || user.email}</span>
                <button
                  onClick={() => { if (onLogout) onLogout(); }}
                  className="btn-ghost"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => onNavigate('login')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'var(--ink-900)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Sign in</button>
                <button onClick={() => onNavigate('signup')} className="btn-primary" style={{ padding: '0.35rem 0.65rem' }}>Sign up</button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavButton({
  active,
  onClick,
  disabled,
  children,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.8rem',
        fontWeight: active ? 600 : 400,
        color: disabled ? '#c8bfb5' : active ? 'var(--ink-900)' : 'var(--ink-500)',
        background: active ? 'rgba(26, 20, 16, 0.07)' : 'transparent',
        border: '1px solid',
        borderColor: active ? 'rgba(26, 20, 16, 0.15)' : 'transparent',
        borderRadius: '3px',
        padding: '0.375rem 0.875rem',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </button>
  );
}

export default Header;
