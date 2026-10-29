import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginAdmin, saveAuthSession, isMockMode, getGasUrl } from '../services/api';

export const AdminLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin@techmiyaedtech');
  const [password, setPassword] = useState('Techmiya@786');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mockActive = isMockMode();
  const gasUrl = getGasUrl();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginAdmin(username, password);

      if (res && res.success && res.token) {
        saveAuthSession(res.token, res.username || username);
        onLoginSuccess(res.token, res.username || username);
      } else {
        setError(res?.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to Google Apps Script.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Mail size={26} strokeWidth={2.2} />
          </div>
          <h2>Techmiya EdTech</h2>
          <p>Bulk Email Sender Administration Portal</p>
        </div>

        {/* System connection badge */}
        <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-text)', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-accent)', display: 'inline-block' }}></span>
            Connected to Apps Script
          </span>
        </div>

        {error && (
          <div className="alert-banner error" style={{ padding: '10px 14px', fontSize: '0.84rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-username">Admin Username</label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <User size={16} />
              </span>
              <input
                id="admin-username"
                type="text"
                className="form-input"
                placeholder="admin@techmiyaedtech"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" htmlFor="admin-password">Admin Password</label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <Lock size={16} />
              </span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--neutral-400)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: '22px', textAlign: 'center', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.76rem', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--primary-700)" />
            Authorized Google Workspace Email: <strong>techmiyaedtech@gmail.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
