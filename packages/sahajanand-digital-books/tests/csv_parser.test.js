import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV } from '../src/client/utils/csvParser.js';

test('CSV Parser: parses basic rows and headers', () => {
  const csv = `InvoiceNo,Date,CustomerName,Amount
SINV-1001,2026-04-01,Acme Corp,5000
SINV-1002,2026-04-02,Beta Ltd,7500`;

  const parsed = parseCSV(csv);
  assert.strictEqual(parsed.length, 3);
  assert.deepStrictEqual(parsed[0], ['InvoiceNo', 'Date', 'CustomerName', 'Amount']);
  assert.deepStrictEqual(parsed[1], ['SINV-1001', '2026-04-01', 'Acme Corp', '5000']);
  assert.deepStrictEqual(parsed[2], ['SINV-1002', '2026-04-02', 'Beta Ltd', '7500']);
});

test('CSV Parser: handles commas inside quotes', () => {
  const csv = `CustomerName,Address,City
"Gurukul Academy, Nikol","505, Blueberry Complex, Near Gurukul Circle",Ahmedabad`;

  const parsed = parseCSV(csv);
  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[1][0], 'Gurukul Academy, Nikol');
  assert.strictEqual(parsed[1][1], '505, Blueberry Complex, Near Gurukul Circle');
  assert.strictEqual(parsed[1][2], 'Ahmedabad');
});

test('CSV Parser: handles escaped quotes ("")', () => {
  const csv = `Description,Rate
"Website ""Pro"" Edition",15000`;

  const parsed = parseCSV(csv);
  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[1][0], 'Website "Pro" Edition');
  assert.strictEqual(parsed[1][1], '15000');
});

test('CSV Parser: handles multiline fields within quotes', () => {
  const csv = `Terms,Notes
"1. Pay on receipt
2. Mention bill number","Internal note"`;

  const parsed = parseCSV(csv);
  assert.strictEqual(parsed.length, 2);
  assert.ok(parsed[1][0].includes('\n'));
  assert.strictEqual(parsed[1][1], 'Internal note');
});
