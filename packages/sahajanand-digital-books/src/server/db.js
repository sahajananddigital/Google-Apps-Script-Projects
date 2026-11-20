export const SHEETS = {
  INVOICES: 'Invoices',
  INVOICE_ITEMS: 'InvoiceItems',
  PAYMENTS: 'Payments',
  EXPENSES: 'Expenses',
  JOURNAL_ENTRIES: 'JournalEntries',
  JOURNAL_LEDGERS: 'JournalLedgers',
  ACCOUNTS: 'ChartOfAccounts',
  CUSTOMERS: 'Customers',
  ITEMS: 'Items',
  SETTINGS: 'CompanySettings',
  NUMBER_SERIES: 'NumberSeries',
};

export const SHEET_SCHEMAS = {
  [SHEETS.INVOICES]: ['InvoiceNo', 'Date', 'CustomerName', 'Account', 'NetTotal', 'DiscountAmount', 'GrandTotal', 'OutstandingAmount', 'Status', 'Terms', 'CreatedAt'],
  [SHEETS.INVOICE_ITEMS]: ['ID', 'InvoiceNo', 'ItemName', 'Description', 'HSN_SAC', 'Quantity', 'Rate', 'Amount'],
  [SHEETS.PAYMENTS]: ['PaymentNo', 'Date', 'CustomerName', 'InvoiceNo', 'Amount', 'PaymentMethod', 'Account', 'ReferenceTxnId', 'CreatedAt'],
  [SHEETS.EXPENSES]: ['ExpenseNo', 'Date', 'Category', 'PaidVia', 'Amount', 'Description', 'ReferenceTxnId', 'CreatedAt'],
  [SHEETS.JOURNAL_ENTRIES]: ['EntryNo', 'Date', 'EntryType', 'ReferenceNo', 'ReferenceDate', 'Narration', 'CreatedAt'],
  [SHEETS.JOURNAL_LEDGERS]: ['ID', 'EntryNo', 'AccountName', 'Debit', 'Credit'],
  [SHEETS.ACCOUNTS]: ['AccountName', 'RootType', 'ParentAccount', 'AccountType', 'IsGroup'],
  [SHEETS.CUSTOMERS]: ['CustomerName', 'Email', 'Phone', 'AddressLine1', 'AddressLine2', 'City', 'State', 'Pincode', 'GSTIN', 'GSTType', 'Currency', 'OutstandingAmount'],
  [SHEETS.ITEMS]: ['ItemName', 'ItemCode', 'ItemGroup', 'ItemType', 'Unit', 'Rate', 'Description', 'IncomeAccount', 'ExpenseAccount', 'HSN_SAC'],
  [SHEETS.SETTINGS]: ['Key', 'Value'],
  [SHEETS.NUMBER_SERIES]: ['SeriesName', 'Prefix', 'CurrentCount', 'PadZeros'],
};

/**
 * Set target spreadsheet ID in Script Properties
 */
export const setDatabaseSpreadsheetId = (id) => {
  if (!id) return { success: false, message: 'Spreadsheet ID cannot be empty' };
  try {
    const cleanId = String(id).trim().replace(/^https:\/\/docs\.google\.com\/spreadsheets\/d\//, '').replace(/\/.*$/, '');
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', cleanId);
    return { success: true, message: `Successfully connected to Spreadsheet ID: ${cleanId}` };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
};

/**
 * Get active spreadsheet handle safely from Script Properties or container-bound document
 */
export const getSpreadsheet = () => {
  // 1. Script Properties override if configured
  try {
    const propId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (propId) return SpreadsheetApp.openById(propId);
  } catch (e) {}

  // 2. Active spreadsheet (if container-bound)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      try {
        PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', active.getId());
      } catch (err) {}
      return active;
    }
  } catch (e) {}

  return null;
};

/**
 * Ensure headers exist, are bolded, styled, and frozen on a sheet
 */
