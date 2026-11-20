import { useState, useMemo } from 'react';
import { callGAS } from '../GAS';
import { toSafeArray } from '../utils/safeArray';
import { getCurrencySymbol } from '../utils/formatters';

const FALLBACK_CATEGORIES = [
  'Server Hosting & Infrastructure',
  'Domain Registration & DNS',
  'Software Subscriptions & SaaS',
  'Office Rent & Maintenance',
  'Utilities & Electricity',
  'Internet & Telecommunications',
  'Consulting & Subcontractor Fees',
  'Bank Charges & Payment Gateway Fees',
  'Marketing & Advertising',
  'General & Administrative Expenses',
];

const ExpenseModal = ({ accounts = [], settings = {}, onClose, onExpenseAdded, initialExpense = null }) => {
  const safeAccounts = toSafeArray(accounts);

  // 1. Dynamic Expense Categories from Chart of Accounts
  const categories = useMemo(() => {
    const list = new Set();
    safeAccounts
      .filter((a) => a && (a.rootType || a.RootType) === 'Expense' && !a.isGroup && !a.IsGroup)
      .forEach((a) => list.add(a.name || a.AccountName));

    if (list.size === 0) {
      FALLBACK_CATEGORIES.forEach((c) => list.add(c));
    }
    return Array.from(list);
  }, [safeAccounts]);

  // 2. Dynamic Paid Via Accounts from Settings & Chart of Accounts
  const paymentAccounts = useMemo(() => {
    const list = new Set();
    if (settings.primaryBankName) list.add(settings.primaryBankName);
    if (settings.secondaryBankName) list.add(settings.secondaryBankName);

    safeAccounts.forEach((a) => {
      if (!a) return;
      const name = a.name || a.AccountName;
      const root = String(a.rootType || a.RootType || '').toLowerCase();
      const type = String(a.accountType || a.AccountType || '').toLowerCase();
      const parent = String(a.parentAccount || a.ParentAccount || '').toLowerCase();
      const nameLower = String(name || '').toLowerCase();
      const isGroup = a.isGroup === true || a.isGroup === 1 || a.isGroup === '1' || a.IsGroup === true || a.IsGroup === 1 || a.IsGroup === '1';

      const isExpenseOrCharge =
        root === 'expense' ||
        root === 'liability' ||
        root === 'income' ||
        root === 'equity' ||
        parent.includes('charge') ||
        parent.includes('fee') ||
        parent.includes('expense') ||
        nameLower.includes('charge') ||
        nameLower.includes('fee');

      const isAsset = root === 'asset' || (!root && (type === 'bank' || type === 'cash'));

      if (!isGroup && isAsset && !isExpenseOrCharge) {
        if (
          type === 'bank' ||
          type === 'cash' ||
          parent === 'bank accounts' ||
          parent === 'cash in hand' ||
          parent.includes('bank account') ||
          parent.includes('cash in hand') ||
          ((parent === 'current assets' || parent === 'assets' || !parent) && (nameLower.includes('bank') || nameLower.includes('cash')))
        ) {
          if (name) list.add(name);
        }
      }
    });

    list.add('Cash In Hand');
    return Array.from(list).filter(Boolean);
  }, [safeAccounts, settings]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    category: initialExpense ? (initialExpense.category || initialExpense.Category || categories[0] || 'General Expense') : (categories[0] || 'General Expense'),
    customCategory: '',
    paidVia: initialExpense ? (initialExpense.paidVia || initialExpense.PaidVia || paymentAccounts[0] || 'Cash In Hand') : (paymentAccounts[0] || 'Cash In Hand'),
    amount: initialExpense ? parseFloat(initialExpense.amount || initialExpense.Amount || 0) : '',
    description: initialExpense ? (initialExpense.description || initialExpense.Description || '') : '',
    referenceTxnId: initialExpense ? (initialExpense.referenceTxnId || initialExpense.ReferenceTxnId || '') : '',
  });
  const [useCustomCat, setUseCustomCat] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    const finalCategory = useCustomCat && formData.customCategory.trim() ? formData.customCategory.trim() : formData.category;

    setLoading(true);
    try {
      const res = await callGAS('addExpense', {
        ...formData,
        category: finalCategory,
      });
      if (res.success) {
        if (onExpenseAdded) onExpenseAdded();
        onClose();
      } else {
        alert(res.message || 'Error recording expense');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialExpense ? `Clone Expense (${initialExpense.expenseNo || initialExpense.ExpenseNo})` : 'Record Business Expense'}
              </h3>
              <p className="text-xs text-slate-500">
                {initialExpense ? 'Duplicate this expense with same accounts and category' : 'Log operational costs, vendor payouts, and subscriptions'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-600 uppercase">Expense Category *</label>
              <button
                type="button"
                onClick={() => setUseCustomCat(!useCustomCat)}
                className="text-[11px] text-blue-600 font-bold hover:underline"
              >
                {useCustomCat ? '← Choose from list' : '+ Type custom category'}
              </button>
            </div>

            {useCustomCat ? (
              <input
                type="text"
                placeholder="Enter custom expense category..."
                value={formData.customCategory}
                onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
              />
            ) : (
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
              >
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Amount ({getCurrencySymbol(settings.currency)}) *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Expense Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Paid Through *</label>
              <select
                value={formData.paidVia}
                onChange={(e) => setFormData({ ...formData, paidVia: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs font-medium"
              >
                {paymentAccounts.map((acc, i) => (
                  <option key={i} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Reference / Txn ID</label>
              <input
                type="text"
                placeholder="UTR / UPI Ref / Cheque"
                value={formData.referenceTxnId}
                onChange={(e) => setFormData({ ...formData, referenceTxnId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 uppercase">Description / Vendor Remarks</label>
            <textarea
              rows="2"
              placeholder="e.g. Monthly server invoice or office supplies"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all text-xs disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
