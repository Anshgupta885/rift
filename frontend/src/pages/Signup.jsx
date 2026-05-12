import { useState } from 'react';
import { registerUser } from '../services/api';

function Signup({ onSignupSuccess, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await registerUser({ name, email, password, role });
      setLoading(false);
      if (onSignupSuccess) onSignupSuccess(data);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Registration failed');
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="card mb-6" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-900)' }}>Create account</h2>
        <p className="annotation" style={{ color: '#a09590', marginTop: '0.5rem' }}>Sign up to save your analyses</p>

        {error && <div style={{ color: '#c44a2a', marginTop: '0.75rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          <input required placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="input" />
          <input required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" />
          <input required placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" />

          <label style={{ color: '#a09590', fontSize: '0.85rem' }}>
            Role
            <select value={role} onChange={e => setRole(e.target.value)} className="input" style={{ marginTop: '0.25rem' }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--ink-500)' }}>Already have an account? </span>
              <button type="button" onClick={() => onNavigate && onNavigate('login')} style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Sign in</button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
