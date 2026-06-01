import React, { useState, useEffect } from 'react';

export const EditModal = ({ item, isOpen, onClose, onSave, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    gurukul_stock: 0,
    store_stock: 0,
    buy_price: 0,
    sell_price: 0,
    unit: 'pcs'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        name: item.name || '',
        category: item.category || categories[0],
        gurukul_stock: item.gurukul_stock || 0,
        store_stock: item.store_stock || 0,
        buy_price: item.buy_price || 0,
        sell_price: item.sell_price || 0,
        unit: item.unit || 'pcs'
      });
    }
  }, [item, categories]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (typeof google !== 'undefined') {
      google.script.run
        .withSuccessHandler(() => {
          setSubmitting(false);
          onSave();
          onClose();
        })
        .withFailureHandler((err) => {
          alert('Error: ' + err);
          setSubmitting(false);
        })
        .updateItem(formData);
    } else {
      setTimeout(() => {
        setSubmitting(false);
        onSave();
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">Edit Item (વસ્તુમાં સુધારો)</h3>
          <button onClick={onClose} className="hover:text-blue-100 text-2xl font-bold">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">વસ્તુનું નામ (Item Name)</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">કેટેગરી (Category)</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ગુરુકુલ સ્ટોક (Gurukul Stock)</label>
              <input
                type="number"
                className="input-field"
                value={formData.gurukul_stock}
                onChange={(e) => setFormData({ ...formData, gurukul_stock: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">સ્ટોર સ્ટોક (Store Stock)</label>
              <input
                type="number"
                className="input-field"
                value={formData.store_stock}
                onChange={(e) => setFormData({ ...formData, store_stock: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ખરીદી કિંમત (Buy Price)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={formData.buy_price}
                onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">વેચાણ કિંમત (Sell Price)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700">
              {submitting ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
