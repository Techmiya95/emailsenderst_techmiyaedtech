import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, CheckCircle, XCircle, Download, RotateCcw, ShieldCheck } from 'lucide-react';
import { sendBulkBatch } from '../services/api';
import * as XLSX from 'xlsx';

export const SendProgressModal = ({
  isOpen,
  onClose,
  token,
  recipients,
  subject,
  htmlBody,
  attachments,
  socialLinks,
  onCompleted
}) => {
  const [phase, setPhase] = useState('confirm'); // 'confirm' | 'sending' | 'completed' | 'aborted'
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentRecipient, setCurrentRecipient] = useState('');
  const [resultsLog, setResultsLog] = useState([]);
  const [isAborted, setIsAborted] = useState(false);
  const [abortRequested, setAbortRequested] = useState(false);

  const validRecipients = recipients.filter(r => r.status === 'valid');

  useEffect(() => {
    if (isOpen) {
      setPhase('confirm');
      setProgress(0);
      setSentCount(0);
      setFailedCount(0);
      setCurrentRecipient('');
      setResultsLog([]);
      setIsAborted(false);
      setAbortRequested(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartSending = async () => {
    setPhase('sending');
    setProgress(0);
    setSentCount(0);
    setFailedCount(0);
    setResultsLog([]);

    const BATCH_SIZE = 5; // Controlled batching to respect Google Apps Script 6-minute limits
    const total = validRecipients.length;
    let accumulatedSent = 0;
    let accumulatedFailed = 0;
    const accumulatedLog = [];

    // Pre-convert attachments to base64 once for efficiency
    const encodedAttachments = [];
    for (const file of attachments) {
      if (file.base64) {
        encodedAttachments.push({
          name: file.name,
          type: file.type || 'application/pdf',
          base64: file.base64
        });
      }
    }

    for (let i = 0; i < total; i += BATCH_SIZE) {
      if (abortRequested) {
        setIsAborted(true);
        break;
      }

      const batch = validRecipients.slice(i, i + BATCH_SIZE);
      const batchRecipients = batch.map(r => ({ email: r.email, name: r.name }));

      setCurrentRecipient(batch.map(r => r.email).join(', '));

      try {
        const res = await sendBulkBatch(token, {
          recipients: batchRecipients,
          subject,
          htmlBody,
          attachments: encodedAttachments,
          socialLinks
        });

        if (res && res.success && res.results) {
          res.results.forEach(item => {
            accumulatedLog.push({
              email: item.email,
              name: item.name,
              status: item.status,
              error: item.error || ''
            });
            if (item.status === 'sent') {
              accumulatedSent++;
            } else {
              accumulatedFailed++;
            }
          });
        } else {
          // Entire batch failed
          batch.forEach(r => {
            accumulatedLog.push({
              email: r.email,
              name: r.name,
              status: 'failed',
              error: res?.error || 'Batch submission failed'
            });
            accumulatedFailed++;
          });
        }
      } catch (err) {
        batch.forEach(r => {
          accumulatedLog.push({
            email: r.email,
            name: r.name,
            status: 'failed',
            error: err.message || 'Network error'
          });
          accumulatedFailed++;
        });
      }

      setSentCount(accumulatedSent);
      setFailedCount(accumulatedFailed);
      setResultsLog([...accumulatedLog]);

      const currentProcessed = Math.min(i + BATCH_SIZE, total);
      const percent = Math.round((currentProcessed / total) * 100);
      setProgress(percent);

      // Micro delay between batches to respect rate limits
      await new Promise(r => setTimeout(r, 400));
    }

    setPhase('completed');
    if (onCompleted) {
      onCompleted(accumulatedSent, accumulatedFailed);
    }
  };

  const handleDownloadReport = () => {
    const reportData = resultsLog.map(r => ({
      'Recipient Email': r.email,
      'Recipient Name': r.name,
      'Status': r.status.toUpperCase(),
      'Error Details': r.error || 'None'
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 35 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sending_Report');
    XLSX.writeFile(workbook, `Techmiya_Email_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-lg">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="var(--primary-700)" />
            <h3>
              {phase === 'confirm' && 'Confirm Bulk Email Dispatch'}
              {phase === 'sending' && 'Sending Campaign in Progress...'}
              {phase === 'completed' && 'Email Dispatch Completed'}
            </h3>
          </div>
          {phase !== 'sending' && (
            <button type="button" className="btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Phase 1: Confirmation */}
        {phase === 'confirm' && (
          <div className="modal-body">
            <div className="alert-banner warning" style={{ marginBottom: '20px' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Please review campaign details before sending:</strong>
                <p style={{ marginTop: '4px', fontSize: '0.84rem' }}>
                  Bulk sending will immediately dispatch individual personalized emails via <strong>techmiyaedtech@gmail.com</strong> using Google Apps Script.
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--neutral-600)', fontSize: '0.88rem' }}>Target Valid Recipients:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '1rem' }}>
                  {validRecipients.length} recipients
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--neutral-600)', fontSize: '0.88rem' }}>Subject Line:</span>
                <span style={{ fontWeight: 600, color: 'var(--neutral-800)', fontSize: '0.88rem', maxWidth: '350px', textAlign: 'right' }}>
                  {subject || '(No Subject)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--neutral-600)', fontSize: '0.88rem' }}>Brochure Attachments:</span>
                <span style={{ fontWeight: 600, color: 'var(--neutral-800)', fontSize: '0.88rem' }}>
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neutral-600)', fontSize: '0.88rem' }}>Sender Account:</span>
                <span style={{ fontWeight: 600, color: 'var(--neutral-800)', fontSize: '0.88rem' }}>
                  Techmiya EdTech (techmiyaedtech@gmail.com)
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
              <ShieldCheck size={16} color="var(--primary-700)" />
              <span>Recipients are sent blind individual copies. No recipient can see another's email.</span>
            </div>
          </div>
        )}

        {/* Phase 2: Active Sending */}
        {phase === 'sending' && (
          <div className="modal-body">
            <div className="progress-container">
              <div className="progress-header">
                <span>Sending Progress ({progress}%)</span>
                <span>{sentCount + failedCount} of {validRecipients.length} processed</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="stats-grid" style={{ marginTop: '20px' }}>
              <div className="stat-card valid">
                <div className="stat-label">Successfully Sent</div>
                <div className="stat-value">{sentCount}</div>
              </div>
              <div className="stat-card invalid">
                <div className="stat-label">Failed</div>
                <div className="stat-value">{failedCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Remaining</div>
                <div className="stat-value">{validRecipients.length - (sentCount + failedCount)}</div>
              </div>
            </div>

            {currentRecipient && (
              <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--neutral-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong>Currently Processing Batch:</strong> {currentRecipient}
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setAbortRequested(true)}
                disabled={abortRequested}
              >
                {abortRequested ? 'Stopping after current batch...' : 'Stop Campaign'}
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Completed */}
        {phase === 'completed' && (
          <div className="modal-body">
            <div className={`alert-banner ${failedCount === 0 ? 'success' : 'warning'}`}>
              {failedCount === 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <div>
                <strong>
                  {failedCount === 0 
                    ? `Campaign completed successfully! All ${sentCount} emails sent.` 
                    : `Campaign finished with ${sentCount} sent and ${failedCount} failed.`}
                </strong>
                <p style={{ marginTop: '2px', fontSize: '0.82rem' }}>
                  All delivery operations have been processed via GmailApp.
                </p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card valid">
                <div className="stat-label">Delivered</div>
                <div className="stat-value">{sentCount}</div>
              </div>
              <div className="stat-card invalid">
                <div className="stat-label">Failed</div>
                <div className="stat-value">{failedCount}</div>
              </div>
            </div>

            {/* Results Table */}
            <div className="table-container" style={{ marginTop: '20px' }}>
              <div className="table-header-controls">
                <strong style={{ fontSize: '0.88rem' }}>Delivery Audit Log</strong>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadReport}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  Download Excel Report
                </button>
              </div>
              <div className="recipient-table-scroll" style={{ maxHeight: '200px' }}>
                <table className="recipient-table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsLog.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{item.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${item.status === 'sent' ? 'badge-valid' : 'badge-invalid'}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: item.error ? 'var(--error-text)' : 'var(--neutral-500)' }}>
                          {item.error || 'Delivered successfully'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="modal-footer">
          {phase === 'confirm' && (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartSending}
                disabled={validRecipients.length === 0}
              >
                Confirm & Send Bulk Email ({validRecipients.length})
              </button>
            </>
          )}

          {phase === 'completed' && (
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done & Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
