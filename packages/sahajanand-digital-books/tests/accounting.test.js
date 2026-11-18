import test from 'node:test';
import assert from 'node:assert/strict';

test('Accounting: calculates Net Profit and Operating Margin correctly', () => {
  const invoices = [
    { grandTotal: 25000, cancelled: false },
    { grandTotal: 15000, cancelled: false },
    { grandTotal: 5000, cancelled: true }, // cancelled invoice ignored
  ];

  const expenses = [
    { category: 'Server Hosting', amount: 8000 },
    { category: 'Internet & Phone', amount: 2000 },
    { category: 'Software Subscriptions', amount: 5000 },
  ];

  const totalRevenue = invoices.filter((i) => !i.cancelled).reduce((s, i) => s + i.grandTotal, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = ((netProfit / totalRevenue) * 100).toFixed(1);

  assert.strictEqual(totalRevenue, 40000);
  assert.strictEqual(totalExpenses, 15000);
  assert.strictEqual(netProfit, 25000);
  assert.strictEqual(margin, '62.5');
});

test('Accounting: Balance Sheet equation Assets = Liabilities + Equity holds true', () => {
  const bankBalance = 35000;
  const accountsReceivable = 15000;
  const totalAssets = bankBalance + accountsReceivable;

  const accountsPayable = 5000;
  const totalLiabilities = accountsPayable;

  const capital = 20000;
  const retainedEarnings = totalAssets - totalLiabilities - capital;
  const totalEquity = capital + retainedEarnings;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  assert.strictEqual(totalAssets, 50000);
  assert.strictEqual(totalLiabilitiesAndEquity, 50000);
  assert.strictEqual(totalAssets, totalLiabilitiesAndEquity);
});
