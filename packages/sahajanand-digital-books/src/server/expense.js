import { getSheet, SHEETS, getRowsAsObjects, getNextSeriesNumber } from './db.js';

/**
 * Get all expenses, newest first
 */
export const getExpenses = () => {
  const expenses = getRowsAsObjects(SHEETS.EXPENSES);
  return JSON.stringify(expenses.reverse());
};

/**
 * Add a new Expense record
 */
export const addExpense = (expenseData) => {
  const sheet = getSheet(SHEETS.EXPENSES);
  const expenseNo = expenseData.expenseNo || getNextSeriesNumber('Expense');
  const date = expenseData.date || new Date().toISOString().substring(0, 10);
  const category = expenseData.category || 'General Expense';
  const paidVia = expenseData.paidVia || 'Federal Bank';
  const amount = parseFloat(expenseData.amount || 0);
  const description = expenseData.description || '';
  const refTxnId = expenseData.referenceTxnId || '';
  const createdAt = new Date().toISOString();

  sheet.appendRow([
    expenseNo,
    date,
    category,
    paidVia,
    amount,
    description,
    refTxnId,
    createdAt,
  ]);

  return { success: true, expenseNo };
};
