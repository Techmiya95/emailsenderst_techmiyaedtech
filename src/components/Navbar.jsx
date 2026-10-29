import React from 'react';
import { Mail, LogOut, Settings, RefreshCw, CheckCircle2 } from 'lucide-react';

export const Navbar = ({
  username,
  quota,
  onOpenSettings,
  onLogout,
  onRefreshQuota,
  loadingQuota
}) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand identity */}
        <div className="brand-badge">
          <div className="brand-logo-icon">
            <Mail size={22} strokeWidth={2.4} />
          </div>
          <div className="brand-info">
            <h1>Techmiya EdTech</h1>
            <p>Bulk Email Sender &bull; techmiyaedtech@gmail.com</p>
          </div>
        </div>

        {/* Header action controls */}
        <div className="header-actions">
          {quota !== null && (
            <div className="quota-pill" title="Remaining daily emails you can send via GmailApp">
              <span>Daily Quota:</span>
              <strong>{quota}</strong>
              <button
                type="button"
                onClick={onRefreshQuota}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center', color: 'var(--primary-800)' }}
                title="Refresh remaining quota"
              >
                <RefreshCw size={12} className={loadingQuota ? 'animate-spin' : ''} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenSettings}
            title="Configure Apps Script Web App URL and options"
          >
            <Settings size={14} />
            Settings
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onLogout}
            title="Log out from administration portal"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
