import test from 'node:test';
import assert from 'node:assert/strict';
import { SHEETS, SHEET_SCHEMAS } from '../src/server/db.js';

test('Database Schema: all 11 required sheet tables are defined', () => {
  const expectedSheets = [
    'Invoices',
    'InvoiceItems',
    'Payments',
    'Expenses',
    'JournalEntries',
    'JournalLedgers',
    'ChartOfAccounts',
    'Customers',
    'Items',
    'CompanySettings',
    'NumberSeries',
  ];

  expectedSheets.forEach((sheetName) => {
    assert.ok(Object.values(SHEETS).includes(sheetName), `SHEETS missing ${sheetName}`);
    assert.ok(SHEET_SCHEMAS[sheetName], `SHEET_SCHEMAS missing schema for ${sheetName}`);
    assert.ok(Array.isArray(SHEET_SCHEMAS[sheetName]), `${sheetName} headers must be an array`);
    assert.ok(SHEET_SCHEMAS[sheetName].length > 0, `${sheetName} headers cannot be empty`);
  });
});

test('Database Schema: Invoices and Payments have key accounting columns', () => {
  const invHeaders = SHEET_SCHEMAS[SHEETS.INVOICES];
  assert.ok(invHeaders.includes('InvoiceNo'));
  assert.ok(invHeaders.includes('CustomerName'));
  assert.ok(invHeaders.includes('GrandTotal'));
  assert.ok(invHeaders.includes('OutstandingAmount'));
  assert.ok(invHeaders.includes('Status'));

  const payHeaders = SHEET_SCHEMAS[SHEETS.PAYMENTS];
  assert.ok(payHeaders.includes('PaymentNo'));
  assert.ok(payHeaders.includes('InvoiceNo'));
  assert.ok(payHeaders.includes('Amount'));
  assert.ok(payHeaders.includes('Account'));
});

test('Database Schema: Chart of Accounts has hierarchical tree columns', () => {
  const coaHeaders = SHEET_SCHEMAS[SHEETS.ACCOUNTS];
  assert.ok(coaHeaders.includes('AccountName'));
  assert.ok(coaHeaders.includes('RootType'));
  assert.ok(coaHeaders.includes('ParentAccount'));
  assert.ok(coaHeaders.includes('AccountType'));
  assert.ok(coaHeaders.includes('IsGroup'));
});
