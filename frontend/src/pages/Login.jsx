import { useState } from 'react';
import { loginUser } from '../services/api';

function Login({ onLoginSuccess, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess(data);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="card mb-6" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-900)' }}>Sign in</h2>
        <p className="annotation" style={{ color: '#a09590', marginTop: '0.5rem' }}>Access your account</p>

        {error && <div style={{ color: '#c44a2a', marginTop: '0.75rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          <input autoFocus required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" />
          <input required placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--ink-500)' }}>Don't have an account? </span>
              <button type="button" onClick={() => onNavigate && onNavigate('signup')} style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Sign up</button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
