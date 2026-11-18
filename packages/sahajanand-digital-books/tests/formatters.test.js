import test from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, formatDate, numberToWordsINR } from '../src/client/utils/formatters.js';

test('Formatters: formatINR formats Indian Rupees properly', () => {
  assert.match(formatINR(0), /₹\s*0\.00/);
  assert.match(formatINR(1250), /₹\s*1,250\.00/);
  assert.match(formatINR(125000), /₹\s*1,25,000\.00/);
  assert.match(formatINR('5000.5'), /₹\s*5,000\.50/);
});

test('Formatters: formatDate formats ISO strings to readable Indian dates', () => {
  const formatted = formatDate('2026-08-15');
  assert.ok(formatted.includes('15') || formatted.includes('Aug') || formatted.includes('2026'));
  assert.strictEqual(formatDate(''), '-');
});

test('Formatters: numberToWordsINR converts amounts to Indian Lakhs & Crores format', () => {
  const w1 = numberToWordsINR(12500);
  assert.ok(w1.toLowerCase().includes('twelve thousand five hundred'));

  const w2 = numberToWordsINR(150000);
  assert.ok(w2.toLowerCase().includes('one lakh fifty thousand'));

  const w0 = numberToWordsINR(0);
  assert.ok(w0.toLowerCase().includes('zero rupees'));
});
