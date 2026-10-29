# Techmiya EdTech - Bulk Email Sender

A simple, fast, and professional Bulk Email Sender web application built for **Techmiya EdTech**. 

- **Frontend:** React.js + Vite (Vanilla CSS design system)
- **Hosting:** GitHub Pages
- **Custom Domain:** `email.techmiyaedtech.com`
- **Authorized Sender:** `techmiyaedtech@gmail.com`
- **Backend:** Google Apps Script (GAS) using native `GmailApp` (No separate server required)
- **Audit Logs:** Automated Google Sheets campaign recording

---

## 1. Initial Admin Credentials

| Field | Initial Value |
|---|---|
| **Admin Username** | `admin@techmiyaedtech` |
| **Admin Password** | `Techmiya@786` |

> Credentials are authenticated securely through Google Apps Script Script Properties. For maximum security, the password cannot be changed from the frontend web portal; it can only be updated directly in the Google Apps Script backend (by running `setAdminPassword("YourNewPassword")` in the Apps Script editor, or editing `ADMIN_PASSWORD` in Project Settings > Script Properties).

---

## 2. Main Features

The admin portal features a single, clean, distraction-free sending dashboard:

1. **Upload Email List**
   - **Download Sample Excel** button (creates sample `.xlsx` file).
   - Drag-and-drop or upload `.xlsx`, `.xls`, or `.csv` files.
   - Auto-detects columns: `Email` and `Name`.
   - Real-time stat cards: **Total**, **Valid**, **Invalid**, and **Duplicates**.
   - Searchable, filterable preview table with one-click row deletion.

2. **Email Subject**
   - Single clean input field.
   - One-click placeholder insertion (`{{Name}}`).

3. **Email Message**
   - Large formatting text editor.
   - Toolbar for Paragraphs (`<p>`), Bold (`<b>`), Italic (`<i>`), Bullet Lists (`<ul><li>`), Links (`<a>`), and Line Breaks (`<br>`).
   - One-click insertion of `{{Name}}` placeholder.

4. **Attach Brochures**
   - Upload course brochures and documentation (`.pdf`, `.docx`, `.png`, etc.).
   - Live file size calculation and badge list.
   - Automatic 25 MB Gmail quota size validation.

5. **Social Media Links**
   - Optional fields for: Instagram, LinkedIn, and YouTube.
   - Included neatly in the branded email footer only if provided.

6. **Send Email**
   - **Preview Email:** Full simulated inbox preview showing exact personalization and attachments.
   - **Send Test Email:** Sends a single live test email to `techmiyaedtech@gmail.com` or custom address to verify deliverability.
   - **Send Bulk Email:** Requires explicit confirmation with recipient count, executes controlled batching, displays real-time progress bar, sent/failed metrics, and provides an exportable Excel audit report.

---

## 3. Google Apps Script Setup & Authorization

To connect your Gmail account (`techmiyaedtech@gmail.com`) to the sender:

### Step 1: Create the Google Apps Script Project
1. Log in to Google Drive with `techmiyaedtech@gmail.com`.
2. Go to [https://script.google.com/](https://script.google.com/) and click **New project**.
3. Rename the project to `Techmiya Bulk Email Sender API`.
4. Replace all code in `Code.gs` with the contents of `google-apps-script/Code.gs` from this repository.
5. (Optional) In project settings, enable "Show 'appsscript.json' manifest file in editor" and paste `google-apps-script/appsscript.json`.

### Step 2: Deploy as a Web App
1. Click the blue **Deploy** button > **New deployment**.
2. Select type: **Web app** (gear icon).
3. Set configuration:
   - **Description:** `Production v1`
   - **Execute as:** `Me (techmiyaedtech@gmail.com)` *(Crucial: emails will be sent from this account)*
   - **Who has access:** `Anyone` *(Allows the GitHub Pages frontend to communicate with the script)*
4. Click **Deploy**.
5. Google will ask you to **Authorize Access**:
   - Click *Review permissions*.
   - Choose `techmiyaedtech@gmail.com`.
   - Click *Advanced* > *Go to Techmiya Bulk Email Sender API (unsafe)*.
   - Click *Allow*.
6. Copy the generated **Web app URL** (ends with `/exec`).

### Step 3: Connect Frontend to the Web App URL
- **Locally:** Add the URL to `.env`:
  ```env
  VITE_GAS_URL=https://script.google.com/macros/s/YOUR_APPS_SCRIPT_DEPLOYMENT_ID/exec
  ```
- **In Browser:** Click the **Settings** button in the top navigation or login screen and paste your URL into the configuration modal.

---

## 4. GitHub Pages & Custom Domain Setup

### DNS Configuration for `email.techmiyaedtech.com`
In your domain registrar (GoDaddy, Namecheap, Cloudflare, AWS Route 53, etc.) for `techmiyaedtech.com`:

| Type | Name / Host | Target / Value | TTL |
|---|---|---|---|
| **CNAME** | `email` | `<your-github-username>.github.io` | Automatic / 300 |

### GitHub Repository Settings
1. Go to your GitHub repository > **Settings** > **Pages**.
2. Under **Build and deployment**:
   - Source: **GitHub Actions** (The `.github/workflows/deploy.yml` workflow automatically handles deployment upon every commit).
3. Under **Custom domain**:
   - Enter `email.techmiyaedtech.com`.
   - Click **Save**.
   - Check **Enforce HTTPS** (Once DNS propagates and the Let's Encrypt certificate is issued).

### GitHub Actions Secrets
In your GitHub repo:
1. Go to **Settings** > **Secrets and variables** > **Actions**.
2. Add a new secret:
   - **Name:** `VITE_GAS_URL`
   - **Value:** `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

---

## 5. Local Development & Testing

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run production build
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Security Architecture

- **No Exposed Secrets:** No Gmail App Passwords, API tokens, or admin passwords are built into frontend JavaScript bundles.
- **Gmail Authorization:** Google handles OAuth permissions natively through `techmiyaedtech@gmail.com` using the Apps Script runtime.
- **Controlled Batches:** Batch execution prevents timeouts and stays within Google Workspace / Gmail sending quotas (up to 500 or 2,000 emails/day depending on Google Workspace tier).
- **Recipient Privacy:** Emails are dispatched individually (`GmailApp.sendEmail`). Recipients never see each other's addresses.
- **Audit Logging:** Automatically creates a Google Sheet named *Techmiya EdTech - Bulk Email Campaign Logs* in Google Drive for delivery auditing.
