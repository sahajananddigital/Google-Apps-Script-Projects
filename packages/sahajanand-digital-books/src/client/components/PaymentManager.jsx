import { useState, useMemo } from 'react';
import { callGAS } from '../GAS';
import { formatINR, formatDate, getCurrencySymbol } from '../utils/formatters';
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

    // 2. From Chart of Accounts (asset bank and cash only)
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

  const defaultAccount = depositAccounts[0] || 'Bank Accounts';
  const defaultSecondAccount = depositAccounts[1] || depositAccounts[0] || 'Bank Accounts';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    customerName: initialInvoice ? (initialInvoice.party || initialInvoice.CustomerName) : (safeCustomers[0]?.name || safeCustomers[0]?.CustomerName || ''),
    invoiceNo: initialInvoice ? (initialInvoice.name || initialInvoice.InvoiceNo) : '',
    amount: initialInvoice ? parseFloat(initialInvoice.outstandingAmount || initialInvoice.grandTotal || 0) : '',
    paymentMethod: 'Transfer',
    account: defaultAccount,
    referenceTxnId: '',
  });

  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splits, setSplits] = useState([
    { id: 1, account: defaultAccount, amount: '', paymentMethod: 'Transfer', referenceTxnId: '' },
    { id: 2, account: defaultSecondAccount, amount: '', paymentMethod: 'Transfer', referenceTxnId: '' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(!!initialInvoice);

  // Filter unpaid invoices for selected customer
  const customerInvoices = useMemo(() => {
    return safeInvoices.filter((inv) => {
      if (!inv) return false;
      const party = inv.party || inv.CustomerName;
      return party === formData.customerName && parseFloat(inv.outstandingAmount || inv.OutstandingAmount || 0) > 0;
    });
  }, [safeInvoices, formData.customerName]);

  // Selected invoice object
  const selectedInvoice = useMemo(() => {
    if (!formData.invoiceNo) return null;
    return safeInvoices.find((i) => (i.name || i.InvoiceNo) === formData.invoiceNo) || null;
  }, [safeInvoices, formData.invoiceNo]);

  const invoiceDueAmount = useMemo(() => {
    if (!selectedInvoice) return parseFloat(formData.amount || 0);
    return parseFloat(selectedInvoice.outstandingAmount || selectedInvoice.grandTotal || 0);
  }, [selectedInvoice, formData.amount]);

  // Sum of current splits
  const totalSplitAmount = useMemo(() => {
    return splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [splits]);

  const handleCustomerChange = (custName) => {
    const unpaid = safeInvoices.find(
      (inv) => (inv.party || inv.CustomerName) === custName && parseFloat(inv.outstandingAmount || inv.grandTotal || 0) > 0
    );
    const invNo = unpaid ? (unpaid.name || unpaid.InvoiceNo) : '';
    const invAmt = unpaid ? parseFloat(unpaid.outstandingAmount || unpaid.grandTotal || 0) : '';

    setFormData((prev) => ({
      ...prev,
      customerName: custName,
      invoiceNo: invNo,
      amount: invAmt,
    }));

    if (invAmt > 0) {
      const half = (invAmt / 2).toFixed(2);
      setSplits([
        { id: 1, account: defaultAccount, amount: half, paymentMethod: 'Transfer', referenceTxnId: '' },
        { id: 2, account: defaultSecondAccount, amount: (invAmt - half).toFixed(2), paymentMethod: 'Transfer', referenceTxnId: '' },
      ]);
    }
  };

  const handleInvoiceChange = (invNo) => {
    const inv = safeInvoices.find((i) => (i.name || i.InvoiceNo) === invNo);
    const amt = inv ? parseFloat(inv.outstandingAmount || inv.grandTotal || 0) : '';
    setFormData((prev) => ({
      ...prev,
      invoiceNo: invNo,
      amount: amt,
    }));

    if (amt > 0) {
      const half = (amt / 2).toFixed(2);
      setSplits([
        { id: 1, account: defaultAccount, amount: half, paymentMethod: 'Transfer', referenceTxnId: '' },
        { id: 2, account: defaultSecondAccount, amount: (amt - half).toFixed(2), paymentMethod: 'Transfer', referenceTxnId: '' },
      ]);
    }
  };

  const handleAddSplit = () => {
    const nextAcc = depositAccounts[splits.length % depositAccounts.length] || defaultAccount;
    const target = invoiceDueAmount > 0 ? invoiceDueAmount : parseFloat(formData.amount || 0);
    const rem = Math.max(0, target - totalSplitAmount);

    setSplits([
      ...splits,
      {
        id: Date.now(),
        account: nextAcc,
        amount: rem > 0 ? rem.toFixed(2) : '',
        paymentMethod: 'Transfer',
        referenceTxnId: '',
      },
    ]);
  };

  const handleRemoveSplit = (idx) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const handleUpdateSplit = (idx, field, val) => {
    setSplits((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleAllocateRemaining = (idx) => {
    const others = splits.reduce((sum, s, i) => (i !== idx ? sum + (parseFloat(s.amount) || 0) : sum), 0);
    const target = invoiceDueAmount > 0 ? invoiceDueAmount : parseFloat(formData.amount || 0);
    const rem = Math.max(0, target - others);
    handleUpdateSplit(idx, 'amount', rem.toFixed(2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let payload;
    if (isSplitMode) {
      if (splits.length === 0) {
        alert('Please add at least one account split');
        return;
      }
      for (let i = 0; i < splits.length; i++) {
        const amt = parseFloat(splits[i].amount || 0);
        if (!amt || amt <= 0) {
          alert(`Split #${i + 1} has an invalid or zero amount`);
          return;
        }
        if (!splits[i].account) {
          alert(`Split #${i + 1} is missing a deposit account`);
          return;
        }
      }

      payload = {
        date: formData.date,
        customerName: formData.customerName,
        invoiceNo: formData.invoiceNo,
        splits: splits.map((s) => ({
          account: s.account,
          amount: parseFloat(s.amount),
          paymentMethod: s.paymentMethod || 'Transfer',
          referenceTxnId: s.referenceTxnId || '',
        })),
      };
    } else {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }
      payload = formData;
    }

    setLoading(true);
    try {
      const res = await callGAS('addPayment', payload);
      if (res && (res.success || res.paymentNo || res.paymentNos)) {
        if (onPaymentAdded) onPaymentAdded();
        if (onCloseModal) {
          onCloseModal();
        } else {
          setShowAddForm(false);
          setFormData({
            date: new Date().toISOString().substring(0, 10),
            customerName: safeCustomers[0]?.name || safeCustomers[0]?.CustomerName || '',
            invoiceNo: '',
            amount: '',
            paymentMethod: 'Transfer',
            account: defaultAccount,
            referenceTxnId: '',
          });
          setIsSplitMode(false);
          setSplits([
            { id: 1, account: defaultAccount, amount: '', paymentMethod: 'Transfer', referenceTxnId: '' },
            { id: 2, account: defaultSecondAccount, amount: '', paymentMethod: 'Transfer', referenceTxnId: '' },
          ]);
        }
      } else {
        alert(res?.message || 'Error recording payment');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // Pre-calculate payment count per invoice to show multi-account badges
  const invoicePaymentCounts = useMemo(() => {
    const counts = {};
    safePayments.forEach((p) => {
      const inv = p.InvoiceNo || (p.allocations && p.allocations[0]?.referenceName);
      if (inv) counts[inv] = (counts[inv] || 0) + 1;
    });
    return counts;
  }, [safePayments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return safePayments.filter((p) => {
      if (!p) return false;
      const pAcc = String(p.paymentAccount || p.account || p.Account || '');
      const pInv = String(p.InvoiceNo || (p.allocations && p.allocations[0]?.referenceName) || '');
      const pCust = String(p.party || p.CustomerName || '');
      const pNo = String(p.name || p.PaymentNo || '');
      const pRef = String(p.referenceId || p.ReferenceTxnId || '');

      if (filterAccount !== 'ALL' && !pAcc.toLowerCase().includes(filterAccount.toLowerCase())) {
        return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          pNo.toLowerCase().includes(q) ||
          pCust.toLowerCase().includes(q) ||
          pInv.toLowerCase().includes(q) ||
          pAcc.toLowerCase().includes(q) ||
          pRef.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [safePayments, filterAccount, searchTerm]);

  const totalCollected = useMemo(() => {
    return safePayments.reduce((sum, p) => sum + parseFloat(p.amount || p.Amount || 0), 0);
  }, [safePayments]);

  const totalFilteredCollected = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || p.Amount || 0), 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payments & Receipts</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track customer receipts and split deposits across multiple bank or cash accounts
          </p>
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-700 p-2 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Payment Receipt</h3>
                  <p className="text-[11px] text-slate-500">Supports single deposit or multi-account split allocation</p>
                </div>
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
              {/* Customer Selector */}
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

              {/* Invoice Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Apply to Invoice</label>
                <select
                  value={formData.invoiceNo}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                >
                  <option value="">-- General Payment / Advance (Unlinked) --</option>
                  {customerInvoices.map((inv, i) => (
                    <option key={i} value={inv.name || inv.InvoiceNo}>
                      {inv.name || inv.InvoiceNo} - Outstanding Due: {formatINR(inv.outstandingAmount || inv.grandTotal)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Receipt Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                >
                </input>
              </div>

              {/* Multi-Account Split Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Deposit Across Multiple Accounts</span>
                  <span className="text-[11px] text-slate-500">
                    Split this invoice payment between different bank accounts or cash
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSplitMode}
                    onChange={(e) => setIsSplitMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Single Account Deposit View */}
              {!isSplitMode && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase">Amount ({getCurrencySymbol(settings.currency)}) *</label>
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
                      <label className="font-bold text-slate-600 uppercase">Reference / UTR / Txn ID</label>
                      <input
                        type="text"
                        placeholder="e.g. UTR / UPI Ref / Cheque No."
                        value={formData.referenceTxnId}
                        onChange={(e) => setFormData({ ...formData, referenceTxnId: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Account Split View */}
              {isSplitMode && (
                <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {formatINR(invoiceDueAmount)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Allocated</span>
                      <span className="font-mono font-bold text-green-700 text-sm">
                        {formatINR(totalSplitAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          invoiceDueAmount - totalSplitAmount === 0 ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {formatINR(Math.max(0, invoiceDueAmount - totalSplitAmount))}
                      </span>
                    </div>
                  </div>

                  {/* Split Rows */}
                  <div className="space-y-3">
                    {splits.map((split, idx) => (
                      <div
                        key={split.id || idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 relative"
                      >
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            Split #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAllocateRemaining(idx)}
                              className="text-[10px] text-blue-600 hover:underline font-bold"
                            >
                              Fill Remaining
                            </button>
                            {splits.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSplit(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove split"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Deposit Account *</label>
                            <select
                              value={split.account}
                              onChange={(e) => handleUpdateSplit(idx, 'account', e.target.value)}
                              required
                              className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                            >
                              {depositAccounts.map((acc, i) => (
                                <option key={i} value={acc}>
                                  {acc}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Amount ({getCurrencySymbol(settings.currency)}) *</label>
                            <input
                              type="number"
                              step="any"
                              value={split.amount}
                              onChange={(e) => handleUpdateSplit(idx, 'amount', e.target.value)}
                              required
                              placeholder="0.00"
                              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Mode</label>
                            <select
                              value={split.paymentMethod}
                              onChange={(e) => handleUpdateSplit(idx, 'paymentMethod', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                            >
                              <option value="Transfer">Bank Transfer</option>
                              <option value="UPI">UPI</option>
                              <option value="Cash">Cash</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Card">Card</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Ref / UTR / Cheque</label>
                            <input
                              type="text"
                              value={split.referenceTxnId}
                              onChange={(e) => handleUpdateSplit(idx, 'referenceTxnId', e.target.value)}
                              placeholder="UTR / Ref ID"
                              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSplit}
                    className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    + Add Another Account Split
                  </button>
                </div>
              )}

              {/* Form Action Buttons */}
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
                  {loading ? 'Recording...' : isSplitMode ? `Record Split (${formatINR(totalSplitAmount)})` : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by receipt #, customer, invoice #, account, or UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white transition-all"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-3 top-2.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Deposit Accounts</option>
            {depositAccounts.map((acc, i) => (
              <option key={i} value={acc}>
                {acc}
              </option>
            ))}
          </select>
          {(searchTerm || filterAccount !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterAccount('ALL');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

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
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 font-mono">Reference / UTR</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No payment records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, idx) => {
                  const invNo = p.InvoiceNo || (p.allocations && p.allocations[0]?.referenceName) || '-';
                  const isMultiSplit = invNo !== '-' && (invoicePaymentCounts[invNo] || 0) > 1;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold font-mono text-slate-900">{p.name || p.PaymentNo}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(p.date || p.Date)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.party || p.CustomerName}</td>
                      <td className="py-3 px-4 font-mono text-blue-600 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{invNo}</span>
                          {isMultiSplit && (
                            <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-sans font-bold">
                              Multi-Split
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {p.paymentAccount || p.account || p.Account || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.paymentMethod || p.modeOfPayment || 'Transfer'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{p.referenceId || p.ReferenceTxnId || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-green-700">
                        {formatINR(p.amount || p.Amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredPayments.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-700">
                  <td colSpan="7" className="py-3 px-4 text-right uppercase text-[11px] text-slate-500">
                    Showing {filteredPayments.length} records • Total:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-green-700 text-sm">
                    {formatINR(totalFilteredCollected)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentManager;
