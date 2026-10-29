/**
 * ============================================================================
 * TECHMIYA EDTECH - BULK EMAIL SENDER (GOOGLE APPS SCRIPT BACKEND)
 * Authorized Sender: techmiyaedtech@gmail.com
 * Domain: email.techmiyaedtech.com
 * ============================================================================
 *
 * Setup Instructions:
 * 1. Open Google Drive (logged into techmiyaedtech@gmail.com).
 * 2. Create a new Google Apps Script project at https://script.google.com/
 * 3. Replace the content of Code.gs with this entire file.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Configuration:
 *      - Description: "Techmiya Bulk Email Sender API"
 *      - Execute as: "Me (techmiyaedtech@gmail.com)"  <-- CRITICAL!
 *      - Who has access: "Anyone"                    <-- CRITICAL!
 * 7. Click "Deploy", review and grant permissions to GmailApp.
 * Deployed Production Web App URL:
 * https://script.google.com/macros/s/AKfycbzQodHXJdq5GuOHgQMSD9crFAHPPKTKe8CcHMMUtOl3IgdUJqfT-M163Z8cdJ5NAXnL/exec
 * ============================================================================
 */

// Default configuration keys in Script Properties
var PROP_ADMIN_USER = 'ADMIN_USERNAME';
var PROP_ADMIN_PASS = 'ADMIN_PASSWORD';
var PROP_SESSIONS = 'ACTIVE_SESSIONS';
var PROP_SHEET_ID = 'CAMPAIGN_LOG_SHEET_ID';

// Default initial credentials (persisted to Script Properties on first run)
var DEFAULT_USERNAME = 'admin@techmiyaedtech';
var DEFAULT_PASSWORD = 'Techmiya@786';

/**
 * Initialize default settings in Script Properties if not already present.
 */
function initSettings() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP_ADMIN_USER)) {
    props.setProperty(PROP_ADMIN_USER, DEFAULT_USERNAME);
  }
  if (!props.getProperty(PROP_ADMIN_PASS)) {
    props.setProperty(PROP_ADMIN_PASS, DEFAULT_PASSWORD);
  }
}

/**
 * Handle HTTP GET requests (Health check, Quota check, Ping)
 */
