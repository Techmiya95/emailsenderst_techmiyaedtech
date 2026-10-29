import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  Trash2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  MailCheck,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  HelpCircle,
  Search,
  Filter,
  Check
} from 'lucide-react';

import { downloadSampleExcel, parseRecipientsFile, isValidEmail } from '../utils/excelHelper';
import { formatFileSize } from '../utils/emailTemplate';
import { sendTestEmail } from '../services/api';
import { InstagramIcon, LinkedInIcon, YouTubeIcon } from './SocialIcons';

export const EmailSender = ({
  token,
  onOpenPreview,
  onOpenBulkSend,
  onOpenSettings
}) => {
  // --- Section A: Upload Email List State ---
  const [recipientsData, setRecipientsData] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    records: []
  });
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, valid, invalid, duplicate
  const fileInputRef = useRef(null);

  // --- Section B: Email Subject State ---
  const [subject, setSubject] = useState('Exclusive Invitation for {{Name}} | Techmiya EdTech Programs');

  // --- Section C: Email Message State ---
  const [messageHtml, setMessageHtml] = useState(
`<p>Dear {{Name}},</p>
<p>We are delighted to introduce <strong>Techmiya EdTech's</strong> industry-recognized training and career development programs designed to accelerate your professional journey.</p>
<p>Here is what you will experience with us:</p>
<ul>
  <li>Hands-on practical curriculum created by industry veterans</li>
  <li>1-on-1 mentorship and live interactive sessions</li>
  <li>Dedicated placement assistance and career guidance</li>
</ul>
<p>Please find attached our comprehensive course brochure for detailed syllabus and schedule information.</p>
<p>Warm regards,<br><strong>Academic Team</strong><br>Techmiya EdTech</p>`
  );
  const editorRef = useRef(null);

  // --- Section D: Attach Brochures State ---
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const brochureInputRef = useRef(null);

  // --- Section E: Social Media Links State ---
  const [socialLinks, setSocialLinks] = useState({
    instagram: 'https://instagram.com/techmiyaedtech',
    linkedin: 'https://linkedin.com/company/techmiyaedtech',
    youtube: 'https://youtube.com/@techmiyaedtech'
  });

  // --- Section F: Send Email State ---
  const [testEmailAddress, setTestEmailAddress] = useState('techmiyaedtech@gmail.com');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // =========================================================================
  // Section A Handlers: Upload Email List
  // =========================================================================
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    try {
      setFileName(file.name);
      const parsed = await parseRecipientsFile(file);
      setRecipientsData(parsed);
    } catch (err) {
      setUploadError(err.message || 'Error parsing uploaded file. Please ensure it is a valid .xlsx or .csv.');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setUploadError('');
    try {
      setFileName(file.name);
      const parsed = await parseRecipientsFile(file);
      setRecipientsData(parsed);
    } catch (err) {
      setUploadError(err.message || 'Error parsing dropped file.');
    }
  };

  const handleDeleteRecipient = (id) => {
    setRecipientsData((prev) => {
      const updatedRecords = prev.records.filter((r) => r.id !== id);
      const valid = updatedRecords.filter((r) => r.status === 'valid').length;
      const invalid = updatedRecords.filter((r) => r.status === 'invalid').length;
      const duplicates = updatedRecords.filter((r) => r.status === 'duplicate').length;
      return {
        total: updatedRecords.length,
        valid,
        invalid,
        duplicates,
        records: updatedRecords
      };
    });
  };

  const handleLoadSampleRecipients = () => {
    const sample = [
      { id: 'sample-1', email: 'techmiyaedtech@gmail.com', name: 'Techmiya Admin', status: 'valid', reason: '' },
      { id: 'sample-2', email: 'aarav.sharma@example.com', name: 'Aarav Sharma', status: 'valid', reason: '' },
      { id: 'sample-3', email: 'priya.patel@example.com', name: 'Priya Patel', status: 'valid', reason: '' },
      { id: 'sample-4', email: 'rahul.verma@example.com', name: 'Rahul Verma', status: 'valid', reason: '' },
      { id: 'sample-5', email: 'invalid-email-format', name: 'Tester', status: 'invalid', reason: 'Invalid email syntax' }
    ];
    setFileName('Techmiya_Default_Sample_Recipients.xlsx');
    setRecipientsData({
      total: sample.length,
      valid: 4,
      invalid: 1,
      duplicates: 0,
      records: sample
    });
  };

  // Filtered preview records
  const filteredRecords = recipientsData.records.filter((r) => {
    const matchesFilter =
      filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      r.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // =========================================================================
  // Section B & C Handlers: Subject and Editor Formatting
  // =========================================================================
  const insertTokenIntoSubject = (tokenText) => {
    setSubject((prev) => `${prev} ${tokenText}`);
  };

  const insertTokenIntoMessage = (tokenText) => {
    setMessageHtml((prev) => `${prev} ${tokenText} `);
  };

  const applyFormatting = (tag) => {
    if (tag === 'p') {
      setMessageHtml((prev) => `${prev}\n<p>New paragraph here</p>`);
    } else if (tag === 'b') {
      setMessageHtml((prev) => `${prev}<strong>bold text</strong>`);
    } else if (tag === 'i') {
      setMessageHtml((prev) => `${prev}<em>italic text</em>`);
    } else if (tag === 'ul') {
      setMessageHtml((prev) => `${prev}\n<ul>\n  <li>List item 1</li>\n  <li>List item 2</li>\n</ul>`);
    } else if (tag === 'a') {
      const url = prompt('Enter destination URL (e.g., https://techmiyaedtech.com):', 'https://techmiyaedtech.com');
      if (url) {
        setMessageHtml((prev) => `${prev} <a href="${url}">Click here</a>`);
      }
    } else if (tag === 'br') {
      setMessageHtml((prev) => `${prev}<br/>\n`);
    }
  };

  // =========================================================================
  // Section D Handlers: Attach Brochures
  // =========================================================================
  const handleBrochureUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setAttachmentError('');
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB Gmail quota limit

    const newAttachments = [...attachments];

    for (const file of files) {
      // Read as base64
      const base64 = await readFileAsBase64(file);
      newAttachments.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        base64: base64
      });
    }

    const totalBytes = newAttachments.reduce((acc, curr) => acc + curr.size, 0);
    if (totalBytes > MAX_TOTAL_SIZE) {
      setAttachmentError(`Total attachments size (${formatFileSize(totalBytes)}) exceeds Gmail's 25 MB limit. Please remove some files.`);
    }

    setAttachments(newAttachments);
    if (brochureInputRef.current) {
      brochureInputRef.current.value = '';
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // strip data:...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (index) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    const totalBytes = updated.reduce((acc, curr) => acc + curr.size, 0);
    if (totalBytes <= 25 * 1024 * 1024) {
      setAttachmentError('');
    }
  };

  const totalAttachmentsSize = attachments.reduce((acc, curr) => acc + curr.size, 0);

  // =========================================================================
  // Section F Handlers: Send Action Controls
  // =========================================================================
  const handleOpenPreview = () => {
    onOpenPreview({
      subject,
      htmlBody: messageHtml,
      recipients: recipientsData.records,
      attachments,
      socialLinks
    });
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testEmailAddress || !isValidEmail(testEmailAddress)) {
      setTestResult({ success: false, message: 'Please enter a valid recipient email address for testing.' });
      return;
    }

    setTestSending(true);
    setTestResult(null);

    try {
      const res = await sendTestEmail(token, {
        testEmail: testEmailAddress,
        subject,
        htmlBody: messageHtml,
        attachments,
        socialLinks
      });

      if (res && res.success) {
        setTestResult({
          success: true,
          message: res.message || `Test email successfully sent to ${testEmailAddress}`
        });
      } else {
        setTestResult({
          success: false,
          message: res?.error || 'Failed to send test email.'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Error communicating with Google Apps Script.'
      });
    } finally {
      setTestSending(false);
    }
  };

  const handleOpenBulkSendConfirm = () => {
    if (recipientsData.valid === 0) {
      alert('Please upload an email list with at least one valid recipient before sending bulk emails.');
      return;
    }
    if (!subject.trim()) {
      alert('Please provide an email subject before sending.');
      return;
    }
    if (!messageHtml.trim()) {
      alert('Please provide an email message before sending.');
      return;
    }
    if (totalAttachmentsSize > 25 * 1024 * 1024) {
      alert('Total attachment size exceeds the 25 MB limit. Please reduce attachments before sending.');
      return;
    }

    onOpenBulkSend({
      recipients: recipientsData.records,
      subject,
      htmlBody: messageHtml,
      attachments,
      socialLinks
    });
  };

  return (
    <main className="main-content">
      {/* Page Title & Context */}
      <div className="page-intro">
        <h2>Bulk Email Dispatcher</h2>
        <p>Send personalized emails with brochure attachments to your prospective learners through Techmiya EdTech.</p>
      </div>

      {/* ================================================================= */}
      {/* SECTION A: UPLOAD EMAIL LIST */}
      {/* ================================================================= */}
      <section className="section-card" id="section-upload">
        <div className="section-header">
          <div className="section-title">
            <span className="section-step-badge">A</span>
            <div>
              <h3>Upload Email List</h3>
              <p className="section-subtitle">Supported formats: Excel (.xlsx, .xls) and CSV</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={downloadSampleExcel}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              Download Sample Excel
            </button>
            {recipientsData.total === 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleLoadSampleRecipients}
                style={{ fontSize: '0.8rem', color: 'var(--primary-700)' }}
              >
                Load Demo List
              </button>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="alert-banner error">
            <AlertCircle size={16} />
            <div>{uploadError}</div>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon">
            <UploadCloud size={40} />
          </div>
          <div className="dropzone-title">
            {fileName ? `File Selected: ${fileName}` : 'Click or Drag & Drop Excel or CSV file here'}
          </div>
          <div className="dropzone-desc">
            Standard expected columns: <strong>Email</strong> and <strong>Name</strong>
          </div>
        </div>

        {/* Recipients Summary Statistics */}
        {recipientsData.total > 0 && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Uploaded</div>
                <div className="stat-value">{recipientsData.total}</div>
              </div>
              <div className="stat-card valid">
                <div className="stat-label">Valid Emails</div>
                <div className="stat-value">{recipientsData.valid}</div>
              </div>
              <div className="stat-card invalid">
                <div className="stat-label">Invalid Emails</div>
                <div className="stat-value">{recipientsData.invalid}</div>
              </div>
              <div className="stat-card duplicates">
                <div className="stat-label">Duplicates</div>
                <div className="stat-value">{recipientsData.duplicates}</div>
              </div>
            </div>

            {/* Recipient List Preview Table */}
            <div className="table-container">
              <div className="table-header-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={16} color="var(--primary-700)" />
                  <strong style={{ fontSize: '0.88rem' }}>Uploaded Recipients Preview ({filteredRecords.length})</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="input-with-icon">
                    <span className="input-icon-left" style={{ left: '8px' }}>
                      <Search size={13} />
                    </span>
                    <input
                      type="text"
                      className="form-input table-search"
                      placeholder="Search name or email..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-input"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
                  >
                    <option value="all">All ({recipientsData.total})</option>
                    <option value="valid">Valid ({recipientsData.valid})</option>
                    <option value="invalid">Invalid ({recipientsData.invalid})</option>
                    <option value="duplicate">Duplicates ({recipientsData.duplicates})</option>
                  </select>
                </div>
              </div>

              <div className="recipient-table-scroll">
                <table className="recipient-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Email Address</th>
                      <th>Recipient Name</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--neutral-400)' }}>
                          No recipients match your search/filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r, index) => (
                        <tr key={r.id}>
                          <td style={{ color: 'var(--neutral-400)', fontSize: '0.8rem' }}>{index + 1}</td>
                          <td>
                            <strong style={{ color: 'var(--neutral-800)' }}>{r.email}</strong>
                          </td>
                          <td style={{ color: 'var(--neutral-600)' }}>{r.name || 'Learner'}</td>
                          <td>
                            <span className={`badge badge-${r.status}`}>
                              {r.status.toUpperCase()}
                              {r.reason && ` - ${r.reason}`}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => handleDeleteRecipient(r.id)}
                              title="Remove recipient"
                              style={{ color: 'var(--error-accent)', padding: '4px' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ================================================================= */}
      {/* SECTION B: EMAIL SUBJECT */}
      {/* ================================================================= */}
      <section className="section-card" id="section-subject">
        <div className="section-header">
          <div className="section-title">
            <span className="section-step-badge">B</span>
            <div>
              <h3>Email Subject</h3>
              <p className="section-subtitle">The subject line that your recipients will see in their inbox</p>
            </div>
          </div>
          <div>
            <button
              type="button"
              className="token-pill"
              onClick={() => insertTokenIntoSubject('{{Name}}')}
              title="Click to insert {{Name}} placeholder"
            >
              + Insert &#123;&#123;Name&#125;&#125;
            </button>
          </div>
        </div>

        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Welcome to Techmiya EdTech, {{Name}}!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ fontSize: '1rem', fontWeight: 500 }}
            required
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', marginTop: '6px' }}>
            Tip: Personalizing subject lines with <strong>&#123;&#123;Name&#125;&#125;</strong> significantly improves open rates.
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION C: EMAIL MESSAGE */}
      {/* ================================================================= */}
      <section className="section-card" id="section-message">
        <div className="section-header">
          <div className="section-title">
            <span className="section-step-badge">C</span>
            <div>
              <h3>Email Message</h3>
              <p className="section-subtitle">Compose your message with paragraphs, bold text, links, and placeholders</p>
            </div>
          </div>
          <div>
            <button
              type="button"
              className="token-pill"
              onClick={() => insertTokenIntoMessage('{{Name}}')}
              title="Insert {{Name}} token into message"
            >
              + Insert &#123;&#123;Name&#125;&#125;
            </button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="editor-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => applyFormatting('p')}
            title="Add Paragraph"
          >
            &lt;P&gt; Paragraph
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => applyFormatting('b')}
            title="Bold"
          >
            <Bold size={14} /> <strong>B</strong>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => applyFormatting('i')}
            title="Italic"
          >
            <Italic size={14} /> <em>I</em>
          </button>
          <div className="toolbar-divider"></div>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => applyFormatting('ul')}
            title="Bullet List"
          >
            <List size={14} /> Bullet List
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => applyFormatting('a')}
            title="Insert Link"
          >
            <LinkIcon size={14} /> Link
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => applyFormatting('br')}
            title="Line Break"
          >
            Line Break &lt;br/&gt;
          </button>
        </div>

        {/* Message Textarea */}
        <textarea
          ref={editorRef}
          className="editor-textarea"
          value={messageHtml}
          onChange={(e) => setMessageHtml(e.target.value)}
          placeholder="Write your email content here. HTML tags like <p>, <strong>, <em>, and <a> are supported..."
          rows={10}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
          <span>Supports standard HTML tags and <code>&#123;&#123;Name&#125;&#125;</code> placeholder.</span>
          <span>{messageHtml.length} characters</span>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION D: ATTACH BROCHURES */}
      {/* ================================================================= */}
      <section className="section-card" id="section-brochures">
        <div className="section-header">
          <div className="section-title">
            <span className="section-step-badge">D</span>
            <div>
              <h3>Attach Brochures</h3>
              <p className="section-subtitle">Attach program prospectuses, syllabus PDFs, or certificates (Max 25 MB)</p>
            </div>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => brochureInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Paperclip size={14} />
              Add Documents
            </button>
            <input
              type="file"
              ref={brochureInputRef}
              onChange={handleBrochureUpload}
              multiple
              accept=".pdf, .docx, .doc, .png, .jpg, .jpeg"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {attachmentError && (
          <div className="alert-banner error" style={{ marginBottom: '14px' }}>
            <AlertCircle size={16} />
            <div>{attachmentError}</div>
          </div>
        )}

        {attachments.length === 0 ? (
          <div
            style={{
              padding: '24px',
              border: '1px dashed var(--neutral-300)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--neutral-500)',
              fontSize: '0.875rem'
            }}
          >
            <Paperclip size={28} style={{ margin: '0 auto 8px', color: 'var(--neutral-400)' }} />
            <p>No brochures or documents attached yet.</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--neutral-400)', marginTop: '4px' }}>
              Click "Add Documents" to upload your Techmiya course brochures.
            </p>
          </div>
        ) : (
          <div>
            <div className="attachments-list">
              {attachments.map((file, idx) => (
                <div key={idx} className="attachment-item">
                  <div className="attachment-meta">
                    <Paperclip size={16} color="var(--primary-700)" />
                    <span className="attachment-name">{file.name}</span>
                    <span className="attachment-size">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => handleRemoveAttachment(idx)}
                    style={{ color: 'var(--error-accent)', padding: '4px' }}
                    title="Remove attachment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
              <span>Total Attachments: <strong>{attachments.length}</strong></span>
              <span style={{ color: totalAttachmentsSize > 25 * 1024 * 1024 ? 'var(--error-accent)' : 'inherit', fontWeight: 600 }}>
                Total Size: {formatFileSize(totalAttachmentsSize)} / 25 MB max limit
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* SECTION E: SOCIAL MEDIA LINKS */}
      {/* ================================================================= */}
      <section className="section-card" id="section-social">
        <div className="section-header">
          <div className="section-title">
            <span className="section-step-badge">E</span>
            <div>
              <h3>Social Media Links</h3>
              <p className="section-subtitle">Optional channels to include in your email footer. Only populated links appear.</p>
            </div>
          </div>
        </div>

        <div className="social-inputs-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="social-instagram">Instagram URL</label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <InstagramIcon size={16} color="#E1306C" />
              </span>
              <input
                id="social-instagram"
                type="url"
                className="form-input"
                placeholder="https://instagram.com/techmiyaedtech"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="social-linkedin">LinkedIn URL</label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <LinkedInIcon size={16} color="#0A66C2" />
              </span>
              <input
                id="social-linkedin"
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/company/techmiyaedtech"
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="social-youtube">YouTube URL</label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <YouTubeIcon size={16} color="#FF0000" />
              </span>
              <input
                id="social-youtube"
                type="url"
                className="form-input"
                placeholder="https://youtube.com/@techmiyaedtech"
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION F: SEND EMAIL */}
      {/* ================================================================= */}
      <section className="section-card" id="section-send">
        <div className="section-header">
          <div className="section-title">
            <span className="section-step-badge">F</span>
            <div>
              <h3>Send Email</h3>
              <p className="section-subtitle">Review, test deliverability, and execute bulk email delivery</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-group">
          {/* Button 1: Preview Email */}
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={handleOpenPreview}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Eye size={18} />
            Preview Email
          </button>

          {/* Button 2: Send Test Email */}
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => setShowTestDialog(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MailCheck size={18} color="var(--primary-700)" />
            Send Test Email
          </button>

          {/* Button 3: Send Bulk Email */}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleOpenBulkSendConfirm}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Send size={18} />
            Send Bulk Email ({recipientsData.valid} Valid)
          </button>
        </div>

        {/* Send Test Email Inline Dialog */}
        {showTestDialog && (
          <div style={{ marginTop: '20px', padding: '18px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '10px' }}>
              Send Test Verification Email
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--neutral-600)', marginBottom: '14px' }}>
              Dispatch a single test email with all attachments and social links to verify rendering and deliverability.
            </p>

            {testResult && (
              <div className={`alert-banner ${testResult.success ? 'success' : 'error'}`} style={{ marginBottom: '14px' }}>
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <div>{testResult.message}</div>
              </div>
            )}

            <form onSubmit={handleSendTest} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="email"
                className="form-input"
                placeholder="techmiyaedtech@gmail.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                style={{ flex: '1', minWidth: '240px' }}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={testSending}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} />
                {testSending ? 'Sending Test...' : 'Send Test Now'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowTestDialog(false);
                  setTestResult(null);
                }}
              >
                Close
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
};
