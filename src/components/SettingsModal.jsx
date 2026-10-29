import React, { useState, useEffect } from 'react';
import { X, Settings, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { getGasUrl, setGasUrl, isMockMode, setMockMode, fetchGmailQuota } from '../services/api';

export const SettingsModal = ({ isOpen, onClose, token, onQuotaUpdated }) => {
  const [gasUrl, setLocalGasUrl] = useState('');
  const [mockMode, setLocalMockMode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalGasUrl(getGasUrl());
      setLocalMockMode(isMockMode());
      setTestResult(null);
      setSavedNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGasUrl(gasUrl);
    setMockMode(mockMode);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Temporary save url to test
      setGasUrl(gasUrl);
      setMockMode(mockMode);

      const res = await fetchGmailQuota(token || 'test-token');
      if (res && res.success) {
        setTestResult({
          success: true,
          message: `Connected! Remaining Gmail Daily Quota: ${res.remainingQuota} emails`,
          quota: res.remainingQuota,
          sender: res.senderEmail
        });
        if (onQuotaUpdated && typeof res.remainingQuota === 'number') {
          onQuotaUpdated(res.remainingQuota);
        }
      } else {
        setTestResult({
          success: false,
          message: res?.error || 'Connection failed. Please verify the Web App URL and permissions.'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while contacting Google Apps Script.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="var(--primary-700)" />
            <h3>System Settings & Apps Script Configuration</h3>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {savedNotice && (
            <div className="alert-banner success" style={{ padding: '8px 12px', fontSize: '0.84rem' }}>
              <CheckCircle2 size={16} />
              <div>Settings saved successfully!</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="gas-url-input">
              Google Apps Script Web App URL
              <span className="form-label-help">(Must end with /exec)</span>
            </label>
            <input
              id="gas-url-input"
              type="url"
              className="form-input"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={gasUrl}
              onChange={(e) => setLocalGasUrl(e.target.value)}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', marginTop: '6px' }}>
              Deploys from Google Apps Script with <strong>Execute as: Me (techmiyaedtech@gmail.com)</strong> and <strong>Who has access: Anyone</strong>.
            </p>
          </div>

          <div style={{ padding: '14px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: 'var(--neutral-800)' }}>
              <input
                type="checkbox"
                checked={mockMode}
                onChange={(e) => setLocalMockMode(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Enable Local Demo / Mock Mode
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', marginTop: '4px', paddingLeft: '26px' }}>
              Allows previewing uploads, email formatting, and test workflows locally without sending actual emails or when testing without an internet connection.
            </p>
          </div>

          {testResult && (
            <div className={`alert-banner ${testResult.success ? 'success' : 'error'}`} style={{ padding: '10px 14px', fontSize: '0.84rem' }}>
              {testResult.success ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <div>{testResult.message}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing Connection...' : 'Test Connection & Check Quota'}
            </button>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--neutral-200)', paddingTop: '14px', fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
            <strong>Authorized Account:</strong> techmiyaedtech@gmail.com &bull; <strong>Domain:</strong> email.techmiyaedtech.com
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
