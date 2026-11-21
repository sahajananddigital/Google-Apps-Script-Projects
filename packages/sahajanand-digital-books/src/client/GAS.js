import { queueOfflineRequest } from './utils/offlineSync';

const mutatingFunctions = [
  'createInvoice',
  'updateInvoiceStatus',
  'addPayment',
  'addExpense',
  'addJournalEntry',
  'saveCustomer',
  'saveItem',
  'saveAppSettings',
];

/**
 * Local mock state for development & testing
 */
let mockState = {
  invoices: [
    {
      name: 'SINV-1001',
      date: '2026-04-01',
      party: 'Apex Academy',
      netTotal: 25000,
      discountAmount: 0,
      grandTotal: 25000,
      outstandingAmount: 0,
      status: 'Paid',
      terms: 'Payment due on receipt.',
      items: [
        { item: 'Course Tuition Fee', description: 'Comprehensive training program', hsnCode: '999293', quantity: 1, rate: 25000, amount: 25000 }
      ]
    },
    {
      name: 'SINV-1002',
      date: '2026-04-05',
      party: 'Global Tech Solutions',
      netTotal: 3000,
      discountAmount: 0,
      grandTotal: 3000,
      outstandingAmount: 3000,
      status: 'Submitted',
      terms: 'Immediate payment',
      items: [
        { item: 'Cloud Server Hosting', description: 'Managed cloud server hosting', hsnCode: '998312', quantity: 1, rate: 3000, amount: 3000 }
      ]
    }
  ],
  payments: [
    {
      name: 'PAY-1001',
      date: '2026-04-01',
      party: 'Apex Academy',
      invoiceNo: 'SINV-1001',
      amount: 25000,
      paymentMethod: 'Transfer',
      paymentAccount: 'Primary Bank',
      referenceId: 'UPI9837482910',
    }
  ],
  expenses: [
    {
      expenseNo: 'EXP-1001',
      date: '2026-09-10',
      category: 'Cloud Server Infrastructure',
      paidVia: 'Primary Bank',
      amount: 351,
      description: 'Monthly VPS cloud hosting servers',
      referenceTxnId: 'S55656780',
    },
    {
      expenseNo: 'EXP-1002',
      date: '2026-09-12',
      category: 'Software Subscriptions & SaaS (Google Workspace)',
      paidVia: 'Primary Bank',
      amount: 130,
      description: 'Google Workspace email accounts',
      referenceTxnId: '410375908459',
    }
  ],
  accounts: [
    { name: 'Application of Funds (Assets)', rootType: 'Asset', parentAccount: '', accountType: '', isGroup: true },
    { name: 'Current Assets', rootType: 'Asset', parentAccount: 'Application of Funds (Assets)', accountType: '', isGroup: true },
    { name: 'Bank Accounts', rootType: 'Asset', parentAccount: 'Current Assets', accountType: 'Bank', isGroup: true },
    { name: 'Primary Bank', rootType: 'Asset', parentAccount: 'Bank Accounts', accountType: 'Bank', isGroup: false },
    { name: 'Secondary Bank', rootType: 'Asset', parentAccount: 'Bank Accounts', accountType: 'Bank', isGroup: false },
    { name: 'Cash In Hand', rootType: 'Asset', parentAccount: 'Current Assets', accountType: 'Cash', isGroup: true },
    { name: 'Cash', rootType: 'Asset', parentAccount: 'Cash In Hand', accountType: 'Cash', isGroup: false },
    { name: 'Accounts Receivable', rootType: 'Asset', parentAccount: 'Current Assets', accountType: 'Receivable', isGroup: true },
    { name: 'Debtors', rootType: 'Asset', parentAccount: 'Accounts Receivable', accountType: 'Receivable', isGroup: false },
    { name: 'Source of Funds (Liabilities)', rootType: 'Liability', parentAccount: '', accountType: '', isGroup: true },
    { name: 'Current Liabilities', rootType: 'Liability', parentAccount: 'Source of Funds (Liabilities)', accountType: '', isGroup: true },
    { name: 'Accounts Payable', rootType: 'Liability', parentAccount: 'Current Liabilities', accountType: 'Payable', isGroup: true },
    { name: 'Creditors', rootType: 'Liability', parentAccount: 'Accounts Payable', accountType: 'Payable', isGroup: false },
    { name: 'Equity', rootType: 'Equity', parentAccount: '', accountType: '', isGroup: true },
    { name: 'Income', rootType: 'Income', parentAccount: '', accountType: '', isGroup: true },
    { name: 'Direct Income', rootType: 'Income', parentAccount: 'Income', accountType: '', isGroup: true },
    { name: 'Service', rootType: 'Income', parentAccount: 'Direct Income', accountType: 'Service', isGroup: false },
    { name: 'Expenses', rootType: 'Expense', parentAccount: '', accountType: '', isGroup: true },
    { name: 'Direct Expenses', rootType: 'Expense', parentAccount: 'Expenses', accountType: '', isGroup: true },
    { name: 'Operating Expenses', rootType: 'Expense', parentAccount: 'Direct Expenses', accountType: 'Expense', isGroup: false },
    { name: 'Software & Hosting', rootType: 'Expense', parentAccount: 'Direct Expenses', accountType: 'Expense', isGroup: false },
  ],
  customers: [
    {
      name: 'Apex Academy',
      email: 'student@example.com',
      phone: '+91 98000 00001',
      addressLine1: 'Central Campus',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380001',
      gstin: '24AAAAA0000A1Z5',
      outstandingAmount: 0
    },
    {
      name: 'Global Tech Solutions',
      email: 'billing@example.com',
      phone: '+91 98000 00002',
      addressLine1: 'Business Hub, MG Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380015',
      gstin: '',
      outstandingAmount: 3000
    }
  ],
  items: [
    { name: 'Course Tuition Fee', rate: 25000, unit: 'Term', hsnCode: '999293', description: 'Comprehensive training program' },
    { name: 'Web Development Consultancy', rate: 50000, unit: 'Unit', hsnCode: '998312', description: 'Full stack development services' },
    { name: 'Cloud Server Hosting', rate: 3000, unit: 'Month', hsnCode: '998312', description: 'Managed cloud server hosting' }
  ],
  journalEntries: [
    {
      name: 'JV-1001',
      date: '2026-04-01',
      entryType: 'Journal Entry',
      userRemark: 'Opening server subscription',
      splits: [
        { account: 'Software & Hosting', debit: 500, credit: 0 },
        { account: 'Primary Bank', debit: 0, credit: 500 }
      ]
    }
  ],
  settings: {
    companyName: 'Demo Organization',
    fullname: 'Administrator',
    address: '100 Innovation Way, Tech Park, City, 380001',
    phone: '+91 98000 00000',
    email: 'contact@example.com',
    website: 'https://example.com',
    pan: '',
    udyam: '',
    gstin: 'URP',
    primaryBankName: 'Primary Bank',
    primaryBankBranch: 'Main Branch',
    primaryAccountType: 'Current',
    primaryAccountNo: '123456789012',
    primaryIfsc: 'BANK0001234',
    primaryUpiId: '',
    secondaryBankName: 'Secondary Bank',
    secondaryBankBranch: 'City Branch',
    secondaryAccountType: 'Savings',
    secondaryAccountNo: '987654321098',
    secondaryIfsc: 'BANK0005678',
    secondaryUpiId: '',
    defaultPrintTemplate: 'IndianStyleTally',
    brandColor: '#1e3a8a',
    currency: 'INR',
  },
};

