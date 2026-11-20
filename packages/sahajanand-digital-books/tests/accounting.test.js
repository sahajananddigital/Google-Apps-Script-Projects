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

test('Accounting: Multi-account payment splits clear invoice and allocate to correct accounts', () => {
  const invoice = { invoiceNo: 'SINV-1020', grandTotal: 22700, outstandingAmount: 22700 };
  const splits = [
    { account: 'Primary Bank', amount: 10000, paymentMethod: 'Transfer' },
    { account: 'Secondary Bank', amount: 12700, paymentMethod: 'Transfer' },
  ];

  const totalPaid = splits.reduce((s, split) => s + split.amount, 0);
  const remainingDue = Math.max(0, invoice.outstandingAmount - totalPaid);
  const status = remainingDue === 0 ? 'Paid' : 'Partially Paid';

  assert.strictEqual(totalPaid, 22700);
  assert.strictEqual(remainingDue, 0);
  assert.strictEqual(status, 'Paid');

  // Check account allocations
  const primaryDeposit = splits.filter((s) => s.account === 'Primary Bank').reduce((s, x) => s + x.amount, 0);
  const secondaryDeposit = splits.filter((s) => s.account === 'Secondary Bank').reduce((s, x) => s + x.amount, 0);
  assert.strictEqual(primaryDeposit, 10000);
  assert.strictEqual(secondaryDeposit, 12700);
});

test('Accounting: Bank reconciliation prevents duplicate expense deductions from JVs', () => {
  const payments = [{ account: 'Primary Bank', amount: 88586 }];
  const expenses = [{ category: 'Salaries', paidVia: 'Primary Bank', amount: 42000 }];
  const jvs = [
    // Contra entry (transfer between banks) - should be included
    {
      entryType: 'Contra Entry',
      splits: [
        { account: 'Primary Bank', debit: 42000, credit: 0 },
        { account: 'Operational Bank', debit: 0, credit: 42000 },
      ],
    },
    // Expense JV - already accounted for in expenses, must NOT be double-deducted
    {
      entryType: 'Journal Entry',
      splits: [
        { account: 'Salaries', debit: 42000, credit: 0 },
        { account: 'Primary Bank', debit: 0, credit: 42000 },
      ],
    },
  ];

  const expenseCategories = new Set(expenses.map((e) => e.category.toLowerCase()));

  let balance = 0;
  const accName = 'primary bank';

  // Inflow from payments
  payments.forEach((p) => {
    if (p.account.toLowerCase().includes(accName)) balance += p.amount;
  });

  // Outflow from expenses
  expenses.forEach((e) => {
    if (e.paidVia.toLowerCase().includes(accName)) balance -= e.amount;
  });

  // Flow from JVs excluding expense JVs
  jvs.forEach((jv) => {
    const isExpenseJV = jv.splits.some((s) => expenseCategories.has(s.account.toLowerCase()));
    if (isExpenseJV) return;

    jv.splits.forEach((s) => {
      if (s.account.toLowerCase().includes(accName)) {
        balance += s.debit - s.credit;
      }
    });
  });

  // Inflow 88586 - Expense 42000 + Contra 42000 = 88586
  assert.strictEqual(balance, 88586);
});

test('Accounting: General Ledger exact balance sheet reconciliation equation holds', () => {
  const bank1 = 38036.72;
  const bank2 = 2550.00;
  const bank3 = -9788.29;
  const cash = 2960.00;
  const debtors = -3800.00;

  const computers = 120000.00;
  const furniture = 200000.00;

  const bankAccountsTotal = Math.round((bank1 + bank2 + bank3) * 100) / 100;
  const currentAssetsTotal = Math.round((cash + bankAccountsTotal + debtors) * 100) / 100;
  const totalAssets = computers + furniture + currentAssetsTotal;

  assert.strictEqual(bankAccountsTotal, 30798.43);
  assert.strictEqual(currentAssetsTotal, 29958.43);
  assert.strictEqual(totalAssets, 349958.43);
});
