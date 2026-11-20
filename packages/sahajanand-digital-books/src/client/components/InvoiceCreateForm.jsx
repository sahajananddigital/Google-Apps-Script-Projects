import { useState } from 'react';
import { callGAS } from '../GAS';
import { formatINR, getCurrencySymbol } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';

const InvoiceCreateForm = ({ customers = [], items = [], settings = {}, onInvoiceCreated, onCancel, initialInvoice = null }) => {
  const safeCustomers = toSafeArray(customers);
  const safeItems = toSafeArray(items);

  const initCust = initialInvoice
    ? (initialInvoice.party || initialInvoice.CustomerName || '')
    : (safeCustomers.length > 0 ? (safeCustomers[0].name || safeCustomers[0].CustomerName) : '');

  const initItems = initialInvoice && Array.isArray(initialInvoice.items) && initialInvoice.items.length > 0
    ? initialInvoice.items.map((it) => ({
        item: it.item || it.ItemName || '',
        description: it.description || it.Description || '',
        hsnCode: it.hsnCode || it.HSN_SAC || '998312',
        unit: it.unit || it.Unit || (safeItems.find((si) => (si.name || si.ItemName) === (it.item || it.ItemName))?.unit) || 'Unit',
        quantity: parseFloat(it.quantity || it.Quantity || 1),
        rate: parseFloat(it.rate || it.Rate || 0),
        amount: parseFloat(it.amount || it.Amount || 0),
      }))
    : [
        {
          item: safeItems.length > 0 ? (safeItems[0].name || safeItems[0].ItemName) : '',
          description: '',
          hsnCode: safeItems.length > 0 ? (safeItems[0].hsnCode || safeItems[0].HSN_SAC || '998312') : '998312',
          unit: safeItems.length > 0 ? (safeItems[0].unit || safeItems[0].Unit || 'Unit') : 'Unit',
          quantity: 1,
          rate: safeItems.length > 0 ? parseFloat(safeItems[0].rate || 0) : 0,
          amount: safeItems.length > 0 ? parseFloat(safeItems[0].rate || 0) : 0,
        },
      ];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    customerName: initCust,
    customCustomer: '',
    terms: initialInvoice
      ? (initialInvoice.terms || initialInvoice.TermsAndConditions || 'Payment due on receipt. Thank you for your business.')
      : 'Payment due on receipt. Thank you for your business.',
    discountAmount: initialInvoice ? parseFloat(initialInvoice.discountAmount || 0) : 0,
    items: initItems,
  });
  const [useCustomCustomer, setUseCustomCustomer] = useState(safeCustomers.length === 0 && !initCust);
  const [loading, setLoading] = useState(false);

  const selectedCustomer = safeCustomers.find(
    (c) => c && (c.name || c.CustomerName) === formData.customerName
  );

  const handleItemSelect = (index, itemName) => {
    const selected = safeItems.find((i) => i && (i.name || i.ItemName) === itemName);
    const updated = [...formData.items];
    const rate = selected ? parseFloat(selected.rate || 0) : updated[index].rate || 0;
    const qty = updated[index].quantity || 1;
    const unit = selected ? (selected.unit || selected.Unit || 'Unit') : (updated[index].unit || 'Unit');

    updated[index] = {
      ...updated[index],
      item: itemName,
      description: selected ? (selected.description || '') : updated[index].description,
      hsnCode: selected ? (selected.hsnCode || selected.HSN_SAC || '998312') : updated[index].hsnCode,
      unit: unit,
      rate: rate,
      amount: rate * qty,
    };

    setFormData((prev) => ({ ...prev, items: updated }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(item.quantity || 0);
      const r = parseFloat(item.rate || 0);
      item.amount = q * r;
    }
    updated[index] = item;
    setFormData((prev) => ({ ...prev, items: updated }));
  };

  const addItemRow = () => {
    const firstItem = safeItems[0] || {};
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item: firstItem.name || firstItem.ItemName || '',
          description: '',
          hsnCode: firstItem.hsnCode || firstItem.HSN_SAC || '998312',
          unit: firstItem.unit || firstItem.Unit || 'Unit',
          quantity: 1,
          rate: parseFloat(firstItem.rate || 0),
          amount: parseFloat(firstItem.rate || 0),
        },
      ],
    }));
  };

  const removeItemRow = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const netTotal = formData.items.reduce((sum, itm) => sum + parseFloat(itm.amount || 0), 0);
  const discount = parseFloat(formData.discountAmount || 0);
  const grandTotal = Math.max(0, netTotal - discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCustomer = useCustomCustomer ? formData.customCustomer.trim() : formData.customerName;

    if (!finalCustomer) {
      alert('Please specify a customer name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        customerName: finalCustomer,
        netTotal,
        discountAmount: discount,
        grandTotal,
      };

      const res = await callGAS('createInvoice', payload);
      if (res.success) {
        if (onInvoiceCreated) onInvoiceCreated(res.invoiceNo);
      } else {
        alert(res.message || 'Error generating invoice');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {initialInvoice ? `Clone Invoice (${initialInvoice.name || initialInvoice.InvoiceNo})` : 'Create New Invoice'}
              </h2>
              <p className="text-xs text-slate-500">
                {initialInvoice ? 'Duplicating items and customer details to new invoice' : 'Auto-calculates grand total and generates sequential invoice ID'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer / Party *</label>
                {customers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseCustomCustomer(!useCustomCustomer)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    {useCustomCustomer ? '← Choose from Directory' : '+ Type New Customer'}
                  </button>
                )}
              </div>

              {useCustomCustomer || customers.length === 0 ? (
                <input
                  type="text"
                  required
                  placeholder="Enter client / business name"
                  value={formData.customCustomer}
                  onChange={(e) => setFormData({ ...formData, customCustomer: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 font-medium"
                />
              ) : (
                <select
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 bg-white"
                >
                  {safeCustomers.map((c, i) => (
                    <option key={i} value={c.name || c.CustomerName}>
                      {c.name || c.CustomerName}
                    </option>
                  ))}
                </select>
              )}

              {selectedCustomer && !useCustomCustomer && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.phone].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Invoice Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Line Items</h3>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((row, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Service / Item</label>
                    {safeItems.length > 0 ? (
                      <select
                        value={row.item}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-medium"
                      >
                        <option value="">-- Select Item or Type Below --</option>
                        {safeItems.map((it, i) => (
                          <option key={i} value={it.name || it.ItemName}>
                            {it.name || it.ItemName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Item or Service Name"
                        value={row.item}
                        onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-medium"
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Line notes or details..."
                      value={row.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">HSN/SAC</label>
                    <input
                      type="text"
                      value={row.hsnCode}
                      onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Qty {row.unit ? `(${row.unit})` : ''}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={row.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-bold"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Rate ({getCurrencySymbol(settings.currency)})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={row.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-2 pt-5">
                    <div className="text-right flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
                      <p className="font-mono font-bold text-xs text-slate-900">{formatINR(row.amount)}</p>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        title="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Calculations & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Terms & Notes</label>
              <textarea
                rows="3"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs"
              ></textarea>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatINR(netTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Discount ({getCurrencySymbol(settings.currency)}):</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                  className="w-24 rounded-lg border border-slate-200 p-1 text-right text-xs bg-white font-mono"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-600 text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-100 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceCreateForm;
