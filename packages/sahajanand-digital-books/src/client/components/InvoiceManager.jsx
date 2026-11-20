import { useState } from 'react';
import { callGAS } from '../GAS';
import { formatINR, formatDate } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';
import InvoiceViewer from './InvoiceViewer';
import InvoiceCreateForm from './InvoiceCreateForm';

const InvoiceManager = ({
  invoices = [],
  customers = [],
  items = [],
  accounts = [],
  settings = {},
  onRefresh,
  onOpenPaymentModal,
}) => {
  const safeInvoices = toSafeArray(invoices);
  const safeCustomers = toSafeArray(customers);
  const safeItems = toSafeArray(items);
  const safeAccounts = toSafeArray(accounts);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [cloningInvoice, setCloningInvoice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Status computation
  const getDisplayStatus = (inv) => {
    if (!inv) return 'Submitted';
    if (inv.cancelled || inv.Status === 'Cancelled') return 'Cancelled';
    const outstanding = parseFloat(inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.OutstandingAmount || 0));
    if (outstanding <= 0) return 'Paid';
    return inv.status || inv.Status || 'Submitted';
  };

  const filteredInvoices = safeInvoices.filter((inv) => {
    if (!inv) return false;
    const term = String(searchTerm || '').toLowerCase();
    const invNo = String(inv.name || inv.InvoiceNo || '').toLowerCase();
    const party = String(inv.party || inv.CustomerName || '').toLowerCase();
    const matchesSearch = invNo.includes(term) || party.includes(term);

    const status = getDisplayStatus(inv);
    const matchesStatus = statusFilter === 'All' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalInvoiced = safeInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || inv.GrandTotal || 0), 0);
  const totalOutstanding = safeInvoices.reduce((sum, inv) => {
    if (!inv || inv.cancelled || inv.Status === 'Cancelled') return sum;
    const out = parseFloat(inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.OutstandingAmount || 0));
    return sum + out;
  }, 0);
  const totalCollected = Math.max(0, totalInvoiced - totalOutstanding);

  const handleMarkPaid = async (inv) => {
    const invNo = inv.name || inv.InvoiceNo;
    if (!window.confirm(`Mark invoice ${invNo} as fully Paid?`)) return;

    setActionLoading(true);
    try {
      const res = await callGAS('updateInvoiceStatus', invNo, 'Paid');
      if (res.success) {
        if (onRefresh) onRefresh();
      } else {
        alert(res.message || 'Error updating status');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const openViewer = (inv) => {
    setSelectedInvoice(inv);
  };

  const getCustomerForInvoice = (inv) => {
    if (!inv) return null;
    const partyName = inv.party || inv.CustomerName;
    return safeCustomers.find((c) => c && (c.name || c.CustomerName) === partyName) || null;
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{formatINR(totalInvoiced)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{safeInvoices.length} invoices generated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Collected / Paid</p>
          <p className="text-2xl font-black text-green-700 mt-1 font-mono">{formatINR(totalCollected)}</p>
          <p className="text-[11px] text-green-500 mt-1">Cleared to bank account</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Outstanding Due</p>
          <p className="text-2xl font-black text-amber-700 mt-1 font-mono">{formatINR(totalOutstanding)}</p>
          <p className="text-[11px] text-amber-500 mt-1">Pending payments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Action</p>
            <p className="text-xs text-slate-600 mt-1">Generate new sales bill with UPI QR code</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="w-full mt-3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-200 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full md:w-auto relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'Submitted', 'Paid', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px]">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const status = getDisplayStatus(inv);
                  const invNo = inv.name || inv.InvoiceNo;
                  const grand = parseFloat(inv.grandTotal || inv.GrandTotal || 0);
                  const out = parseFloat(inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.OutstandingAmount || 0));

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {invNo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(inv.date || inv.Date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {inv.party || inv.CustomerName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                        {formatINR(grand)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {out > 0 ? (
                          <span className="text-amber-700 font-bold">{formatINR(out)}</span>
                        ) : (
                          <span className="text-slate-400">{formatINR(0)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            status === 'Paid'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openViewer(inv)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            title="View / Print"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>

                          <button
                            onClick={() => {
                              setCloningInvoice(inv);
                              setIsCreating(true);
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Clone this Invoice"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                            Clone
                          </button>

                          {status !== 'Paid' && status !== 'Cancelled' && (
                            <button
                              onClick={() => {
                                if (onOpenPaymentModal) {
                                  onOpenPaymentModal(inv);
                                } else {
                                  handleMarkPaid(inv);
                                }
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[11px] font-bold transition-all"
                              title="Record payment"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <InvoiceViewer
          invoice={selectedInvoice}
          customer={getCustomerForInvoice(selectedInvoice)}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Create / Clone Invoice Form Modal */}
      {isCreating && (
        <InvoiceCreateForm
          customers={customers}
          items={items}
          settings={settings}
          initialInvoice={cloningInvoice}
          onInvoiceCreated={(newInvNo) => {
            setIsCreating(false);
            setCloningInvoice(null);
            if (onRefresh) onRefresh();
          }}
          onCancel={() => {
            setIsCreating(false);
            setCloningInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceManager;
