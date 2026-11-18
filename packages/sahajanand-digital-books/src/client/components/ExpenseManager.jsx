import { useState } from 'react';
import { formatINR, formatDate } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';
import ExpenseModal from './ExpenseModal';

const ExpenseManager = ({ expenses = [], accounts = [], settings = {}, onRefresh }) => {
  const safeExpenses = toSafeArray(expenses);
  const safeAccounts = toSafeArray(accounts);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = ['All', ...new Set(safeExpenses.map((e) => e?.category || e?.Category).filter(Boolean))];

  const filteredExpenses = safeExpenses.filter((e) => {
    if (!e) return false;
    const term = String(searchTerm || '').toLowerCase();
    const cat = String(e.category || e.Category || '').toLowerCase();
    const desc = String(e.description || '').toLowerCase();
    const no = String(e.expenseNo || e.ExpenseNo || '').toLowerCase();
    const ref = String(e.referenceTxnId || '').toLowerCase();

    const matchesSearch =
      cat.includes(term) ||
      desc.includes(term) ||
      no.includes(term) ||
      ref.includes(term);

    const matchesCat = categoryFilter === 'All' || (e.category || e.Category) === categoryFilter;

    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = safeExpenses.reduce((s, e) => s + parseFloat(e?.amount || e?.Amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Business Expenses</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track hosting servers, domain renewals, cloud subscriptions, office utilities, and vendor payouts
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Expenses</span>
            <p className="text-xl font-black text-rose-700 font-mono">{formatINR(totalExpenseAmount)}</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-100 transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Expense
          </button>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full md:w-auto relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by category, description, or reference ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all truncate max-w-[150px] ${
                categoryFilter === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px]">
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Paid Via</th>
                <th className="py-3 px-4">Description / Narration</th>
                <th className="py-3 px-4 font-mono">Reference / UTR</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">{exp.expenseNo || exp.ExpenseNo}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(exp.date || exp.Date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{exp.category || exp.Category}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {exp.paidVia || exp.PaidVia || 'Federal Bank'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">{exp.description || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{exp.referenceTxnId || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-rose-700">
                      {formatINR(exp.amount || exp.Amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <ExpenseModal
          accounts={accounts}
          settings={settings}
          onClose={() => setShowAddModal(false)}
          onExpenseAdded={() => {
            setShowAddModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default ExpenseManager;
