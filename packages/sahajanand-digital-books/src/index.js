import { doGet } from './server/webapp.js';
import {
  initDatabase,
  ensureAllHeaders,
  setDatabaseSpreadsheetId,
  getDatabaseInfo,
  createNewDatabaseFromUI,
  connectExistingSpreadsheet,
  createDatabaseSpreadsheet,
} from './server/db.js';
import { getInvoices, createInvoice, updateInvoiceStatus } from './server/invoice.js';
import { getPayments, addPayment } from './server/payment.js';
import { getExpenses, addExpense, syncExpensesFromJournalLedgers } from './server/expense.js';
import { getChartOfAccounts, getJournalEntries, addJournalEntry, getAccountLedger, syncFullJournalLedgers, getAccountBalancesFromLedger } from './server/accounting.js';
import { getCustomers, saveCustomer, syncCustomerOutstanding } from './server/customer.js';
import { getItems, saveItem, deleteItem } from './server/item.js';
import { getAppSettings, saveAppSettings, getPrintTemplates } from './server/settings.js';
import { importMigrationSheets, importExcelFile, getMigrationStatus, resetDatabase, importDefaultSeedData } from './server/migration.js';
import { onSheetsHomepage, onCardInitDatabase, onCardAuditLedgers } from './server/addon.js';

export function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('⚡ Gurukul Books')
      .addItem('⚙️ Initialize Sheets & Headers', 'initDatabase')
      .addItem('🔄 Audit General Ledger Entries', 'syncFullJournalLedgers')
      .addItem('🔄 Sync All Expenses (from Ledgers)', 'syncExpensesFromJournalLedgers')
      .addItem('🔄 Sync Customer Outstanding', 'syncCustomerOutstanding')
      .addItem('📋 Ensure Sheet Headers', 'ensureAllHeaders')
      .addToUi();
  } catch (e) {
    // SpreadsheetApp.getUi() not available in webapp standalone mode
  }
}

export {
  doGet,
  initDatabase,
  ensureAllHeaders,
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  getPayments,
  addPayment,
  getExpenses,
  addExpense,
  syncExpensesFromJournalLedgers,
  getChartOfAccounts,
  getJournalEntries,
  addJournalEntry,
  getAccountLedger,
  syncFullJournalLedgers,
  getAccountBalancesFromLedger,
  getCustomers,
  saveCustomer,
  syncCustomerOutstanding,
  getItems,
  saveItem,
  deleteItem,
  getAppSettings,
  saveAppSettings,
  getPrintTemplates,
  importMigrationSheets,
  importExcelFile,
  getMigrationStatus,
  resetDatabase,
  importDefaultSeedData,
  setDatabaseSpreadsheetId,
  getDatabaseInfo,
  createNewDatabaseFromUI,
  connectExistingSpreadsheet,
  createDatabaseSpreadsheet,
  onSheetsHomepage,
  onCardInitDatabase,
  onCardAuditLedgers,
};

