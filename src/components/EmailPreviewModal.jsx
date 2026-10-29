import React, { useState } from 'react';
import { X, Mail, Paperclip, ChevronLeft, ChevronRight, User, ExternalLink } from 'lucide-react';
import { personalizeText, formatFileSize } from '../utils/emailTemplate';

export const EmailPreviewModal = ({
  isOpen,
  onClose,
  subject,
  htmlBody,
  recipients,
  attachments,
  socialLinks
}) => {
  const [recipientIndex, setRecipientIndex] = useState(0);

  if (!isOpen) return null;

  const validRecipients = recipients.filter(r => r.status === 'valid');
  const currentRecipient = validRecipients.length > 0 
    ? validRecipients[recipientIndex % validRecipients.length] 
    : { name: 'Aarav Sharma', email: 'aarav.sample@example.com' };

  const personalizedSubject = personalizeText(subject || '(No Subject)', currentRecipient);
  const personalizedBody = personalizeText(htmlBody || '<p><em>No message content provided.</em></p>', currentRecipient);

  const hasNext = validRecipients.length > 1;

  const nextRecipient = () => {
    setRecipientIndex((prev) => (prev + 1) % validRecipients.length);
  };

  const prevRecipient = () => {
    setRecipientIndex((prev) => (prev - 1 + validRecipients.length) % validRecipients.length);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="var(--primary-700)" />
            <h3>Email Inbox Preview</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {validRecipients.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={prevRecipient}
                  title="Previous recipient"
                  style={{ padding: '4px 8px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                  Recipient {recipientIndex + 1} of {validRecipients.length}
                </span>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={nextRecipient}
                  title="Next recipient"
                  style={{ padding: '4px 8px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ backgroundColor: 'var(--neutral-100)', padding: '20px' }}>
          {/* Simulated Email Client Envelope */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            
            {/* Subject and Header Metadata */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--neutral-200)', background: 'var(--neutral-50)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--neutral-900)', margin: '0 0 10px 0' }}>
                {personalizedSubject}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.84rem', color: 'var(--neutral-600)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <strong style={{ width: '45px', color: 'var(--neutral-700)' }}>From:</strong>
                  <span>Techmiya EdTech &lt;techmiyaedtech@gmail.com&gt;</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <strong style={{ width: '45px', color: 'var(--neutral-700)' }}>To:</strong>
                  <span style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>
                    {currentRecipient.name} &lt;{currentRecipient.email}&gt;
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body Template */}
            <div style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '8px', overflow: 'hidden' }}>
                
                {/* Techmiya Branded Top Banner */}
                <div style={{ backgroundColor: '#1E40AF', padding: '16px 20px' }}>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '18px', fontWeight: 700 }}>Techmiya EdTech</h3>
                  <p style={{ color: '#BFDBFE', margin: '4px 0 0 0', fontSize: '12px' }}>Empowering Careers Through Quality Education</p>
                </div>

                {/* Formatted HTML Message */}
                <div
                  style={{ padding: '24px 20px', fontSize: '15px', lineHeight: '1.65', color: '#334155' }}
                  dangerouslySetInnerHTML={{ __html: personalizedBody }}
                />

                {/* Attachments Section in Email */}
                {attachments && attachments.length > 0 && (
                  <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Paperclip size={14} />
                      Attached Brochure Documents ({attachments.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: '#1E293B'
                          }}
                        >
                          <Paperclip size={12} color="#1E40AF" />
                          <span style={{ fontWeight: 500 }}>{file.name}</span>
                          <span style={{ color: '#64748B' }}>({formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Media Footer */}
                {(socialLinks?.instagram || socialLinks?.linkedin || socialLinks?.youtube) && (
                  <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px 0', fontWeight: 500 }}>
                      Connect with Techmiya EdTech:
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
                      {socialLinks?.instagram && (
                        <a href={socialLinks.instagram} target="_blank" rel="noreferrer" style={{ color: '#E1306C', textDecoration: 'none' }}>
                          Instagram
                        </a>
                      )}
                      {socialLinks?.linkedin && (
                        <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" style={{ color: '#0A66C2', textDecoration: 'none' }}>
                          LinkedIn
                        </a>
                      )}
                      {socialLinks?.youtube && (
                        <a href={socialLinks.youtube} target="_blank" rel="noreferrer" style={{ color: '#FF0000', textDecoration: 'none' }}>
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* System Email Footer */}
                <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
                  <p style={{ margin: 0 }}>Techmiya EdTech &bull; techmiyaedtech@gmail.com</p>
                  <p style={{ margin: '3px 0 0 0' }}>This email was sent to {currentRecipient.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
