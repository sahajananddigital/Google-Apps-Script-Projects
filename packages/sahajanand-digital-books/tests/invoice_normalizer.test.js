import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInvoiceItem, normalizeInvoiceItems } from '../src/client/utils/invoiceNormalizer.js';

test('InvoiceNormalizer: correctly maps Google Sheets uppercase keys (ItemName, Rate, Amount)', () => {
  const gSheetsRow = {
    ID: 'ITEM-1700000000000-1',
    InvoiceNo: 'SINV-1001',
    ItemName: 'Full Stack Web Development Diploma',
    Description: '6 Months intensive curriculum including MERN stack',
    HSN_SAC: 999293,
    Quantity: 1,
    Rate: 35000,
    Amount: 35000,
  };

  const normalized = normalizeInvoiceItem(gSheetsRow);

  assert.equal(normalized.itemName, 'Full Stack Web Development Diploma');
  assert.equal(normalized.ItemName, 'Full Stack Web Development Diploma');
  assert.equal(normalized.item, 'Full Stack Web Development Diploma');
  assert.equal(normalized.rate, 35000);
  assert.equal(normalized.Rate, 35000);
  assert.equal(normalized.amount, 35000);
  assert.equal(normalized.Amount, 35000);
  assert.equal(normalized.quantity, 1);
  assert.equal(normalized.Quantity, 1);
  assert.equal(normalized.hsnCode, '999293');
  assert.equal(normalized.HSN_SAC, '999293');
  assert.equal(normalized.description, '6 Months intensive curriculum including MERN stack');
});

test('InvoiceNormalizer: maps Frappe Books imported item records', () => {
  const frappeItem = {
    ID: '4pgm84-m4mpc1a9',
    InvoiceNo: 'SINV-1001',
    ItemName: 'Internship Program',
    Description: '',
    HSN_SAC: 9992,
    Quantity: 2.0,
    Rate: 1500.0,
    Amount: 3000.0,
  };

  const normalized = normalizeInvoiceItem(frappeItem);

  assert.equal(normalized.ItemName, 'Internship Program');
  assert.equal(normalized.item, 'Internship Program');
  assert.equal(normalized.rate, 1500.0);
  assert.equal(normalized.amount, 3000.0);
  assert.equal(normalized.quantity, 2);
  assert.equal(normalized.duration, '2 Courses');
  assert.equal(normalized.hsnCode, '9992');
});

test('InvoiceNormalizer: correctly maps UI state lowercase/camelCase keys', () => {
  const uiItem = {
    item: 'Data Science & AI Certification',
    description: 'Python, Pandas, ML Models',
    hsnCode: '998313',
    quantity: 3,
    unit: 'Months',
    rate: 12000,
    amount: 36000,
  };

  const normalized = normalizeInvoiceItem(uiItem);

  assert.equal(normalized.ItemName, 'Data Science & AI Certification');
  assert.equal(normalized.item, 'Data Science & AI Certification');
  assert.equal(normalized.rate, 12000);
  assert.equal(normalized.Rate, 12000);
  assert.equal(normalized.amount, 36000);
  assert.equal(normalized.Amount, 36000);
  assert.equal(normalized.quantity, 3);
  assert.equal(normalized.unit, 'Months');
  assert.equal(normalized.duration, 'Python, Pandas, ML Models');
  assert.equal(normalized.hsnCode, '998313');
  assert.equal(normalized.HSN_SAC, '998313');
});

test('InvoiceNormalizer: creates meaningful fallback line item when items array is empty', () => {
  const invoice = {
    InvoiceNo: 'SINV-2005',
    CustomerName: 'Rajesh Patel',
    GrandTotal: 18500,
    NetTotal: 18500,
    remarks: 'Annual Vedic Sanskrit & Computer Studies',
  };

  const normalizedList = normalizeInvoiceItems([], invoice);

  assert.equal(normalizedList.length, 1);
  const fallback = normalizedList[0];
  assert.equal(fallback.ItemName, 'Annual Vedic Sanskrit & Computer Studies');
  assert.equal(fallback.item, 'Annual Vedic Sanskrit & Computer Studies');
  assert.equal(fallback.rate, 18500);
  assert.equal(fallback.amount, 18500);
  assert.equal(fallback.quantity, 1);
  assert.equal(fallback.duration, '1 Term / Year');
  assert.equal(fallback.hsnCode, '999293');
});
