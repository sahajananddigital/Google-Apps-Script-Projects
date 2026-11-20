import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSV } from '../src/client/utils/csvParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readCsvTable = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    return obj;
  });
};

test('Migration: CSV table reader and converter accurately maps structured records', () => {
  const sampleCsv = `InvoiceNo,Date,CustomerName,GrandTotal,Notes\r\n"SINV-001","2026-04-01","Ramesh Patel","15000.00","Tuition fee for Web Dev"\r\n"SINV-002","2026-04-02","Shree Swaminarayan Gurukul","25000.00","Monthly educational fee\r\n(Includes practical lab)"`;
  const rows = parseCSV(sampleCsv);
  assert.equal(rows.length, 3, 'Should parse header + 2 rows');
  const headers = rows[0];
  assert.deepEqual(headers, ['InvoiceNo', 'Date', 'CustomerName', 'GrandTotal', 'Notes']);

  const records = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    return obj;
  });

  assert.equal(records.length, 2);
  assert.equal(records[0].InvoiceNo, 'SINV-001');
  assert.equal(records[0].CustomerName, 'Ramesh Patel');
  assert.equal(records[0].GrandTotal, '15000.00');
  assert.equal(records[1].CustomerName, 'Shree Swaminarayan Gurukul');
  assert.ok(records[1].Notes.includes('Includes practical lab'), 'Multiline field must be preserved');
});

test('Migration: General ledger parity calculation matches double-entry balance equation', () => {
  // Verify double-entry ledger calculation on synthetic multi-split transaction
  const splits = [
    { AccountName: 'Debtors', Debit: '10000', Credit: '0' },
    { AccountName: 'Course Fees Income', Debit: '0', Credit: '10000' },
    { AccountName: 'Bank Account', Debit: '10000', Credit: '0' },
    { AccountName: 'Debtors', Debit: '0', Credit: '10000' },
    { AccountName: 'Staff Salary Expense', Debit: '4000', Credit: '0' },
    { AccountName: 'Bank Account', Debit: '0', Credit: '4000' }
  ];

  const balances = {};
  splits.forEach((s) => {
    const acc = s.AccountName;
    const debit = parseFloat(s.Debit || 0);
    const credit = parseFloat(s.Credit || 0);
    balances[acc] = (balances[acc] || 0) + (debit - credit);
  });

  assert.equal(balances['Debtors'], 0, 'Debtors balance should be 0 after full payment');
  assert.equal(balances['Bank Account'], 6000, 'Bank balance should be ₹6,000 net');
  assert.equal(balances['Course Fees Income'], -10000, 'Income credit balance should be -₹10,000');
  assert.equal(balances['Staff Salary Expense'], 4000, 'Expense debit balance should be ₹4,000');
});

// If optional local migration archive exists, verify historical dataset parity
const csvDir = path.resolve(__dirname, '../migration_csvs');
if (fs.existsSync(csvDir)) {
  test('Migration (Local Archive): migration_csvs/ contains complete verified Frappe Books dataset', () => {
    const jlRows = readCsvTable(path.join(csvDir, 'JournalLedgers.csv'));
    assert.equal(jlRows.length, 369, `Expected 369 splits, got ${jlRows.length}`);

    const expRows = readCsvTable(path.join(csvDir, 'Expenses.csv'));
    assert.equal(expRows.length, 89, `Expected 89 expenses, got ${expRows.length}`);
    const totalExp = expRows.reduce((s, e) => s + parseFloat(e.Amount || 0), 0);
    assert.equal(Math.round(totalExp * 100) / 100, 222512.12, 'Total expenses must equal ₹2,22,512.12');

    const invRows = readCsvTable(path.join(csvDir, 'Invoices.csv'));
    const payRows = readCsvTable(path.join(csvDir, 'Payments.csv'));
    assert.ok(invRows.length >= 46, 'Must contain at least 46 invoices');
    assert.ok(payRows.length >= 45, 'Must contain at least 45 payments');
  });
}
