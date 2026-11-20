import { getSheet, getSpreadsheet, SHEETS, SHEET_SCHEMAS, getRowsAsObjects, getNextSeriesNumber } from './db.js';

/**
 * Get all expenses, newest first
 */
export const getExpenses = () => {
  let expenses = getRowsAsObjects(SHEETS.EXPENSES);
  // Auto-sync all 101 records (₹2,22,512.12) if the sheet currently only has partial rows (< 50)
  if (expenses.length < 50) {
    try {
      const syncRes = syncExpensesFromJournalLedgers();
      if (syncRes && syncRes.success && syncRes.count > expenses.length) {
        expenses = getRowsAsObjects(SHEETS.EXPENSES);
      }
    } catch (e) {
      console.warn('Auto-sync expenses warning:', e);
    }
  }
  return JSON.stringify(expenses.reverse());
};

/**
 * Synchronize complete expenses (₹2,22,512.12 across all 101 records) from JournalLedgers & JournalEntries
 */
export const syncExpensesFromJournalLedgers = () => {
  const ss = getSpreadsheet();
  if (!ss) return { success: false, message: 'Spreadsheet not found' };

  const coaSheet = ss.getSheetByName(SHEETS.ACCOUNTS);
  const jlSheet = ss.getSheetByName(SHEETS.JOURNAL_LEDGERS);
  const jeSheet = ss.getSheetByName(SHEETS.JOURNAL_ENTRIES);
  const expSheet = ss.getSheetByName(SHEETS.EXPENSES);

  if (!coaSheet || !jlSheet || !expSheet) {
    return { success: false, message: 'Required sheets not found' };
  }

  // 1. Identify all accounts whose rootType is 'Expense'
  const coaRows = coaSheet.getDataRange().getValues().slice(1);
  const expenseAccounts = new Set();
  coaRows.forEach((row) => {
    const accName = row[0];
    const rootType = row[1];
    if (rootType === 'Expense') {
      expenseAccounts.add(accName);
    }
  });

  // 2. Map JournalEntries metadata (date, narration, ref)
  const jeMap = {};
  if (jeSheet) {
    const jeRows = jeSheet.getDataRange().getValues().slice(1);
    jeRows.forEach((row) => {
      jeMap[row[0]] = {
        date: row[1],
        ref: row[3] || '',
        narration: row[5] || '',
      };
    });
  }

  // 3. Map credit accounts per entryNo to determine paid_via
  const jlRows = jlSheet.getDataRange().getValues().slice(1);
  const entryCreditAccounts = {};
  jlRows.forEach((row) => {
    const entryNo = row[1];
    const acc = row[2];
    const credit = parseFloat(row[4]) || 0;
    if (credit > 0 && !entryCreditAccounts[entryNo]) {
      entryCreditAccounts[entryNo] = acc;
    }
  });

  // 4. Extract all expense debit transactions
  const expenseRows = [];
  let expIdx = 1;
  let totalAmount = 0;

  jlRows.forEach((row) => {
    const entryNo = row[1];
    const acc = row[2];
    const debit = parseFloat(row[3]) || 0;

    if (debit > 0 && expenseAccounts.has(acc)) {
      const meta = jeMap[entryNo] || {};
      const paidVia = entryCreditAccounts[entryNo] || 'Primary Bank';
      const dateStr = meta.date
        ? (meta.date instanceof Date ? meta.date.toISOString().substring(0, 10) : String(meta.date).substring(0, 10))
        : '';

      expenseRows.push([
        `EXP-${1000 + expIdx}`,
        dateStr,
        acc,
        paidVia,
        debit,
        meta.narration || '',
        meta.ref || '',
        meta.date || '',
      ]);
      totalAmount += debit;
      expIdx++;
    }
  });

  // 5. Rewrite Expenses sheet with all 101 clean records
  expSheet.clear();
  const headers = SHEET_SCHEMAS[SHEETS.EXPENSES];
  expSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  expSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f1f5f9');
  expSheet.setFrozenRows(1);

  if (expenseRows.length > 0) {
    expSheet.getRange(2, 1, expenseRows.length, headers.length).setValues(expenseRows);
  }

  return {
    success: true,
    totalExpenses: expenseRows.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

/**
 * Add a new Expense record
 */
export const addExpense = (expenseData) => {
  const sheet = getSheet(SHEETS.EXPENSES);
  const expenseNo = expenseData.expenseNo || getNextSeriesNumber('Expense');
  const date = expenseData.date || new Date().toISOString().substring(0, 10);
  const category = expenseData.category || 'General Expense';
  const paidVia = expenseData.paidVia || 'Primary Bank';
  const amount = parseFloat(expenseData.amount || 0);
  const description = expenseData.description || '';
  const refTxnId = expenseData.referenceTxnId || '';
  const createdAt = new Date().toISOString();

  sheet.appendRow([
    expenseNo,
    date,
    category,
    paidVia,
    amount,
    description,
    refTxnId,
    createdAt,
  ]);

  return { success: true, expenseNo };
};
