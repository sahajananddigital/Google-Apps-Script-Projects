import { useState } from 'react';
import { callGAS } from '../GAS';
import { formatINR, formatDate } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';
import ExpenseModal from './ExpenseModal';

const ExpenseManager = ({ expenses = [], accounts = [], settings = {}, onRefresh }) => {
  const safeExpenses = toSafeArray(expenses);
  const safeAccounts = toSafeArray(accounts);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [cloningExpense, setCloningExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [syncing, setSyncing] = useState(false);

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

  const handleSyncLedgers = async () => {
    setSyncing(true);
    try {
      const res = await callGAS('syncExpensesFromJournalLedgers');
      if (res && res.success) {
        alert(`Successfully synchronized ${res.count} expense records (Total: ${formatINR(res.totalAmount)})!`);
        if (onRefresh) onRefresh();
      } else {
        alert(res?.message || 'Failed to sync expenses');
      }
    } catch (err) {
      alert('Error syncing from ledgers: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Business Expenses</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track hosting servers, domain renewals, cloud subscriptions, software purchases, salaries, and office utilities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Expenses</span>
            <p className="text-xl font-black text-rose-700 font-mono">{formatINR(totalExpenseAmount)}</p>
          </div>

          <button
            onClick={handleSyncLedgers}
            disabled={syncing}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Sync all 101 historical expense records from JournalLedgers"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync from Ledgers'}
          </button>

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
            placeholder="Search by category, description, or reference ID (e.g. Divi Pro, Salary)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.slice(0, 6).map((cat) => (
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
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No expense records found. Click &quot;Sync from Ledgers&quot; to import complete historical records.
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
                        {exp.paidVia || exp.PaidVia || settings?.primaryBankName || 'Primary Bank'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{exp.description || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{exp.referenceTxnId || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-rose-700">
                      {formatINR(exp.amount || exp.Amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingExpense(exp)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setCloningExpense(exp)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold"
                          title="Clone Expense"
                        >
                          Clone
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Expense Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 md:p-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                  {viewingExpense.expenseNo || viewingExpense.ExpenseNo}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {viewingExpense.category || viewingExpense.Category}
                </h3>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Expense Amount</span>
                  <span className="text-2xl font-black font-mono text-rose-700">
                    {formatINR(viewingExpense.amount || viewingExpense.Amount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid Via</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-xs inline-block">
                    {viewingExpense.paidVia || viewingExpense.PaidVia || settings?.primaryBankName || 'Primary Bank'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Expense Date</span>
                  <span className="font-semibold text-slate-700">{formatDate(viewingExpense.date || viewingExpense.Date)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reference / UTR</span>
                  <span className="font-mono text-slate-700">{viewingExpense.referenceTxnId || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description / Narration</span>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {viewingExpense.description || 'No description provided'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCloningExpense(viewingExpense);
                  setViewingExpense(null);
                }}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Clone Expense
              </button>
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record / Clone Expense Modal */}
      {(showAddModal || cloningExpense) && (
        <ExpenseModal
          accounts={accounts}
          settings={settings}
          initialExpense={cloningExpense}
          onClose={() => {
            setShowAddModal(false);
            setCloningExpense(null);
          }}
          onExpenseAdded={() => {
            setShowAddModal(false);
            setCloningExpense(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default ExpenseManager;
