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

export const DEFAULT_CHART_OF_ACCOUNTS = [
  ['Application of Funds (Assets)', 'Asset', '', '', true],
  ['Current Assets', 'Asset', 'Application of Funds (Assets)', '', true],
  ['Bank Accounts', 'Asset', 'Current Assets', 'Bank', true],
  ['Primary Bank', 'Asset', 'Bank Accounts', 'Bank', false],
  ['Secondary Bank', 'Asset', 'Bank Accounts', 'Bank', false],
  ['Cash In Hand', 'Asset', 'Current Assets', 'Cash', true],
  ['Cash', 'Asset', 'Cash In Hand', 'Cash', false],
  ['Accounts Receivable', 'Asset', 'Current Assets', 'Receivable', true],
  ['Debtors', 'Asset', 'Accounts Receivable', 'Receivable', false],
  ['Source of Funds (Liabilities)', 'Liability', '', '', true],
  ['Current Liabilities', 'Liability', 'Source of Funds (Liabilities)', '', true],
  ['Accounts Payable', 'Liability', 'Current Liabilities', 'Payable', true],
  ['Creditors', 'Liability', 'Accounts Payable', 'Payable', false],
  ['Equity', 'Equity', '', '', true],
  ['Income', 'Income', '', '', true],
  ['Direct Income', 'Income', 'Income', '', true],
  ['Service', 'Income', 'Direct Income', 'Service', false],
  ['Expenses', 'Expense', '', '', true],
  ['Direct Expenses', 'Expense', 'Expenses', '', true],
  ['Operating Expenses', 'Expense', 'Direct Expenses', 'Expense', false],
  ['Software & Hosting', 'Expense', 'Direct Expenses', 'Expense', false],
];

/**
 * Create a brand new Google Spreadsheet database in the user's Google Drive
 * and initialize all tables, schemas, default settings, and chart of accounts.
 *
 * @param {string} [name='Gurukul Books - Financial ERP Database']
 * @returns {SpreadsheetApp.Spreadsheet}
 */
export const createDatabaseSpreadsheet = (name = 'Gurukul Books - Financial ERP Database') => {
  const newSs = SpreadsheetApp.create(name);
  const initialSheets = newSs.getSheets();

  // Initialize all tables, schemas, and default records
  initDatabase(newSs);

  // Remove default 'Sheet1' if newly created sheets exist
  try {
    if (initialSheets && initialSheets.length > 0) {
      const defaultSheet = initialSheets[0];
      if (newSs.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
        newSs.deleteSheet(defaultSheet);
      }
    }
  } catch (cleanErr) {
    // Non-critical cleanup
  }

  // Save to UserProperties (private to each user)
  try {
    PropertiesService.getUserProperties().setProperty('SPREADSHEET_ID', newSs.getId());
  } catch (propErr) {}

  // Remember in saved organizations list
  try {
    rememberDatabase(newSs.getId(), newSs.getName(), newSs.getUrl());
  } catch (remErr) {}

  return newSs;
};

/**
 * Get active spreadsheet handle safely.
 *
 * Priority Resolution:
 * 1. User Properties (Isolated to the logged-in user)
 * 2. Active container spreadsheet (if opened inside Google Sheets Add-on)
 * 3. Script Properties (Shared fallback if user has explicit access)
 * 4. Auto-creates a new spreadsheet in user's Drive if none exists or accessible!
 */
