import * as XLSX from 'xlsx';

/**
 * Standard RFC-compliant email regex
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim());
};

/**
 * Generate and download a sample Excel file for the administrator
 */
export const downloadSampleExcel = () => {
  const sampleData = [
    {
      Email: 'learner1@example.com',
      Name: 'Aarav Sharma'
    },
    {
      Email: 'learner2@example.com',
      Name: 'Priya Patel'
    },
    {
      Email: 'student.tech@example.com',
      Name: 'Rahul Verma'
    },
    {
      Email: 'techmiyaedtech@gmail.com',
      Name: 'Techmiya Admin'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 30 }, // Email column
    { wch: 22 }  // Name column
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recipients');

  XLSX.writeFile(workbook, 'Techmiya_Sample_Recipients.xlsx');
};

/**
 * Parse an uploaded .xlsx, .xls, or .csv file into structured recipient records
 */
export const parseRecipientsFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('The uploaded file does not contain any sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('The uploaded file is empty.');
        }

        // Identify email and name columns dynamically
        const firstRow = rawJson[0];
        const keys = Object.keys(firstRow);

        let emailKey = keys.find(k => /email|e-mail|mail/i.test(k.trim()));
        let nameKey = keys.find(k => /name|full\s*name|student\s*name|candidate/i.test(k.trim()));

        // Fallbacks if not explicitly found
        if (!emailKey) {
          emailKey = keys[0]; // Assume first column is email
        }

        const seenEmails = new Set();
        const records = [];

        let validCount = 0;
        let invalidCount = 0;
        let duplicateCount = 0;

        rawJson.forEach((row, idx) => {
          const rawEmail = String(row[emailKey] || '').trim();
          const rawName = nameKey ? String(row[nameKey] || '').trim() : '';

          if (!rawEmail && !rawName) {
            return; // Skip completely blank rows
          }

          const normalizedEmail = rawEmail.toLowerCase();
          let status = 'valid';
          let reason = '';

          if (!isValidEmail(normalizedEmail)) {
            status = 'invalid';
            reason = 'Invalid email syntax';
            invalidCount++;
          } else if (seenEmails.has(normalizedEmail)) {
            status = 'duplicate';
            reason = 'Duplicate in list';
            duplicateCount++;
          } else {
            status = 'valid';
            validCount++;
            seenEmails.add(normalizedEmail);
          }

          records.push({
            id: `row-${idx + 1}`,
            email: rawEmail,
            normalizedEmail: normalizedEmail,
            name: rawName || 'Learner',
            status: status,
            reason: reason,
            rawRow: row
          });
        });

        resolve({
          total: records.length,
          valid: validCount,
          invalid: invalidCount,
          duplicates: duplicateCount,
          records: records,
          detectedColumns: { emailKey, nameKey }
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
