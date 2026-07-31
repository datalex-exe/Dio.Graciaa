import React, { useState } from 'react';
import api from '../api.js';
import logoImg from '../logo.png';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials or connection issue.');
    } finally {
      setLoading(false);
    }
  };

  // Helper shortcut to login quickly as a test user
  const handleShortcutLogin = async (shortcutEmail, shortcutPass) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: shortcutEmail, password: shortcutPass });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      console.error(err);
      setError('Shortcut login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box animate-fade-in-up">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img src={logoImg} alt="Dio Grace Logo" style={{ height: '85px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <div className="login-subtitle">Multi-Building Material & Execution Tracking Portal</div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="e.g. setup@diograce.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Preset Shortcuts (Ideal for user-audit and review) */}
        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Testing Shortcut Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.50rem' }}>
            <button
              onClick={() => handleShortcutLogin('setup@diograce.com', 'setup123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
            >
              🔑 Admin
            </button>
            <button
              onClick={() => handleShortcutLogin('site@diograce.com', 'site123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
            >
              🔑 Feeder
            </button>
            <button
              onClick={() => handleShortcutLogin('viewer1@diograce.com', 'viewer123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
            >
              🔑 Executive
            </button>
            <button
              onClick={() => handleShortcutLogin('viewer2@diograce.com', 'viewer456')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
            >
              🔑 Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
