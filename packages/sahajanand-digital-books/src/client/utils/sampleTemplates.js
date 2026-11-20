import sampleData from './sampleTemplateData.json';
import { SAMPLE_EXCEL_B64 } from './sampleExcelBase64';

/**
 * Convert 2D array of rows to standard RFC-4180 CSV string
 */
export const arrayToCsv = (rows = []) => {
  return rows
    .map((row) =>
      row
        .map((val) => {
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');
};

/**
 * Trigger browser file download from Blob
 */
export const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Download a sample CSV file for a specific sheet
 */
export const downloadSampleCsv = (sheetName) => {
  const rows = sampleData[sheetName];
  if (!rows || rows.length === 0) {
    alert(`No sample template available for sheet: ${sheetName}`);
    return;
  }
  const csvContent = arrayToCsv(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${sheetName}_Sample_Template.csv`);
};

/**
 * Download all sample CSVs sequentially
 */
export const downloadAllSampleCsvs = () => {
  Object.keys(sampleData).forEach((sheetName, idx) => {
    setTimeout(() => {
      downloadSampleCsv(sheetName);
    }, idx * 150);
  });
};

/**
 * Download complete pre-formatted sample Excel workbook (.xlsx)
 */
export const downloadSampleExcel = () => {
  try {
    const binaryString = atob(SAMPLE_EXCEL_B64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, 'Gurukul_Books_Sample_Migration_Template.xlsx');
  } catch (e) {
    console.error('Error generating Excel download:', e);
    downloadSampleJson();
  }
};

/**
 * Download complete multi-table sample migration JSON
 */
export const downloadSampleJson = () => {
  const jsonStr = JSON.stringify(sampleData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, 'Gurukul_Books_Sample_Migration.json');
};

/**
 * Sheet metadata for displaying in UI
 */
export const SAMPLE_SHEETS_META = [
  { name: 'Invoices', desc: 'Invoices & Fee Receipts (SINV-XXXX, Date, Student/Customer, Total)', key: true },
  { name: 'InvoiceItems', desc: 'Programs, Courses, Line items, HSN/SAC, Fees', key: true },
  { name: 'Payments', desc: 'Payment Vouchers, Payment Modes, Multi-account Allocations', key: true },
  { name: 'Expenses', desc: 'Operating & Admin Expenses, Salaries, Software, Rent', key: true },
  { name: 'Customers', desc: 'Students, Donors, Clients directory, Contact info & GSTIN', key: true },
  { name: 'Items', desc: 'Courses, Programs, Services, Rates, and Units catalog', key: true },
  { name: 'ChartOfAccounts', desc: 'Complete Double-entry Chart of Accounts tree', key: false },
  { name: 'JournalEntries', desc: 'Journal Vouchers metadata (JV-XXXX, Date, Narration)', key: false },
  { name: 'JournalLedgers', desc: 'General Ledger splits (Debits & Credits parity)', key: false },
  { name: 'CompanySettings', desc: 'Organization name, Primary Bank, and Currency', key: false },
  { name: 'NumberSeries', desc: 'Prefix and auto-incrementing serial numbers', key: false },
];
