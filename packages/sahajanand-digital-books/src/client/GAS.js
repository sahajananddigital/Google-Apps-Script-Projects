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
      name: 'SINV-1061',
      date: '2026-09-16',
      party: 'Prevail Enginnering',
      netTotal: 1359,
      discountAmount: 0,
      grandTotal: 1359,
      outstandingAmount: 0,
      status: 'Paid',
      terms: 'Payment due on receipt.',
      items: [
        { item: 'Web Server Hosting Service', description: 'Annual cloud hosting', hsnCode: '998312', quantity: 1, rate: 1359, amount: 1359 }
      ]
    },
    {
      name: 'SINV-1060',
      date: '2026-08-15',
      party: 'Siddhatva Accountants LLP',
      netTotal: 3000,
      discountAmount: 0,
      grandTotal: 3000,
      outstandingAmount: 3000,
      status: 'Submitted',
      terms: 'Immediate payment',
      items: [
        { item: 'Website Development Consultancy', description: 'Consulting services', hsnCode: '998312', quantity: 1, rate: 3000, amount: 3000 }
      ]
    }
  ],
  payments: [
    {
      name: 'PAY-1045',
      date: '2026-09-16',
      party: 'Prevail Enginnering',
      invoiceNo: 'SINV-1061',
      amount: 1359,
      paymentMethod: 'Transfer',
      paymentAccount: 'Federal Bank',
      referenceId: 'UPI9837482910',
    }
  ],
  expenses: [
    {
      expenseNo: 'EXP-1001',
      date: '2026-09-10',
      category: 'Server Hosting & Infrastructure (Hetzner)',
      paidVia: 'Federal Bank',
      amount: 351,
      description: 'Monthly VPS cloud hosting Hetzner',
      referenceTxnId: 'S55656780',
    },
    {
      expenseNo: 'EXP-1002',
      date: '2026-09-12',
      category: 'Software Subscriptions & SaaS (Google Workspace)',
      paidVia: 'Federal Bank',
      amount: 130,
      description: 'Google Workspace email accounts',
      referenceTxnId: '410375908459',
    }
  ],
  accounts: [
    { name: 'Application of Funds (Assets)', rootType: 'Asset', parentAccount: '', accountType: '', isGroup: true },
    { name: 'Current Assets', rootType: 'Asset', parentAccount: 'Application of Funds (Assets)', accountType: '', isGroup: true },
    { name: 'Bank Accounts', rootType: 'Asset', parentAccount: 'Current Assets', accountType: 'Bank', isGroup: true },
    { name: 'Federal Bank', rootType: 'Asset', parentAccount: 'Bank Accounts', accountType: 'Bank', isGroup: false },
    { name: 'Tamilnad Mercantile Bank', rootType: 'Asset', parentAccount: 'Bank Accounts', accountType: 'Bank', isGroup: false },
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
    { name: 'Stock Expenses', rootType: 'Expense', parentAccount: 'Direct Expenses', accountType: 'Cost of Goods Sold', isGroup: true },
    { name: 'Hetzner', rootType: 'Expense', parentAccount: 'Direct Expenses', accountType: 'Expense', isGroup: false },
    { name: 'Google Products', rootType: 'Expense', parentAccount: 'Direct Expenses', accountType: 'Expense', isGroup: false },
  ],
  customers: [
    {
      name: 'Prevail Enginnering',
      email: 'info@prevailengg.com',
      phone: '+91 9824079175',
      addressLine1: 'Ahmedabad',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '382350',
      gstin: '24AFOPC8052P1Z0',
      outstandingAmount: 0
    },
    {
      name: 'Siddhatva Accountants LLP',
      email: 'nikhil@siddhatvaaccountants.com',
      phone: '+917435075389',
      addressLine1: '621, Shivalik Shilp 2, Opp. ITC Narmada',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380015',
      gstin: '',
      outstandingAmount: 3000
    },
    {
      name: 'Multidots Inc.',
      email: 'accounts@multidots.com',
      phone: '+16468937967',
      addressLine1: '801, Barton Springs Rd.',
      city: 'Austin',
      state: 'TX',
      postalCode: '78704',
      gstin: '',
      outstandingAmount: 0
    }
  ],
  items: [
    { name: 'Website Development Consultancy', rate: 95000, unit: 'Unit', hsnCode: '998312', description: 'Full stack web application development' },
    { name: 'Web Server Hosting Service', rate: 3800, unit: 'Unit', hsnCode: '998312', description: 'Managed VPS hosting & security' },
    { name: 'Domain Name Service', rate: 1500, unit: 'Unit', hsnCode: '998312', description: 'Domain registration & DNS management' },
    { name: 'Other', rate: 0, unit: 'Unit', hsnCode: '998312', description: 'Custom digital consultancy' }
  ],
  journalEntries: [
    {
      name: 'JV-1009',
      date: '2026-09-10',
      entryType: 'Journal Entry',
      userRemark: 'Hetzner cloud server',
      splits: [
        { account: 'Hetzner', debit: 351, credit: 0 },
        { account: 'Federal Bank', debit: 0, credit: 351 }
      ]
    }
  ],
  settings: {
    companyName: 'Sahajanand Digital',
    fullname: 'Vanpariya Ronakkumar Jagdishbhai',
    address: '505, 3rd Floor, Blueberry Complex, Near Gurukul Circle, Nikol, Ahmedabad, Gujarat, India, 382350',
    phone: '+91 8160535181',
    email: 'sahajananddigital108@gmail.com',
    website: 'https://sahajananddigital.in',
    pan: 'BURPJ8082P',
    udyam: 'UDYAM-GJ-01-0385616',
    gstin: 'URP',
    primaryBankName: 'Tamilnad Mercantile Bank',
    primaryBankBranch: 'Nikol (Blueberry)',
    primaryAccountType: 'Current',
    primaryAccountNo: '60853 1837 108 915',
    primaryIfsc: 'TMBL0000608',
    primaryUpiId: 'sahajananddigitalnikol@tmb',
    secondaryBankName: 'Federal Bank',
    secondaryBankBranch: 'Neo Banking - Jupiter',
    secondaryAccountType: 'Savings',
    secondaryAccountNo: '77770117398715',
    secondaryIfsc: 'FDRL0007777',
    secondaryUpiId: '7574841101@jupiteraxis',
    defaultPrintTemplate: 'IndianStyleTally',
    brandColor: '#112B42',
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
                paymentAccount: args[0].account || 'Federal Bank',
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
                paidVia: args[0].paidVia || 'Federal Bank',
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
            case 'saveItem':
              mockState.items.push(args[0]);
              resolve({ success: true });
              break;
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
                { id: 'IndianStyleTally', name: 'Indian Tally Style (Tax Invoice / Bill of Supply)' },
                { id: 'TamilnadMercantileBank', name: 'Modern Tamilnad Mercantile Bank' },
                { id: 'JupiterBank', name: 'Modern Jupiter Bank (Federal Bank)' },
              ]));
              break;
            case 'getMigrationStatus':
              resolve({
                success: true,
                spreadsheetName: 'Sahajanand Digital - Accounts & Invoices (GAS)',
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
              resolve({
                success: true,
                message: 'Migration data imported successfully',
                importedCounts: {
                  Invoices: 36,
                  InvoiceItems: 65,
                  Payments: 45,
                  Expenses: 24,
                  ChartOfAccounts: 109,
                  Customers: 26,
                  Items: 4,
                  JournalEntries: 93,
                  JournalLedgers: 211,
                  CompanySettings: 23,
                  NumberSeries: 5,
                },
              });
              break;
            case 'resetDatabase':
              resolve({ success: true, message: 'All sheets reset to blank schemas.' });
              break;
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
