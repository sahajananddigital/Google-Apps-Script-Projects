import { useState } from 'react';
import { callGAS } from '../GAS';
import { formatINR } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';

const CustomerManager = ({ customers = [], onCustomerAdded }) => {
  const safeCustomers = toSafeArray(customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '382350',
    gstin: '',
    gstType: 'Unregistered',
  });

  const filteredCustomers = safeCustomers.filter((c) => {
    if (!c) return false;
    const term = String(searchTerm || '').toLowerCase();
    const name = String(c.name || c.CustomerName || '').toLowerCase();
    const city = String(c.city || c.City || '').toLowerCase();
    const phone = String(c.phone || c.Phone || '').toLowerCase();
    return name.includes(term) || city.includes(term) || phone.includes(term);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const res = await callGAS('saveCustomer', formData);
      if (res.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: 'Ahmedabad',
          state: 'Gujarat',
          postalCode: '382350',
          gstin: '',
          gstType: 'Unregistered',
        });
        if (onCustomerAdded) onCustomerAdded();
      } else {
        alert(res.message || 'Error saving customer');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage client profiles, GSTIN details, and outstanding balances</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-100 transition-all flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="Search by customer name, phone, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust, idx) => {
          const name = cust.name || cust.CustomerName;
          const out = parseFloat(cust.outstandingAmount || cust.OutstandingAmount || 0);

          return (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{name}</h3>
                  {out > 0 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      Due: {formatINR(out)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 shrink-0">
                      Clear
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  {cust.phone && (
                    <p className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {cust.phone}
                    </p>
                  )}
                  {cust.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {cust.email}
                    </p>
                  )}
                  {(cust.addressLine1 || cust.city) && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                      {[cust.addressLine1, cust.city, cust.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {cust.gstin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">GSTIN:</span>
                  <span className="font-mono font-bold text-slate-700">{cust.gstin}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Email</label>
                  <input
                    type="email"
                    placeholder="accounts@..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Address</label>
                <input
                  type="text"
                  placeholder="Street / Office building"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Pincode</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="24AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