export const ensureSheetHeaders = (sheet, name) => {
  if (!sheet) return;
  const headers = SHEET_SCHEMAS[name];
  if (!headers) return;

  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f1f5f9');
    sheet.setFrozenRows(1);
  } else {
    // If row 1 is blank or empty, populate headers
    const lastCol = Math.max(1, sheet.getLastColumn());
    const firstRowValues = sheet.getRange(1, 1, 1, Math.min(headers.length, lastCol)).getValues()[0];
    const isBlank = firstRowValues.every((val) => val === '' || val === null || val === undefined);
    if (isBlank) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f1f5f9');
      sheet.setFrozenRows(1);
    }
  }
};

/**
 * Get sheet by name, or initialize and ensure headers if not found or blank
 */
export const getSheet = (name) => {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  ensureSheetHeaders(sheet, name);
  return sheet;
};

/**
 * Initialize all database sheets with headers and default configurations
 */
export const initDatabase = () => {
  const ss = getSpreadsheet();

  Object.entries(SHEET_SCHEMAS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    ensureSheetHeaders(sheet, name);
  });

  // Default Company Settings
  const setSheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (setSheet.getLastRow() <= 1) {
    const defaultSettings = [
      ['companyName', 'My Organization'],
      ['fullname', ''],
      ['address', ''],
      ['phone', ''],
      ['email', ''],
      ['website', ''],
      ['pan', ''],
      ['udyam', ''],
      ['gstin', ''],
      ['primaryBankName', 'Primary Bank'],
      ['primaryBankBranch', ''],
      ['primaryAccountType', 'Current'],
      ['primaryAccountNo', ''],
      ['primaryIfsc', ''],
      ['primaryUpiId', ''],
      ['upiPayeeName', ''],
      ['secondaryBankName', 'Secondary Bank'],
      ['secondaryBankBranch', ''],
      ['secondaryAccountType', 'Savings'],
      ['secondaryAccountNo', ''],
      ['secondaryIfsc', ''],
      ['secondaryUpiId', ''],
      ['defaultPrintTemplate', 'IndianStyleTally'],
      ['brandColor', '#1e3a8a'],
      ['currency', 'INR'],
      ['organizationType', 'business'], // 'business' | 'institute'
    ];
    setSheet.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
  }

  // Default Number Series
  const seriesSheet = ss.getSheetByName(SHEETS.NUMBER_SERIES);
  if (seriesSheet.getLastRow() <= 1) {
    const seriesData = [
      ['SalesInvoice', 'SINV-', 1062, 4],
      ['Payment', 'PAY-', 1046, 4],
      ['Expense', 'EXP-', 1050, 4],
      ['JournalEntry', 'JV-', 1097, 4],
      ['Receipt', 'RCPT-', 1001, 4],
      ['Quote', 'SQUOT-', 1005, 4],
    ];
    seriesSheet.getRange(2, 1, seriesData.length, 4).setValues(seriesData);
  }

  return { success: true, message: 'Database sheets and headers verified and initialized successfully' };
};

/**
 * Scan all sheets and enforce that missing headers are restored
 */
export const ensureAllHeaders = () => {
  return initDatabase();
};

/**
 * Generic helper to read rows as an array of JavaScript objects
 */
export const getRowsAsObjects = (sheetName) => {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
};

/**
 * Increment and get the next sequential number series code
 */
export const getNextSeriesNumber = (seriesName) => {
  const sheet = getSheet(SHEETS.NUMBER_SERIES);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return `${seriesName}-${Date.now().toString().slice(-4)}`;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === seriesName) {
      const prefix = data[i][1];
      const count = parseInt(data[i][2], 10);
      const nextCode = `${prefix}${count}`;
      sheet.getRange(i + 1, 3).setValue(count + 1);
      return nextCode;
    }
  }

  return `${seriesName}-${Date.now().toString().slice(-4)}`;
};
