import { getSheet, SHEETS, getRowsAsObjects, getNextSeriesNumber } from './db.js';

/**
 * Get Chart of Accounts
 */
export const getChartOfAccounts = () => {
  const accounts = getRowsAsObjects(SHEETS.ACCOUNTS);
  return JSON.stringify(accounts);
};

/**
 * Get Journal Entries with account debit/credit splits
 */
export const getJournalEntries = () => {
  const entries = getRowsAsObjects(SHEETS.JOURNAL_ENTRIES);
  const splits = getRowsAsObjects(SHEETS.JOURNAL_LEDGERS);

  const splitsByEntry = {};
  splits.forEach((s) => {
    if (!splitsByEntry[s.EntryNo]) {
      splitsByEntry[s.EntryNo] = [];
    }
    splitsByEntry[s.EntryNo].push(s);
  });

  const fullEntries = entries.map((e) => ({
    ...e,
    splits: splitsByEntry[e.EntryNo] || [],
  }));

  return JSON.stringify(fullEntries.reverse());
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
      runningBalance += (debit - credit);

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
