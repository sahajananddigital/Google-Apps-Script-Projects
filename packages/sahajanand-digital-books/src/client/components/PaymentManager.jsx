import { useState, useMemo } from 'react';
import { callGAS } from '../GAS';
import { formatINR, formatDate } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';

const PaymentManager = ({
  payments = [],
  invoices = [],
  customers = [],
  accounts = [],
  settings = {},
  onPaymentAdded,
  initialInvoice = null,
  onCloseModal = null,
}) => {
  const safeAccounts = toSafeArray(accounts);
  const safeInvoices = toSafeArray(invoices);
  const safeCustomers = toSafeArray(customers);
  const safePayments = toSafeArray(payments);

  // Dynamically resolve available Bank and Cash accounts
  const depositAccounts = useMemo(() => {
    const list = new Set();
    // 1. From settings
    if (settings.primaryBankName) list.add(settings.primaryBankName);
    if (settings.secondaryBankName) list.add(settings.secondaryBankName);

    // 2. From Chart of Accounts
    safeAccounts.forEach((a) => {
      if (!a) return;
      const name = a.name || a.AccountName;
      const type = String(a.accountType || a.AccountType || '').toLowerCase();
      const parent = String(a.parentAccount || a.ParentAccount || '').toLowerCase();
      if (!a.isGroup && (type === 'bank' || type === 'cash' || parent.includes('bank') || parent.includes('cash'))) {
        if (name) list.add(name);
      }
    });

    list.add('Cash In Hand');
    return Array.from(list).filter(Boolean);
  }, [safeAccounts, settings]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    customerName: initialInvoice ? (initialInvoice.party || initialInvoice.CustomerName) : (safeCustomers[0]?.name || safeCustomers[0]?.CustomerName || ''),
    invoiceNo: initialInvoice ? (initialInvoice.name || initialInvoice.InvoiceNo) : '',
    amount: initialInvoice ? parseFloat(initialInvoice.outstandingAmount || initialInvoice.grandTotal || 0) : '',
    paymentMethod: 'Transfer',
    account: depositAccounts[0] || 'Primary Bank',
    referenceTxnId: '',
  });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(!!initialInvoice);

  // Filter unpaid invoices for selected customer
  const customerInvoices = safeInvoices.filter((inv) => {
    if (!inv) return false;
    const party = inv.party || inv.CustomerName;
    return party === formData.customerName && parseFloat(inv.outstandingAmount || inv.OutstandingAmount || 0) > 0;
  });

  const handleCustomerChange = (custName) => {
    const unpaid = safeInvoices.find(
      (inv) => (inv.party || inv.CustomerName) === custName && parseFloat(inv.outstandingAmount || 0) > 0
    );
    setFormData((prev) => ({
      ...prev,
      customerName: custName,
      invoiceNo: unpaid ? (unpaid.name || unpaid.InvoiceNo) : '',
      amount: unpaid ? parseFloat(unpaid.outstandingAmount || 0) : prev.amount,
    }));
  };

  const handleInvoiceChange = (invNo) => {
    const inv = invoices.find((i) => (i.name || i.InvoiceNo) === invNo);
    setFormData((prev) => ({
      ...prev,
      invoiceNo: invNo,
      amount: inv ? parseFloat(inv.outstandingAmount || inv.grandTotal || 0) : prev.amount,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const res = await callGAS('addPayment', formData);
      if (res.success) {
        if (onPaymentAdded) onPaymentAdded();
        if (onCloseModal) {
          onCloseModal();
        } else {
          setShowAddForm(false);
          setFormData({
            date: new Date().toISOString().substring(0, 10),
            customerName: customers[0]?.name || '',
            invoiceNo: '',
            amount: '',
            paymentMethod: 'Transfer',
            account: depositAccounts[0] || 'Primary Bank',
            referenceTxnId: '',
          });
        }
      } else {
        alert(res.message || 'Error recording payment');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount || p.Amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payments & Receipts</h2>
          <p className="text-xs text-slate-500 mt-1">Track incoming customer transfers, UPI payments, and cash deposits</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Received</p>
            <p className="text-xl font-black text-green-700 font-mono">{formatINR(totalCollected)}</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-green-100 transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Payment
          </button>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-700 p-2 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  if (onCloseModal) onCloseModal();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Customer *</label>
                <select
                  value={formData.customerName}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                >
                  {safeCustomers.map((c, i) => (
                    <option key={i} value={c.name || c.CustomerName}>
                      {c.name || c.CustomerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Apply to Invoice</label>
                <select
                  value={formData.invoiceNo}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                >
                  <option value="">-- General Payment / Advance --</option>
                  {customerInvoices.map((inv, i) => (
                    <option key={i} value={inv.name || inv.InvoiceNo}>
                      {inv.name || inv.InvoiceNo} - Due: {formatINR(inv.outstandingAmount || inv.grandTotal)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Payment Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Payment Mode</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                  >
                    <option value="Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Deposit Account *</label>
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs font-medium"
                  >
                    {depositAccounts.map((acc, i) => (
                      <option key={i} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Reference / UTR / Txn ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / UTR / Cheque No."
                  value={formData.referenceTxnId}
                  onChange={(e) => setFormData({ ...formData, referenceTxnId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    if (onCloseModal) onCloseModal();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all text-xs disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px]">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Applied Invoice</th>
                <th className="py-3 px-4">Deposit Account</th>
                <th className="py-3 px-4 font-mono">Reference / UTR</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safePayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                safePayments.map((p, idx) => {
                  const invNo = p.InvoiceNo || (p.allocations && p.allocations[0]?.referenceName) || '-';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold font-mono text-slate-900">{p.name || p.PaymentNo}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(p.date || p.Date)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.party || p.CustomerName}</td>
                      <td className="py-3 px-4 font-mono text-blue-600 font-medium">{invNo}</td>
                      <td className="py-3 px-4 text-slate-600">{p.paymentAccount || p.account || p.Account || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{p.referenceId || p.ReferenceTxnId || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-green-700">
                        {formatINR(p.amount || p.Amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentManager;
