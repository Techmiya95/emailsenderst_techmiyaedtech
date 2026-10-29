/**
 * Techmiya EdTech - API Service for Google Apps Script Integration
 */

const STORAGE_KEY_GAS_URL = 'TECHMIYA_GAS_URL';
const STORAGE_KEY_TOKEN = 'TECHMIYA_AUTH_TOKEN';
const STORAGE_KEY_USER = 'TECHMIYA_AUTH_USER';
const STORAGE_KEY_MOCK_MODE = 'TECHMIYA_MOCK_MODE';

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzQodHXJdq5GuOHgQMSD9crFAHPPKTKe8CcHMMUtOl3IgdUJqfT-M163Z8cdJ5NAXnL/exec';

/**
 * Get current Google Apps Script Web App URL
 */
export const getGasUrl = () => {
  const custom = localStorage.getItem(STORAGE_KEY_GAS_URL);
  if (custom && custom.trim()) return custom.trim();
  const envUrl = import.meta.env.VITE_GAS_URL;
  if (envUrl && !envUrl.includes('YOUR_APPS_SCRIPT_DEPLOYMENT_ID')) {
    return envUrl.trim();
  }
  return DEFAULT_GAS_URL;
};

/**
 * Set custom Google Apps Script URL
 */
export const setGasUrl = (url) => {
  if (url) {
    localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_GAS_URL);
  }
};

/**
 * Check if mock/offline test mode is active
 */
export const isMockMode = () => {
  const stored = localStorage.getItem(STORAGE_KEY_MOCK_MODE);
  if (stored !== null) return stored === 'true';
  return false;
};

export const setMockMode = (enabled) => {
  localStorage.setItem(STORAGE_KEY_MOCK_MODE, enabled ? 'true' : 'false');
};

/**
 * Authentication tokens
 */
export const getStoredToken = () => localStorage.getItem(STORAGE_KEY_TOKEN);
export const getStoredUser = () => localStorage.getItem(STORAGE_KEY_USER) || 'admin@techmiyaedtech';

export const saveAuthSession = (token, username) => {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_USER, username);
};

export const clearAuthSession = () => {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
};

/**
 * Execute request to Google Apps Script Web App
 */
async function callGas(payload) {
  const url = getGasUrl();

  // If in mock test mode or no URL is available, simulate response
  if (isMockMode() || !url) {
    return handleMockRequest(payload);
  }

  try {
    // Note: text/plain avoids CORS preflight OPTIONS check in Google Apps Script
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('GAS Request Error:', err);
    throw new Error(`Failed to communicate with Google Apps Script: ${err.message}. If deploying, check Web App permissions ("Execute as Me", "Who has access: Anyone").`);
  }
}

/**
 * Mock Handler for testing before Apps Script is deployed
 */
async function handleMockRequest(payload) {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 600));

  const action = payload.action;

  if (action === 'login') {
    const mockUser = 'admin@techmiyaedtech';
    const mockPass = localStorage.getItem('MOCK_ADMIN_PASS') || 'Techmiya@786';

    if (payload.username === mockUser && payload.password === mockPass) {
      return {
        success: true,
        message: 'Login successful (Mock Mode)',
        token: 'mock-token-' + Date.now(),
        username: payload.username,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
    } else {
      return {
        success: false,
        error: 'Invalid username or password. (Default: admin@techmiyaedtech / Techmiya@786)'
      };
    }
  }

  if (action === 'verifySession') {
    return { success: true, valid: true };
  }

  if (action === 'changePassword') {
    const mockPass = localStorage.getItem('MOCK_ADMIN_PASS') || 'Techmiya@786';
    if (payload.currentPassword !== mockPass) {
      return { success: false, error: 'Current password is incorrect' };
    }
    localStorage.setItem('MOCK_ADMIN_PASS', payload.newPassword);
    return { success: true, message: 'Password updated successfully (Mock Mode)' };
  }

  if (action === 'getQuota') {
    return {
      success: true,
      remainingQuota: 450,
      senderEmail: 'techmiyaedtech@gmail.com'
    };
  }

  if (action === 'sendTest') {
    return {
      success: true,
      message: `Test email simulated successfully to ${payload.testEmail}`,
      remainingQuota: 449
    };
  }

  if (action === 'sendBatch') {
    const recipients = payload.recipients || [];
    const results = recipients.map(r => ({
      email: r.email,
      name: r.name,
      status: 'sent',
      error: null
    }));

    return {
      success: true,
      sentCount: recipients.length,
      failedCount: 0,
      totalInBatch: recipients.length,
      remainingQuota: 450 - recipients.length,
      results
    };
  }

  return { success: false, error: `Unknown mock action: ${action}` };
}

/**
 * Public API Methods
 */

export const loginAdmin = async (username, password) => {
  return await callGas({
    action: 'login',
    username: username.trim(),
    password: password
  });
};

export const verifyCurrentSession = async (token) => {
  if (!token) return { success: false, valid: false };
  return await callGas({
    action: 'verifySession',
    token: token
  });
};


export const fetchGmailQuota = async (token) => {
  return await callGas({
    action: 'getQuota',
    token
  });
};

export const sendTestEmail = async (token, { testEmail, subject, htmlBody, attachments, socialLinks }) => {
  return await callGas({
    action: 'sendTest',
    token,
    testEmail: testEmail.trim(),
    subject,
    htmlBody,
    attachments,
    socialLinks
  });
};

export const sendBulkBatch = async (token, { recipients, subject, htmlBody, attachments, socialLinks }) => {
  return await callGas({
    action: 'sendBatch',
    token,
    recipients,
    subject,
    htmlBody,
    attachments,
    socialLinks
  });
};
