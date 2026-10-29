/**
 * Personalize text by replacing placeholders like {{Name}} and {{Email}}
 */
export const personalizeText = (template, recipient = {}) => {
  if (!template) return '';
  const name = recipient.name || 'Valued Learner';
  const email = recipient.email || '';
  return template
    .replace(/\{\{\s*Name\s*\}\}/gi, name)
    .replace(/\{\{\s*Email\s*\}\}/gi, email);
};

/**
 * Format bytes into human readable format (KB / MB)
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert HTML or line-broken text to rich HTML email layout
 */
export const buildFullEmailHtml = (bodyHtml, recipient = {}, socialLinks = {}) => {
  const personalizedBody = personalizeText(bodyHtml || '', recipient);

  // Social Links Section (only include links provided by admin)
  const socialIcons = [];
  if (socialLinks.instagram && socialLinks.instagram.trim()) {
    socialIcons.push(
      `<a href="${encodeURI(socialLinks.instagram.trim())}" style="display:inline-block; margin:0 8px; color:#E1306C; text-decoration:none; font-weight:600; font-size:13px;">Instagram</a>`
    );
  }
  if (socialLinks.linkedin && socialLinks.linkedin.trim()) {
    socialIcons.push(
      `<a href="${encodeURI(socialLinks.linkedin.trim())}" style="display:inline-block; margin:0 8px; color:#0A66C2; text-decoration:none; font-weight:600; font-size:13px;">LinkedIn</a>`
    );
  }
  if (socialLinks.youtube && socialLinks.youtube.trim()) {
    socialIcons.push(
      `<a href="${encodeURI(socialLinks.youtube.trim())}" style="display:inline-block; margin:0 8px; color:#FF0000; text-decoration:none; font-weight:600; font-size:13px;">YouTube</a>`
    );
  }

  let socialFooterSection = '';
  if (socialIcons.length > 0) {
    socialFooterSection = `
      <div style="margin-top:28px; padding-top:16px; border-top:1px solid #E2E8F0; text-align:center;">
        <p style="font-size:12px; color:#64748B; margin-bottom:8px; font-weight:500;">Connect with Techmiya EdTech:</p>
        <div>${socialIcons.join(' &bull; ')}</div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Techmiya EdTech</title>
    </head>
    <body style="margin:0; padding:20px 10px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#F8FAFC; color:#1E293B;">
      <div style="max-width:600px; margin:0 auto; background-color:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color:#1E40AF; padding:20px 24px; text-align:left;">
          <h2 style="margin:0; color:#FFFFFF; font-size:20px; font-weight:700; letter-spacing:-0.3px;">Techmiya EdTech</h2>
          <p style="margin:4px 0 0; color:#BFDBFE; font-size:12px;">Empowering Careers Through Quality Education</p>
        </div>

        <!-- Body Content -->
        <div style="padding:28px 24px; font-size:15px; line-height:1.7; color:#334155;">
          ${personalizedBody}
        </div>

        <!-- Social Media Footer -->
        ${socialFooterSection}

        <!-- Institutional Footer -->
        <div style="background-color:#F8FAFC; padding:16px 24px; font-size:11px; color:#94A3B8; text-align:center; border-top:1px solid #F1F5F9;">
          <p style="margin:0; font-weight:500;">Techmiya EdTech &bull; techmiyaedtech@gmail.com</p>
          <p style="margin:4px 0 0;">This email was sent to ${recipient.email || 'your address'}</p>
        </div>
      </div>
    </body>
    </html>
  `.trim();
};
