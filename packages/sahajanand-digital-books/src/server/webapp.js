import { getSpreadsheet, SHEET_SCHEMAS } from './db.js';
import { syncExpensesFromJournalLedgers } from './expense.js';
import { syncCustomerOutstanding } from './customer.js';

export const doGet = (e) => {
  if (e && e.parameter && e.parameter.api === 'syncAll') {
    const expResult = syncExpensesFromJournalLedgers();
    const custResult = syncCustomerOutstanding();
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      expenses: expResult,
      customers: custResult,
    }, null, 2)).setMimeType(ContentService.MimeType.JSON);
  }
  if (e && e.parameter && e.parameter.api === 'inspect') {
    const ss = getSpreadsheet();
    const result = {
      spreadsheetId: ss ? ss.getId() : null,
      spreadsheetName: ss ? ss.getName() : null,
      sheets: []
    };
    if (ss) {
      const sheets = ss.getSheets();
      for (const s of sheets) {
        const lastRow = s.getLastRow();
        const lastCol = s.getLastColumn();
        const headers = lastRow > 0 && lastCol > 0 ? s.getRange(1, 1, 1, Math.min(lastCol, 20)).getValues()[0] : [];
        result.sheets.push({
          name: s.getName(),
          sheetId: s.getSheetId(),
          lastRow: lastRow,
          lastColumn: lastCol,
          headers: headers,
          expectedHeaders: SHEET_SCHEMAS[s.getName()] || []
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e && e.parameter && e.parameter.api === 'audit') {
    const ss = getSpreadsheet();
    const auditReport = {
      timestamp: new Date().toISOString(),
      spreadsheetId: ss ? ss.getId() : null,
      spreadsheetName: ss ? ss.getName() : null,
      checks: {}
    };

    if (ss) {
      // 1. JournalLedgers & JournalEntries balance check
      const jlSheet = ss.getSheetByName('JournalLedgers');
      const jeSheet = ss.getSheetByName('JournalEntries');
      if (jlSheet) {
        const jlData = jlSheet.getDataRange().getValues();
        const jlRows = jlData.slice(1);
        let totalDebit = 0;
        let totalCredit = 0;
        const entryBalances = {};

        jlRows.forEach((row) => {
          const entryNo = row[1];
          const debit = parseFloat(row[3]) || 0;
          const credit = parseFloat(row[4]) || 0;
          totalDebit += debit;
          totalCredit += credit;
          if (!entryBalances[entryNo]) entryBalances[entryNo] = { debit: 0, credit: 0 };
          entryBalances[entryNo].debit += debit;
          entryBalances[entryNo].credit += credit;
        });

        const unbalancedEntries = [];
        for (const [entryNo, b] of Object.entries(entryBalances)) {
          if (Math.abs(b.debit - b.credit) > 0.05) {
            unbalancedEntries.push({ entryNo, debit: b.debit, credit: b.credit, diff: b.debit - b.credit });
          }
        }

        auditReport.checks.journalLedgers = {
          gid: jlSheet.getSheetId(),
          totalRows: jlRows.length,
          totalDebit: Math.round(totalDebit * 100) / 100,
          totalCredit: Math.round(totalCredit * 100) / 100,
          difference: Math.round((totalDebit - totalCredit) * 100) / 100,
          isBalanced: Math.abs(totalDebit - totalCredit) < 0.05,
          unbalancedEntriesCount: unbalancedEntries.length,
          unbalancedEntries: unbalancedEntries.slice(0, 10),
          sampleRows: jlRows.slice(0, 5)
        };
      }

      // 2. Invoices & InvoiceItems audit
      const invSheet = ss.getSheetByName('Invoices');
      if (invSheet) {
        const invData = invSheet.getDataRange().getValues();
        const invRows = invData.slice(1);
        let totalInvoiced = 0;
        let totalOutstanding = 0;
        const calculationMismatches = [];

        invRows.forEach((row) => {
          const invNo = row[0];
          const net = parseFloat(row[4]) || 0;
          const disc = parseFloat(row[5]) || 0;
          const grand = parseFloat(row[6]) || 0;
          const out = parseFloat(row[7]) || 0;
          totalInvoiced += grand;
          totalOutstanding += out;
          if (Math.abs((net - disc) - grand) > 0.05) {
            calculationMismatches.push({ invNo, net, disc, grand, expected: net - disc });
          }
        });

        auditReport.checks.invoices = {
          gid: invSheet.getSheetId(),
          totalInvoices: invRows.length,
          totalInvoiced: Math.round(totalInvoiced * 100) / 100,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          calculationMismatches,
          sampleRows: invRows.slice(0, 3)
        };
      }

      // 3. Payments audit
      const paySheet = ss.getSheetByName('Payments');
      if (paySheet) {
        const payData = paySheet.getDataRange().getValues();
        const payRows = payData.slice(1);
        let totalPaid = 0;
        payRows.forEach((row) => {
          totalPaid += parseFloat(row[4]) || 0;
        });
        auditReport.checks.payments = {
          gid: paySheet.getSheetId(),
          totalPayments: payRows.length,
          totalPaidAmount: Math.round(totalPaid * 100) / 100,
          sampleRows: payRows.slice(0, 3)
        };
      }

      // 4. Expenses audit
      const expSheet = ss.getSheetByName('Expenses');
      if (expSheet) {
        const expData = expSheet.getDataRange().getValues();
        const expRows = expData.slice(1);
        let totalExpenses = 0;
        expRows.forEach((row) => {
          totalExpenses += parseFloat(row[4]) || 0;
        });
        auditReport.checks.expenses = {
          gid: expSheet.getSheetId(),
          totalExpensesCount: expRows.length,
          totalExpenseAmount: Math.round(totalExpenses * 100) / 100,
          sampleRows: expRows.slice(0, 3)
        };
      }

      // 5. ChartOfAccounts
      const coaSheet = ss.getSheetByName('ChartOfAccounts');
      if (coaSheet) {
        const coaRows = coaSheet.getDataRange().getValues().slice(1);
        const groups = coaRows.filter((r) => r[4] === true || String(r[4]).toUpperCase() === 'TRUE').length;
        const ledgers = coaRows.length - groups;
        auditReport.checks.chartOfAccounts = {
          gid: coaSheet.getSheetId(),
          totalAccounts: coaRows.length,
          groups,
          ledgers,
          sampleRows: coaRows.slice(0, 5)
        };
      }
    }

    return ContentService.createTextOutput(JSON.stringify(auditReport, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Dynamic spreadsheet connection endpoint
  if (e && e.parameter && e.parameter.set_sheet) {
    try {
      const cleanId = String(e.parameter.set_sheet).trim().replace(/^https:\/\/docs\.google\.com\/spreadsheets\/d\//, '').replace(/\/.*$/, '');
      PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', cleanId);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: `Connected to Spreadsheet ID: ${cleanId}` }, null, 2))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }, null, 2))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  let title = 'Digital Books - Accounts & Invoices';
  try {
    const ss = getSpreadsheet();
    if (ss) {
      const setSheet = ss.getSheetByName(SHEETS.SETTINGS);
      if (setSheet) {
        const rows = setSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === 'companyName' && rows[i][1]) {
            title = `${rows[i][1]} - Accounts & Invoices`;
            break;
          }
        }
      }
    }
  } catch (err) {}

  const fileName = 'index.html';
  return HtmlService.createHtmlOutputFromFile(fileName)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
};
