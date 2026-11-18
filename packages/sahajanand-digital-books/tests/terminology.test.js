import test from 'node:test';
import assert from 'node:assert/strict';
import { getTerminology } from '../src/client/utils/terminology.js';

test('Terminology: returns business defaults when mode is business', () => {
  const t = getTerminology('business');
  assert.strictEqual(t.isInstitute, false);
  assert.strictEqual(t.invoice, 'Invoice');
  assert.strictEqual(t.invoices, 'Invoices');
  assert.strictEqual(t.customer, 'Customer');
  assert.strictEqual(t.customers, 'Customers');
  assert.strictEqual(t.item, 'Service / Item');
  assert.strictEqual(t.items, 'Services & Products');
});

test('Terminology: returns institute / Gurukul labels when mode is institute', () => {
  const t = getTerminology('institute');
  assert.strictEqual(t.isInstitute, true);
  assert.strictEqual(t.invoice, 'Fee Receipt');
  assert.strictEqual(t.invoices, 'Fee Receipts');
  assert.strictEqual(t.customer, 'Student / Donor');
  assert.strictEqual(t.customers, 'Students / Donors');
  assert.strictEqual(t.item, 'Fee Head');
  assert.strictEqual(t.items, 'Fee Heads & Services');
});