/**
 * Raw execution of GAS function
 */
export const execGAS = (functionName, ...args) => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google && window.google.script && window.google.script.run) {
      window.google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error) => {
          console.error(`GAS Execution Error in ${functionName}:`, error);
          reject(error);
        })[functionName](...args);
    } else {
      // Local development mock handler
      setTimeout(() => {
        try {
          switch (functionName) {
            case 'getInvoices':
              resolve(JSON.stringify(mockState.invoices));
              break;
            case 'createInvoice': {
              const newInv = {
                name: `SINV-${Date.now().toString().slice(-4)}`,
                date: args[0].date || new Date().toISOString().substring(0, 10),
                party: args[0].customerName,
                netTotal: args[0].netTotal,
                discountAmount: args[0].discountAmount || 0,
                grandTotal: args[0].grandTotal,
                outstandingAmount: args[0].grandTotal,
                status: 'Submitted',
                terms: args[0].terms || '',
                items: args[0].items || [],
              };
              mockState.invoices.unshift(newInv);
              resolve({ success: true, invoiceNo: newInv.name });
              break;
            }
            case 'updateInvoiceStatus': {
              const [invNo, newStatus] = args;
              const found = mockState.invoices.find((i) => i.name === invNo || i.InvoiceNo === invNo);
              if (found) {
                found.status = newStatus;
                found.Status = newStatus;
                if (newStatus === 'Paid') {
                  found.outstandingAmount = 0;
                  found.OutstandingAmount = 0;
                }
              }
              resolve({ success: true });
              break;
            }
            case 'getPayments':
              resolve(JSON.stringify(mockState.payments));
              break;
            case 'addPayment': {
              const newPay = {
                name: `PAY-${Date.now().toString().slice(-4)}`,
                party: args[0].customerName,
                date: args[0].date || new Date().toISOString().substring(0, 10),
                invoiceNo: args[0].invoiceNo || '',
                amount: parseFloat(args[0].amount || 0),
                paymentMethod: args[0].paymentMethod || 'Transfer',
                paymentAccount: args[0].account || 'Primary Bank',
                referenceId: args[0].referenceTxnId || '',
              };
              mockState.payments.unshift(newPay);

              // Update invoice outstanding
              if (args[0].invoiceNo) {
                const inv = mockState.invoices.find((i) => i.name === args[0].invoiceNo || i.InvoiceNo === args[0].invoiceNo);
                if (inv) {
                  const curOut = parseFloat(inv.outstandingAmount || inv.grandTotal || 0);
                  const rem = Math.max(0, curOut - newPay.amount);
                  inv.outstandingAmount = rem;
                  if (rem === 0) inv.status = 'Paid';
                }
              }
              resolve({ success: true, paymentNo: newPay.name });
              break;
            }
            case 'getExpenses':
              resolve(JSON.stringify(mockState.expenses));
              break;
            case 'addExpense': {
              const newExp = {
                expenseNo: `EXP-${Date.now().toString().slice(-4)}`,
                date: args[0].date || new Date().toISOString().substring(0, 10),
                category: args[0].category || 'General Expense',
                paidVia: args[0].paidVia || 'Primary Bank',
                amount: parseFloat(args[0].amount || 0),
                description: args[0].description || '',
                referenceTxnId: args[0].referenceTxnId || '',
              };
              mockState.expenses.unshift(newExp);
              resolve({ success: true, expenseNo: newExp.expenseNo });
              break;
            }
            case 'getCustomers':
              resolve(JSON.stringify(mockState.customers));
              break;
            case 'saveCustomer':
              mockState.customers.push(args[0]);
              resolve({ success: true });
              break;
            case 'getItems':
              resolve(JSON.stringify(mockState.items));
              break;
            case 'saveItem': {
              const itemData = args[0] || {};
              const name = itemData.name || itemData.ItemName;
              const orig = itemData.originalName;
              const idx = mockState.items.findIndex(
                (it) => (orig && (it.name === orig || it.ItemName === orig)) || ((it.name === name || it.ItemName === name) && !itemData.isClone)
              );
              if (idx >= 0) {
                mockState.items[idx] = { ...mockState.items[idx], ...itemData, name };
              } else {
                mockState.items.push(itemData);
              }
              resolve({ success: true, message: `Item "${name}" saved` });
              break;
            }
            case 'deleteItem': {
              const targetName = args[0];
              mockState.items = mockState.items.filter((it) => (it.name || it.ItemName) !== targetName);
              resolve({ success: true, message: `Item "${targetName}" deleted` });
              break;
            }
            case 'syncExpensesFromJournalLedgers': {
              resolve({ success: true, count: 101, totalAmount: 222512.12 });
              break;
            }
            case 'syncCustomerOutstanding': {
              resolve({ success: true });
              break;
            }
            case 'getChartOfAccounts':
              resolve(JSON.stringify(mockState.accounts));
              break;
            case 'getJournalEntries':
              resolve(JSON.stringify(mockState.journalEntries));
              break;
            case 'addJournalEntry': {
              const newJv = {
                name: `JV-${Date.now().toString().slice(-4)}`,
                date: args[0].date,
                entryType: args[0].entryType || 'Journal Entry',
                userRemark: args[0].narration,
                splits: args[0].splits || [],
              };
              mockState.journalEntries.unshift(newJv);
              resolve({ success: true, entryNo: newJv.name });
              break;
            }
            case 'getAppSettings':
              resolve(JSON.stringify(mockState.settings));
              break;
            case 'saveAppSettings':
              mockState.settings = { ...mockState.settings, ...args[0] };
              resolve({ success: true });
              break;
            case 'getPrintTemplates':
              resolve(JSON.stringify([
                { id: 'EducationFeeReceipt', name: 'Educational Institute Fee Receipt' },
                { id: 'EducationPartialFeeReceipt', name: 'Partial / Installment Fee Receipt' },
                { id: 'IndianStyleTally', name: 'Indian Tally Style (Tax Invoice / Bill of Supply)' },
                { id: 'ModernProfessional', name: 'Modern Professional (Primary Bank & UPI QR)' },
                { id: 'ModernMinimalist', name: 'Modern Minimalist (Secondary Bank & UPI QR)' },
              ]));
              break;
            case 'getMigrationStatus':
              resolve({
                success: true,
                spreadsheetName: 'Demo Accounts & Invoices (GAS)',
                spreadsheetUrl: '#',
                totalRecords: mockState.invoices.length + mockState.payments.length + mockState.expenses.length + mockState.accounts.length + mockState.customers.length + mockState.items.length + mockState.journalEntries.length,
                sheetCounts: {
                  Invoices: mockState.invoices.length,
                  InvoiceItems: mockState.invoices.reduce((s, i) => s + (i.items?.length || 1), 0),
                  Payments: mockState.payments.length,
                  Expenses: mockState.expenses.length,
                  ChartOfAccounts: mockState.accounts.length,
                  Customers: mockState.customers.length,
                  Items: mockState.items.length,
                  JournalEntries: mockState.journalEntries.length,
                  JournalLedgers: mockState.journalEntries.reduce((s, j) => s + (j.splits?.length || 2), 0),
                  CompanySettings: Object.keys(mockState.settings).length,
                  NumberSeries: 5,
                },
              });
              break;
            case 'importExcelFile':
            case 'importMigrationSheets':
            case 'importDefaultSeedData':
              resolve({
                success: true,
                message: 'Migration data imported successfully',
                importedCounts: {
                  Invoices: 46,
                  InvoiceItems: 65,
                  Payments: 45,
                  Expenses: 89,
                  ChartOfAccounts: 109,
                  Customers: 26,
                  Items: 4,
                  JournalEntries: 96,
                  JournalLedgers: 369,
                  CompanySettings: 4,
                  NumberSeries: 4,
                },
              });
              break;
            case 'resetDatabase':
              resolve({ success: true, message: 'All sheets reset to blank schemas.' });
              break;
            case 'getDatabaseInfo':
              resolve({
                configured: true,
                spreadsheetId: mockState.currentSheetId || '1mockGurukulDbId',
                spreadsheetName: mockState.currentSheetName || 'Gurukul Books - Financial ERP Database',
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${mockState.currentSheetId || '1mockGurukulDbId'}/edit`,
                savedDatabases: mockState.savedDatabases || [
                  { id: '1mockGurukulDbId', name: 'Gurukul Books - Financial ERP Database', url: 'https://docs.google.com/spreadsheets/d/1mockGurukulDbId/edit', lastUsed: new Date().toISOString() },
                  { id: '1mockShikshaDbId', name: 'Shiksha Skills Institute - Database', url: 'https://docs.google.com/spreadsheets/d/1mockShikshaDbId/edit', lastUsed: new Date().toISOString() }
                ],
                message: 'Connected to mock database',
              });
              break;
            case 'switchDatabase': {
              const targetId = args[0];
              const found = (mockState.savedDatabases || []).find((d) => d.id === targetId);
              const targetName = found ? found.name : 'Switched Google Sheet';
              mockState.currentSheetId = targetId;
              mockState.currentSheetName = targetName;
              resolve({
                success: true,
                spreadsheetId: targetId,
                spreadsheetName: targetName,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetId}/edit`,
                savedDatabases: mockState.savedDatabases || [],
                message: `Switched active database to: ${targetName}`,
              });
              break;
            }
            case 'removeSavedDatabase': {
              const removeId = args[0];
              mockState.savedDatabases = (mockState.savedDatabases || []).filter((d) => d.id !== removeId);
              resolve({ success: true, savedDatabases: mockState.savedDatabases });
              break;
            }
            case 'createNewDatabaseFromUI': {
              const name = args[0] || 'Gurukul Books - Financial ERP Database';
              resolve({
                success: true,
                spreadsheetId: `mock_${Date.now()}`,
                spreadsheetName: name,
                spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/mock/edit',
                message: `Successfully created new database: ${name}`,
              });
              break;
            }
            case 'connectExistingSpreadsheet': {
              const sheetInput = args[0] || '';
              resolve({
                success: true,
                spreadsheetId: sheetInput.slice(0, 20) || 'custom_sheet_id',
                spreadsheetName: 'Custom Connected Google Sheet',
                spreadsheetUrl: sheetInput.startsWith('http') ? sheetInput : `https://docs.google.com/spreadsheets/d/${sheetInput}/edit`,
                message: 'Successfully connected custom spreadsheet',
              });
              break;
            }
            default:
              resolve({ success: true, message: 'Mock response' });
          }
        } catch (e) {
          reject(e);
        }
      }, 150);
    }
  });
};

/**
 * Higher-level GAS caller with offline fallback support
 */
export const callGAS = (functionName, ...args) => {
  if (!navigator.onLine && mutatingFunctions.includes(functionName)) {
    queueOfflineRequest(functionName, args);
    return Promise.resolve({ success: true, offline: true, message: 'Saved to offline queue' });
  }

  return execGAS(functionName, ...args);
};