function doGet(e) {
  initSettings();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';

  var response = {};
  try {
    if (action === 'ping') {
      response = {
        success: true,
        message: 'Techmiya EdTech Bulk Email Sender API is online.',
        timestamp: new Date().toISOString()
      };
    } else if (action === 'quota') {
      var token = e.parameter.token;
      if (!validateSession(token)) {
        return jsonResponse({ success: false, error: 'Unauthorized or session expired' });
      }
      var remainingQuota = MailApp.getRemainingDailyQuota();
      response = {
        success: true,
        remainingQuota: remainingQuota,
        senderEmail: Session.getActiveUser().getEmail() || 'techmiyaedtech@gmail.com'
      };
    } else {
      response = { success: false, error: 'Unknown GET action' };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return jsonResponse(response);
}

/**
 * Handle HTTP POST requests (Login, Send Batch, Send Test, Change Password)
 */
function doPost(e) {
  initSettings();
  var response = {};

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'No payload received' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    switch (action) {
      case 'login':
        response = handleLogin(payload.username, payload.password);
        break;

      case 'verifySession':
        response = handleVerifySession(payload.token);
        break;

      case 'getQuota':
        if (!validateSession(payload.token)) {
          response = { success: false, error: 'Unauthorized: Session invalid or expired' };
        } else {
          response = {
            success: true,
            remainingQuota: MailApp.getRemainingDailyQuota(),
            senderEmail: Session.getActiveUser().getEmail() || 'techmiyaedtech@gmail.com'
          };
        }
        break;

      case 'sendTest':
        if (!validateSession(payload.token)) {
          response = { success: false, error: 'Unauthorized: Session invalid or expired' };
        } else {
          response = handleSendTest(payload);
        }
        break;

      case 'sendBatch':
        if (!validateSession(payload.token)) {
          response = { success: false, error: 'Unauthorized: Session invalid or expired' };
        } else {
          response = handleSendBatch(payload);
        }
        break;

      default:
        response = { success: false, error: 'Invalid action: ' + action };
        break;
    }
  } catch (err) {
    response = {
      success: false,
      error: 'Server execution error: ' + err.toString()
    };
  }

  return jsonResponse(response);
}

/**
 * Handle Admin Login
 */
function handleLogin(username, password) {
  var props = PropertiesService.getScriptProperties();
  var savedUser = props.getProperty(PROP_ADMIN_USER) || DEFAULT_USERNAME;
  var savedPass = props.getProperty(PROP_ADMIN_PASS) || DEFAULT_PASSWORD;

  if (username === savedUser && password === savedPass) {
    var token = generateToken(username);
    saveSession(token, username);
    return {
      success: true,
      message: 'Login successful',
      token: token,
      username: username,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  } else {
    return {
      success: false,
      error: 'Invalid username or password. Please check your credentials.'
    };
  }
}

/**
 * Verify if session token is valid
 */
function handleVerifySession(token) {
  if (validateSession(token)) {
    return { success: true, valid: true };
  } else {
    return { success: false, valid: false, error: 'Session expired or invalid' };
  }
}

/**
 * ============================================================================
 * BACKEND-ONLY ADMIN PASSWORD UTILITY
 * ============================================================================
 * Password CANNOT be changed from the frontend web portal for maximum security.
 *
 * To change the password:
 * 1. In this Google Apps Script editor, run the function:
 *    setAdminPassword("YourNewSecurePassword");
 *    OR
 * 2. Go to Project Settings (gear icon) > Script Properties > Edit "ADMIN_PASSWORD".
 * ============================================================================
 */
function setAdminPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(PROP_ADMIN_PASS, newPassword);
  Logger.log('Admin password successfully updated in Script Properties.');
  return 'Admin password successfully updated to: ' + newPassword;
}

/**
 * Send a single test email
 */
function handleSendTest(payload) {
  var testEmail = payload.testEmail;
  var subject = payload.subject || 'Techmiya EdTech - Test Email';
  var htmlBody = payload.htmlBody || '<p>This is a test email from Techmiya EdTech Bulk Email Sender.</p>';
  var attachments = payload.attachments || [];
  var socialLinks = payload.socialLinks || {};

  if (!testEmail || !isValidEmail(testEmail)) {
    return { success: false, error: 'Valid test email address is required' };
  }

  var recipient = {
    email: testEmail,
    name: payload.recipientName || 'Test Administrator'
  };

  try {
    var blobs = prepareAttachments(attachments);
    var finalSubject = personalize(subject, recipient);
    var finalHtml = buildEmailHtml(htmlBody, recipient, socialLinks);
    var plainText = stripHtml(finalHtml);

    GmailApp.sendEmail(recipient.email, finalSubject, plainText, {
      htmlBody: finalHtml,
      attachments: blobs,
      name: 'Techmiya EdTech',
      replyTo: 'techmiyaedtech@gmail.com'
    });

    logCampaignRecord(recipient.email, recipient.name, finalSubject, 'TEST_SENT', '');

    return {
      success: true,
      message: 'Test email successfully sent to ' + testEmail,
      remainingQuota: MailApp.getRemainingDailyQuota()
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to send test email: ' + err.toString()
    };
  }
}

/**
 * Handle Batch Sending (Controlled batch of recipients)
 */
function handleSendBatch(payload) {
  var recipients = payload.recipients; // Array of { email, name }
  var subject = payload.subject;
  var htmlBody = payload.htmlBody;
  var attachments = payload.attachments || [];
  var socialLinks = payload.socialLinks || {};

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return { success: false, error: 'No recipients provided in batch' };
  }

  if (!subject) {
    return { success: false, error: 'Subject is required' };
  }

  if (!htmlBody) {
    return { success: false, error: 'Email message body is required' };
  }

  var blobs = [];
  try {
    blobs = prepareAttachments(attachments);
  } catch (blobErr) {
    return { success: false, error: 'Error preparing attachments: ' + blobErr.toString() };
  }

  var results = [];
  var sentCount = 0;
  var failedCount = 0;

  for (var i = 0; i < recipients.length; i++) {
    var rec = recipients[i];
    var email = (rec.email || '').trim();
    var name = (rec.name || '').trim();

    if (!isValidEmail(email)) {
      results.push({ email: email, name: name, status: 'failed', error: 'Invalid email address format' });
      failedCount++;
      continue;
    }

    try {
      var personalizedSubject = personalize(subject, { email: email, name: name });
      var personalizedHtml = buildEmailHtml(htmlBody, { email: email, name: name }, socialLinks);
      var plainText = stripHtml(personalizedHtml);

      // Send individual email - recipients cannot see each other
      GmailApp.sendEmail(email, personalizedSubject, plainText, {
        htmlBody: personalizedHtml,
        attachments: blobs,
        name: 'Techmiya EdTech',
        replyTo: 'techmiyaedtech@gmail.com'
      });

      results.push({ email: email, name: name, status: 'sent', error: null });
      sentCount++;
      logCampaignRecord(email, name, personalizedSubject, 'SENT', '');
      
      // Micro-pause to prevent aggressive rate throttling
      Utilities.sleep(150);
    } catch (sendErr) {
      results.push({ email: email, name: name, status: 'failed', error: sendErr.toString() });
      failedCount++;
      logCampaignRecord(email, name, subject, 'FAILED', sendErr.toString());
    }
  }

  return {
    success: true,
    sentCount: sentCount,
    failedCount: failedCount,
    totalInBatch: recipients.length,
    remainingQuota: MailApp.getRemainingDailyQuota(),
    results: results
  };
}

/**
 * Replace placeholders like {{Name}} or {{Email}}
 */
function personalize(text, recipient) {
  if (!text) return '';
  var name = recipient.name || 'Valued Learner';
  var email = recipient.email || '';
  return text
    .replace(/\{\{\s*Name\s*\}\}/gi, name)
    .replace(/\{\{\s*Email\s*\}\}/gi, email);
}

