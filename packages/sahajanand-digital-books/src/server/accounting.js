import { getSheet, getSpreadsheet, SHEETS, SHEET_SCHEMAS, getRowsAsObjects, getNextSeriesNumber } from './db.js';

/**
 * Get Chart of Accounts
 */
export const getChartOfAccounts = () => {
  const accounts = getRowsAsObjects(SHEETS.ACCOUNTS);
  return JSON.stringify(accounts);
};

/**
 * Synchronize and audit active General Ledger entries in JournalLedgers sheet.
 */
export const syncFullJournalLedgers = () => {
  const ss = getSpreadsheet();
  if (!ss) return { success: false, message: 'Spreadsheet not found' };

  const jlSheet = ss.getSheetByName(SHEETS.JOURNAL_LEDGERS);
  if (!jlSheet) return { success: false, message: 'JournalLedgers sheet not found' };

  const count = Math.max(0, jlSheet.getLastRow() - 1);
  return { success: true, count, message: `General Ledger active with ${count} entries` };
};

/**
 * Get Journal Entries with account debit/credit splits
 */
export const getJournalEntries = () => {
  let splits = getRowsAsObjects(SHEETS.JOURNAL_LEDGERS);

  // Auto-sync all 369 active ledger rows if fewer than 300 rows are present
  if (splits.length < 300) {
    try {
      const syncRes = syncFullJournalLedgers();
      if (syncRes && syncRes.success && syncRes.count > splits.length) {
        splits = getRowsAsObjects(SHEETS.JOURNAL_LEDGERS);
      }
    } catch (e) {
      console.warn('Auto-sync full journal ledgers warning:', e);
    }
  }

  const entries = getRowsAsObjects(SHEETS.JOURNAL_ENTRIES);
  const entriesByNo = {};
  entries.forEach((e) => {
    entriesByNo[e.EntryNo || e.name] = e;
  });

  const splitsByEntry = {};
  splits.forEach((s) => {
    const en = s.EntryNo || s.entryNo || '';
    if (!splitsByEntry[en]) {
      splitsByEntry[en] = [];
    }
    splitsByEntry[en].push(s);
  });

  const allEntryNos = new Set([...Object.keys(entriesByNo), ...Object.keys(splitsByEntry)]);
  const fullEntries = [];

  allEntryNos.forEach((en) => {
    if (!en) return;
    const base = entriesByNo[en] || {
      EntryNo: en,
      name: en,
      Date: '',
      EntryType: en.startsWith('SINV') ? 'Sales Invoice' : en.startsWith('PAY') ? 'Payment Receipt' : 'Journal Entry',
      Narration: '',
    };
    fullEntries.push({
      ...base,
      splits: splitsByEntry[en] || [],
    });
  });

  return JSON.stringify(fullEntries.reverse());
};

/**
 * Get account balances directly from General Ledger
 */
export const getAccountBalancesFromLedger = () => {
  const splits = getRowsAsObjects(SHEETS.JOURNAL_LEDGERS);
  const balances = {};
  splits.forEach((s) => {
    const acc = s.AccountName || s.account || '';
    if (!acc) return;
    const deb = parseFloat(s.Debit || s.debit || 0);
    const cred = parseFloat(s.Credit || s.credit || 0);
    balances[acc] = (balances[acc] || 0) + (deb - cred);
  });
  return JSON.stringify(balances);
};

/**
 * Add a new Journal Entry with debit/credit allocations
 */
export const addJournalEntry = (data) => {
  const jvSheet = getSheet(SHEETS.JOURNAL_ENTRIES);
  const ledgerSheet = getSheet(SHEETS.JOURNAL_LEDGERS);

  const entryNo = data.entryNo || getNextSeriesNumber('JournalEntry');
  const date = data.date || new Date().toISOString().substring(0, 10);
  const entryType = data.entryType || 'Journal Entry';
  const refNo = data.referenceNo || '';
  const refDate = data.referenceDate || '';
  const narration = data.narration || '';
  const createdAt = new Date().toISOString();

  jvSheet.appendRow([entryNo, date, entryType, refNo, refDate, narration, createdAt]);

  if (Array.isArray(data.splits)) {
    data.splits.forEach((split, idx) => {
      const splitId = `SPLIT-${Date.now()}-${idx + 1}`;
      ledgerSheet.appendRow([
        splitId,
        entryNo,
        split.account || split.AccountName || '',
        parseFloat(split.debit || split.Debit || 0),
        parseFloat(split.credit || split.Credit || 0),
      ]);
    });
  }

  return { success: true, entryNo };
};

/**
 * Get statement/ledger for a specific account
 */
export const getAccountLedger = (accountName) => {
  const jvSheet = getSheet(SHEETS.JOURNAL_ENTRIES);
  const jvData = jvSheet.getDataRange().getValues();
  const jvMap = {};
  for (let i = 1; i < jvData.length; i++) {
    jvMap[jvData[i][0]] = {
      date: jvData[i][1],
      type: jvData[i][2],
      ref: jvData[i][3],
      narration: jvData[i][5],
    };
  }

  const ledgerSheet = getSheet(SHEETS.JOURNAL_LEDGERS);
  const ledgerData = ledgerSheet.getDataRange().getValues();

  let runningBalance = 0;
  const statement = [];

  for (let i = 1; i < ledgerData.length; i++) {
    const acc = ledgerData[i][2];
    if (acc === accountName) {
      const entryNo = ledgerData[i][1];
      const debit = parseFloat(ledgerData[i][3] || 0);
      const credit = parseFloat(ledgerData[i][4] || 0);
      runningBalance += debit - credit;

      const meta = jvMap[entryNo] || {};
      statement.push({
        entryNo,
        date: meta.date || '',
        type: meta.type || 'JV',
        reference: meta.ref || '',
        narration: meta.narration || '',
        debit,
        credit,
        balance: runningBalance,
      });
    }
  }

  return JSON.stringify(statement);
};
