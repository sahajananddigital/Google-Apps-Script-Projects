import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Templates: Sample templates dataset contains all 11 tables with valid sample rows', () => {
  const jsonPath = path.resolve(__dirname, '../src/client/utils/sampleTemplateData.json');
  assert.ok(fs.existsSync(jsonPath), 'sampleTemplateData.json must exist');

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const expectedTables = [
    'Invoices',
    'InvoiceItems',
    'Payments',
    'Expenses',
    'Customers',
    'Items',
    'ChartOfAccounts',
    'JournalEntries',
    'JournalLedgers',
    'CompanySettings',
    'NumberSeries',
  ];

  expectedTables.forEach((tbl) => {
    assert.ok(data[tbl], `Table "${tbl}" must be present in sample data`);
    assert.ok(Array.isArray(data[tbl]), `Table "${tbl}" must be a 2D array`);
    assert.ok(data[tbl].length >= 2, `Table "${tbl}" must contain headers and at least 1 sample row`);
    assert.ok(data[tbl][0].length >= 2, `Table "${tbl}" must have column headers`);
  });

  // Verify Invoices sample has critical columns
  const invHeaders = data.Invoices[0];
  ['InvoiceNo', 'Date', 'CustomerName', 'GrandTotal'].forEach((col) => {
    assert.ok(invHeaders.includes(col), `Invoices header must include "${col}"`);
  });

  // Verify Payments sample has critical columns
  const payHeaders = data.Payments[0];
  ['PaymentNo', 'Date', 'CustomerName', 'Amount', 'Account'].forEach((col) => {
    assert.ok(payHeaders.includes(col), `Payments header must include "${col}"`);
  });

  // Verify Expenses sample has critical columns
  const expHeaders = data.Expenses[0];
  ['ExpenseNo', 'Date', 'Category', 'PaidVia', 'Amount'].forEach((col) => {
    assert.ok(expHeaders.includes(col), `Expenses header must include "${col}"`);
  });
});

test('Templates: Excel template base64 is present and valid', () => {
  const b64Path = path.resolve(__dirname, '../src/client/utils/sampleExcelBase64.js');
  assert.ok(fs.existsSync(b64Path), 'sampleExcelBase64.js must exist');

  const content = fs.readFileSync(b64Path, 'utf8');
  assert.ok(content.includes('SAMPLE_EXCEL_B64'), 'Must export SAMPLE_EXCEL_B64');
  assert.ok(content.length > 5000, 'SAMPLE_EXCEL_B64 must have substantial length (> 5KB)');
});