export const getSpreadsheet = (autoCreate = true) => {
  // 1. User Properties (Isolated per user)
  try {
    const userPropId = PropertiesService.getUserProperties().getProperty('SPREADSHEET_ID');
    if (userPropId) {
      const ss = SpreadsheetApp.openById(userPropId);
      if (ss) {
        try { rememberDatabase(ss.getId(), ss.getName(), ss.getUrl()); } catch (remErr) {}
        return ss;
      }
    }
  } catch (e) {
    // Permission denied or deleted file -> clear stale ID
    try {
      PropertiesService.getUserProperties().deleteProperty('SPREADSHEET_ID');
    } catch (delErr) {}
  }

  // 2. Active spreadsheet (if container-bound / Sheets Add-on)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      try {
        PropertiesService.getUserProperties().setProperty('SPREADSHEET_ID', active.getId());
        rememberDatabase(active.getId(), active.getName(), active.getUrl());
      } catch (err) {}
      return active;
    }
  } catch (e) {}

  // 3. Script Properties override (if current user has access to shared spreadsheet)
  try {
    const scriptPropId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (scriptPropId) {
      const ss = SpreadsheetApp.openById(scriptPropId);
      if (ss) {
        try {
          PropertiesService.getUserProperties().setProperty('SPREADSHEET_ID', scriptPropId);
          rememberDatabase(ss.getId(), ss.getName(), ss.getUrl());
        } catch (saveErr) {}
        return ss;
      }
    }
  } catch (e) {
    // User does not have access to developer's private spreadsheet -> ignore and proceed
  }

  // 4. Auto-create personal spreadsheet in user's Drive if autoCreate is enabled
  if (autoCreate) {
    try {
      return createDatabaseSpreadsheet('Gurukul Books - Financial ERP Database');
    } catch (createErr) {
      console.error('Failed to auto-create spreadsheet in user Drive:', createErr);
    }
  }

  return null;
};

export const SAVED_DATABASES_KEY = 'SAVED_DATABASES';

/**
 * Get the list of saved spreadsheets from UserProperties
 * @returns {Array<{id: string, name: string, url: string, lastUsed: string}>}
 */
