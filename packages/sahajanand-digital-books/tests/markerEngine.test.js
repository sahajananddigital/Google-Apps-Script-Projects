import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceMarkers, buildInvoiceMarkerContext, AVAILABLE_MARKERS } from '../src/client/utils/markerEngine.js';

test('MarkerEngine: buildInvoiceMarkerContext builds complete context dictionary', () => {
  const invoice = {
    name: 'SINV-1061',
    date: '2026-09-16',
    grandTotal: 1359,
    netTotal: 1359,
    outstandingAmount: 0,
    status: 'Paid',
  };
  const customer = {
    name: 'Gurukul Academy',
    city: 'Ahmedabad',
    state: 'Gujarat',
    gstin: '24AAAAA0000A1Z5',
  };
  const settings = {
    companyName: 'Modern Digital Books',
    phone: '+91 98000 00000',
    primaryBankName: 'State Bank of India',
    primaryAccountNo: '123456789012',
  };

  const ctx = buildInvoiceMarkerContext(invoice, customer, settings);
  assert.strictEqual(ctx.invoiceNo, 'SINV-1061');
  assert.strictEqual(ctx.companyName, 'Modern Digital Books');
  assert.strictEqual(ctx.customerName, 'Gurukul Academy');
  assert.strictEqual(ctx.primaryBankName, 'State Bank of India');
  assert.strictEqual(ctx.primaryAccountNo, '123456789012');
  assert.strictEqual(ctx.paymentStatus, 'PAID');
});

test('MarkerEngine: replaceMarkers replaces all valid {{tags}} in text', () => {
  const template = 'Dear {{customerName}}, thank you for paying {{grandTotal}} to {{companyName}} via {{primaryBankName}}.';
  const ctx = {
    customerName: 'Shree Swaminarayan Gurukul',
    grandTotal: '₹25,000.00',
    companyName: 'Modern Digital Books',
    primaryBankName: 'HDFC Bank',
  };

  const result = replaceMarkers(template, ctx);
  assert.strictEqual(
    result,
    'Dear Shree Swaminarayan Gurukul, thank you for paying ₹25,000.00 to Modern Digital Books via HDFC Bank.'
  );
});

test('MarkerEngine: replaceMarkers leaves unknown markers untouched', () => {
  const template = 'Hello {{unknownTag}} and {{customerName}}';
  const result = replaceMarkers(template, { customerName: 'Student 101' });
  assert.strictEqual(result, 'Hello {{unknownTag}} and Student 101');
});

test('MarkerEngine: AVAILABLE_MARKERS contains standard tag groups', () => {
  assert.ok(AVAILABLE_MARKERS.length >= 4);
  const allTags = AVAILABLE_MARKERS.flatMap((g) => g.tags);
  assert.ok(allTags.includes('companyName'));
  assert.ok(allTags.includes('invoiceNo'));
  assert.ok(allTags.includes('grandTotal'));
  assert.ok(allTags.includes('primaryBankName'));
});
