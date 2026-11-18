import { useState } from 'react';
import { formatINR, formatDate } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';
import BankBalanceWidget from './BankBalanceWidget';
import ExpenseModal from './ExpenseModal';

const Dashboard = ({
  invoices = [],
  payments = [],
  expenses = [],
  journalEntries = [],
  customers = [],
  accounts = [],
  settings = {},
  onViewInvoice,
  onRefresh,
}) => {
  const safeInvoices = toSafeArray(invoices);
  const safePayments = toSafeArray(payments);
  const safeExpenses = toSafeArray(expenses);
  const safeJournalEntries = toSafeArray(journalEntries);
  const safeCustomers = toSafeArray(customers);
  const safeAccounts = toSafeArray(accounts);

  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Financial calculations
  const totalInvoiced = safeInvoices.reduce((s, i) => s + parseFloat(i?.grandTotal || i?.GrandTotal || 0), 0);
  const totalOutstanding = safeInvoices.reduce((s, i) => {
    if (!i || i.cancelled || i.Status === 'Cancelled') return s;
    return s + parseFloat(i.outstandingAmount !== undefined ? i.outstandingAmount : (i.OutstandingAmount || 0));
  }, 0);
  const totalCollected = safePayments.reduce((s, p) => s + parseFloat(p?.amount || p?.Amount || 0), 0) || Math.max(0, totalInvoiced - totalOutstanding);
  const totalExpenses = safeExpenses.reduce((s, e) => s + parseFloat(e?.amount || e?.Amount || 0), 0);
  const netProfit = totalCollected - totalExpenses;

  return (
    <div className="space-y-6">
      {/* 1. Top Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales Invoiced */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatINR(totalInvoiced)}</p>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{invoices.length} total bills</p>
        </div>

        {/* Collections */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Collected</p>
            <p className="text-xl font-black text-emerald-700 mt-1 font-mono">{formatINR(totalCollected)}</p>
          </div>
          <p className="text-[10px] text-emerald-500 mt-2">{payments.length} receipts cleared</p>
        </div>

        {/* Expenses */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Expenses</p>
            <p className="text-xl font-black text-rose-700 mt-1 font-mono">{formatINR(totalExpenses)}</p>
          </div>
          <p className="text-[10px] text-rose-500 mt-2">{expenses.length} expense entries</p>
        </div>

        {/* Net Cash Flow / Profit */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Net Cash Flow</p>
            <p className="text-xl font-black text-indigo-900 mt-1 font-mono">{formatINR(netProfit)}</p>
          </div>
          <p className="text-[10px] text-indigo-400 mt-2">Revenue minus Expenses</p>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Due</p>
            <p className="text-xl font-black text-amber-700 mt-1 font-mono">{formatINR(totalOutstanding)}</p>
          </div>
          <p className="text-[10px] text-amber-500 mt-2">Unpaid customer invoices</p>
        </div>
      </div>

      {/* 2. Dynamic Bank Balance Widget */}
      <BankBalanceWidget
        payments={payments}
        expenses={expenses}
        journalEntries={journalEntries}
        accounts={accounts}
        settings={settings}
      />

      {/* 3. Quick Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-700">Accounting Operations:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            + Record Expense
          </button>
        </div>
      </div>

      {/* 4. Split Recent Invoices & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Recent Sales Invoices</h3>
            <span className="text-xs text-slate-400">Latest 5</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {safeInvoices.length === 0 ? (
              <p className="py-8 text-center text-slate-400">No invoices yet.</p>
            ) : (
              safeInvoices.slice(0, 5).map((inv, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inv.name || inv.InvoiceNo}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(inv.date || inv.Date)}</span>
                    </div>
                    <p className="text-slate-600 font-medium truncate max-w-[200px]">{inv.party || inv.CustomerName}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900">{formatINR(inv.grandTotal || inv.GrandTotal)}</p>
                      <span
                        className={`text-[9px] font-bold ${
                          parseFloat(inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.OutstandingAmount || 0)) <= 0
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {parseFloat(inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.OutstandingAmount || 0)) <= 0 ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <button
                      onClick={() => onViewInvoice && onViewInvoice(inv)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-blue-600"
                      title="View Invoice"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Recent Expenses</h3>
            <span className="text-xs text-slate-400">Latest 5</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {safeExpenses.length === 0 ? (
              <p className="py-8 text-center text-slate-400">No expenses recorded yet.</p>
            ) : (
              safeExpenses.slice(0, 5).map((exp, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{exp.expenseNo || exp.ExpenseNo}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(exp.date || exp.Date)}</span>
                    </div>
                    <p className="text-slate-700 font-semibold truncate max-w-[220px]">{exp.category || exp.Category}</p>
                    {exp.description && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{exp.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-rose-700 font-mono">{formatINR(exp.amount || exp.Amount)}</p>
                    <p className="text-[10px] text-slate-400">{exp.paidVia || exp.PaidVia || 'Bank'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          accounts={accounts}
          settings={settings}
          onClose={() => setShowExpenseModal(false)}
          onExpenseAdded={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