/**
 * Build rich HTML email with Techmiya EdTech styling and footer
 */
function buildEmailHtml(bodyContent, recipient, socialLinks) {
  var personalizedBody = personalize(bodyContent, recipient);

  // Build social icons if provided
  var socialHtml = '';
  var hasSocial = false;

  if (socialLinks) {
    var icons = [];
    if (socialLinks.instagram && socialLinks.instagram.trim()) {
      icons.push('<a href="' + encodeURI(socialLinks.instagram.trim()) + '" style="margin: 0 8px; display: inline-block; color: #E1306C; text-decoration: none; font-weight: 600;">Instagram</a>');
      hasSocial = true;
    }
    if (socialLinks.linkedin && socialLinks.linkedin.trim()) {
      icons.push('<a href="' + encodeURI(socialLinks.linkedin.trim()) + '" style="margin: 0 8px; display: inline-block; color: #0A66C2; text-decoration: none; font-weight: 600;">LinkedIn</a>');
      hasSocial = true;
    }
    if (socialLinks.youtube && socialLinks.youtube.trim()) {
      icons.push('<a href="' + encodeURI(socialLinks.youtube.trim()) + '" style="margin: 0 8px; display: inline-block; color: #FF0000; text-decoration: none; font-weight: 600;">YouTube</a>');
      hasSocial = true;
    }
    if (hasSocial) {
      socialHtml = '<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #E2E8F0; text-align: center;">' +
        '<p style="font-size: 12px; color: #64748B; margin-bottom: 8px;">Connect with Techmiya EdTech:</p>' +
        '<div>' + icons.join(' &bull; ') + '</div>' +
        '</div>';
    }
  }

  var fullTemplate = '<!DOCTYPE html>' +
    '<html>' +
    '<head><meta charset="utf-8"></head>' +
    '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px; color: #1E293B;">' +
    '  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">' +
    '    <div style="background-color: #1E40AF; padding: 18px 24px; text-align: left;">' +
    '      <h2 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Techmiya EdTech</h2>' +
    '      <p style="color: #BFDBFE; margin: 4px 0 0; font-size: 12px;">Empowering Careers Through Quality Education</p>' +
    '    </div>' +
    '    <div style="padding: 24px; font-size: 15px; line-height: 1.6; color: #334155;">' +
           personalizedBody +
    '    </div>' +
         socialHtml +
    '    <div style="background-color: #F8FAFC; padding: 14px 24px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #F1F5F9;">' +
    '      <p style="margin: 0;">Sent by Techmiya EdTech &bull; techmiyaedtech@gmail.com</p>' +
    '      <p style="margin: 4px 0 0;">This email was sent to ' + recipient.email + '</p>' +
    '    </div>' +
    '  </div>' +
    '</body>' +
    '</html>';

  return fullTemplate;
}

/**
 * Prepare attachment blobs from base64 payload
 */
function prepareAttachments(attachments) {
  var blobs = [];
  if (!attachments || !Array.isArray(attachments)) return blobs;

  for (var i = 0; i < attachments.length; i++) {
    var att = attachments[i];
    if (att.base64 && att.name) {
      var decodedData = Utilities.base64Decode(att.base64);
      var blob = Utilities.newBlob(decodedData, att.type || 'application/octet-stream', att.name);
      blobs.push(blob);
    }
  }
  return blobs;
}

/**
 * Log campaign records in a Google Sheet for audit
 */
function logCampaignRecord(email, name, subject, status, error) {
  try {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty(PROP_SHEET_ID);
    var sheet;

    if (!sheetId) {
      var ss = SpreadsheetApp.create('Techmiya EdTech - Bulk Email Campaign Logs');
      sheetId = ss.getId();
      props.setProperty(PROP_SHEET_ID, sheetId);
      sheet = ss.getActiveSheet();
      sheet.appendRow(['Timestamp', 'Recipient Email', 'Recipient Name', 'Subject', 'Status', 'Error Details']);
      sheet.setFrozenRows(1);
    } else {
      var ss = SpreadsheetApp.openById(sheetId);
      sheet = ss.getActiveSheet();
    }

    sheet.appendRow([
      new Date().toISOString(),
      email,
      name,
      subject,
      status,
      error || ''
    ]);
  } catch (err) {
    Logger.log('Optional Sheet logging skipped: ' + err.toString());
  }
}

/**
 * Strip HTML tags for fallback plain text
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Validate email address format
 */
function isValidEmail(email) {
  if (!email) return false;
  var re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).trim());
}

/**
 * Token management
 */
function generateToken(username) {
  var raw = username + ':' + Date.now() + ':' + Math.random();
  return Utilities.base64Encode(raw);
}

function saveSession(token, username) {
  var cache = CacheService.getScriptCache();
  cache.put('session_' + token, username, 21600); // 6 hours
}

function validateSession(token) {
  if (!token) return false;
  var cache = CacheService.getScriptCache();
  var user = cache.get('session_' + token);
  return !!user;
}

/**
 * Standard JSON Response helper
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