export const getSavedDatabases = () => {
  try {
    const raw = PropertiesService.getUserProperties().getProperty(SAVED_DATABASES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
};

/**
 * Remember a database in the user's saved list (up to 20 most recent)
 */
export const rememberDatabase = (id, name, url) => {
  if (!id) return;
  try {
    const list = getSavedDatabases();
    const cleanId = String(id).trim();
    const filtered = list.filter((item) => item && item.id !== cleanId);
    filtered.unshift({
      id: cleanId,
      name: name || 'Google Sheet Database',
      url: url || `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
      lastUsed: new Date().toISOString(),
    });
    const trimmed = filtered.slice(0, 20);
    PropertiesService.getUserProperties().setProperty(SAVED_DATABASES_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving database list:', e);
  }
};

/**
 * Remove a database from the saved list
 */
export const removeSavedDatabase = (id) => {
  if (!id) return { success: false, message: 'Spreadsheet ID required' };
  try {
    const cleanId = String(id).trim();
    const list = getSavedDatabases();
    const filtered = list.filter((item) => item && item.id !== cleanId);
    PropertiesService.getUserProperties().setProperty(SAVED_DATABASES_KEY, JSON.stringify(filtered));
    return { success: true, savedDatabases: filtered };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
};

/**
 * Switch active database to one of the saved sheets by ID
 */
export const switchDatabase = (id) => {
  if (!id) return { success: false, message: 'Spreadsheet ID required' };
  try {
    const cleanId = String(id).trim().replace(/^https:\/\/docs\.google\.com\/spreadsheets\/d\//, '').replace(/\/.*$/, '');
    const ss = SpreadsheetApp.openById(cleanId);
    if (!ss) {
      return { success: false, message: `Could not open spreadsheet with ID: ${cleanId}` };
    }

    // Ensure all 11 required tables and headers exist
    initDatabase(ss);

    // Save as active in UserProperties
    PropertiesService.getUserProperties().setProperty('SPREADSHEET_ID', cleanId);

    // Update in saved list
    rememberDatabase(cleanId, ss.getName(), ss.getUrl());

    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      savedDatabases: getSavedDatabases(),
      message: `Switched active database to: ${ss.getName()}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to switch database: ${err.message || String(err)}`,
    };
  }
};

/**
 * Get current connected database spreadsheet info and saved sheets list
 */
export const getDatabaseInfo = () => {
  try {
    const ss = getSpreadsheet(true);
    const savedDatabases = getSavedDatabases();
    if (!ss) {
      return {
        configured: false,
        spreadsheetId: null,
        spreadsheetName: null,
        spreadsheetUrl: null,
        savedDatabases: savedDatabases,
        message: 'No spreadsheet connected',
      };
    }
    return {
      configured: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      savedDatabases: savedDatabases,
      message: 'Connected successfully',
    };
  } catch (e) {
    return {
      configured: false,
      spreadsheetId: null,
      spreadsheetName: null,
      spreadsheetUrl: null,
      savedDatabases: getSavedDatabases(),
      message: e.toString(),
    };
  }
};

/**
 * Connect an existing Google Sheet by URL or ID (must be owned or shared with user)
 */
export const connectExistingSpreadsheet = (sheetIdOrUrl) => {
  if (!sheetIdOrUrl) return { success: false, message: 'Please enter a valid Google Sheet URL or ID' };
  try {
    const cleanId = String(sheetIdOrUrl).trim().replace(/^https:\/\/docs\.google\.com\/spreadsheets\/d\//, '').replace(/\/.*$/, '');
    const ss = SpreadsheetApp.openById(cleanId);
    if (!ss) {
      return { success: false, message: `Could not open spreadsheet with ID: ${cleanId}` };
    }

    // Ensure all 11 required tables and headers exist
    initDatabase(ss);

    // Save to UserProperties
    PropertiesService.getUserProperties().setProperty('SPREADSHEET_ID', cleanId);

    // Remember in saved organizations list
    try {
      rememberDatabase(ss.getId(), ss.getName(), ss.getUrl());
    } catch (remErr) {}

    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      savedDatabases: getSavedDatabases(),
      message: `Successfully connected to spreadsheet: ${ss.getName()}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Permission error: Make sure you have edit access to this spreadsheet. (${err.message || String(err)})`,
    };
  }
};

/**
 * Create a new personal database spreadsheet triggered from the UI
 */
export const createNewDatabaseFromUI = (customName) => {
  try {
    const name = (customName && String(customName).trim()) || 'Gurukul Books - Financial ERP Database';
    const newSs = createDatabaseSpreadsheet(name);
    return {
      success: true,
      spreadsheetId: newSs.getId(),
      spreadsheetName: newSs.getName(),
      spreadsheetUrl: newSs.getUrl(),
      message: `Successfully created new database sheet: ${newSs.getName()}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to create spreadsheet: ${err.message || String(err)}`,
    };
  }
};

/**
 * Set target spreadsheet ID in User Properties
 */
export const setDatabaseSpreadsheetId = (id) => {
  return connectExistingSpreadsheet(id);
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
  const ss = getSpreadsheet(true);
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
export const initDatabase = (ssOverride) => {
  const ss = ssOverride || getSpreadsheet(false);
  if (!ss) return { success: false, message: 'Spreadsheet not found' };

  Object.entries(SHEET_SCHEMAS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    ensureSheetHeaders(sheet, name);
  });

  // Default Company Settings
  const setSheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (setSheet && setSheet.getLastRow() <= 1) {
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
  if (seriesSheet && seriesSheet.getLastRow() <= 1) {
    const seriesData = [
      ['SalesInvoice', 'SINV-', 1001, 4],
      ['Payment', 'PAY-', 1001, 4],
      ['Expense', 'EXP-', 1001, 4],
      ['JournalEntry', 'JV-', 1001, 4],
      ['Receipt', 'RCPT-', 1001, 4],
      ['Quote', 'SQUOT-', 1001, 4],
    ];
    seriesSheet.getRange(2, 1, seriesData.length, 4).setValues(seriesData);
  }

  // Default Chart of Accounts
  const coaSheet = ss.getSheetByName(SHEETS.ACCOUNTS);
  if (coaSheet && coaSheet.getLastRow() <= 1) {
    coaSheet.getRange(2, 1, DEFAULT_CHART_OF_ACCOUNTS.length, 5).setValues(DEFAULT_CHART_OF_ACCOUNTS);
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
