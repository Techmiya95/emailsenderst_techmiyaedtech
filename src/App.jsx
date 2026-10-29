import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminLogin } from './components/AdminLogin';
import { EmailSender } from './components/EmailSender';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { SendProgressModal } from './components/SendProgressModal';
import { SettingsModal } from './components/SettingsModal';

import {
  getStoredToken,
  getStoredUser,
  clearAuthSession,
  verifyCurrentSession,
  fetchGmailQuota
} from './services/api';

export function App() {
  const [token, setToken] = useState(getStoredToken());
  const [username, setUsername] = useState(getStoredUser());
  const [quota, setQuota] = useState(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // Modal Visibility States
  const [previewData, setPreviewData] = useState(null);
  const [bulkSendData, setBulkSendData] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Verify session on mount
  useEffect(() => {
    const verifyAndLoad = async () => {
      const stored = getStoredToken();
      if (stored) {
        try {
          const res = await verifyCurrentSession(stored);
          if (res && res.valid) {
            setToken(stored);
            loadQuota(stored);
          } else {
            handleLogout();
          }
        } catch {
          // If offline or network glitch, preserve session for usability
          loadQuota(stored);
        }
      }
    };
    verifyAndLoad();
  }, []);

  const loadQuota = async (activeToken) => {
    if (!activeToken) return;
    setLoadingQuota(true);
    try {
      const res = await fetchGmailQuota(activeToken);
      if (res && res.success && typeof res.remainingQuota === 'number') {
        setQuota(res.remainingQuota);
      }
    } catch (err) {
      console.warn('Quota load notice:', err);
    } finally {
      setLoadingQuota(false);
    }
  };

  const handleLoginSuccess = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    loadQuota(newToken);
  };

  const handleLogout = () => {
    clearAuthSession();
    setToken(null);
    setQuota(null);
  };

  const handleCampaignCompleted = (sent, failed) => {
    // Refresh quota after sending emails
    if (token) {
      loadQuota(token);
    }
  };

  return (
    <div className="app-container">
      {token ? (
        <>
          <Navbar
            username={username}
            quota={quota}
            loadingQuota={loadingQuota}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onLogout={handleLogout}
            onRefreshQuota={() => loadQuota(token)}
          />

          <EmailSender
            token={token}
            onOpenPreview={(data) => setPreviewData(data)}
            onOpenBulkSend={(data) => setBulkSendData(data)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />

          {/* Email Preview Modal */}
          {previewData && (
            <EmailPreviewModal
              isOpen={!!previewData}
              onClose={() => setPreviewData(null)}
              subject={previewData.subject}
              htmlBody={previewData.htmlBody}
              recipients={previewData.recipients}
              attachments={previewData.attachments}
              socialLinks={previewData.socialLinks}
            />
          )}

          {/* Bulk Send Progress & Confirmation Modal */}
          {bulkSendData && (
            <SendProgressModal
              isOpen={!!bulkSendData}
              onClose={() => setBulkSendData(null)}
              token={token}
              recipients={bulkSendData.recipients}
              subject={bulkSendData.subject}
              htmlBody={bulkSendData.htmlBody}
              attachments={bulkSendData.attachments}
              socialLinks={bulkSendData.socialLinks}
              onCompleted={handleCampaignCompleted}
            />
          )}

        </>
      ) : (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Global Settings & Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        token={token}
        onQuotaUpdated={(newQuota) => setQuota(newQuota)}
      />

      <footer className="app-footer">
        <p>
          &copy; {new Date().getFullYear()} <strong>Techmiya EdTech</strong> &bull; Official Email Portal: <code>emailsender.techmiyaedtech.com</code> &bull; Sender: <code>techmiyaedtech@gmail.com</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
