export const InventoryForm = ({ formData, setFormData, onSubmit, submitting, categories = [] }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-1">વસ્તુનું નામ (Item Name)</label>
          <input
            type="text"
            required
            className="input-field"
            placeholder="નામ લખો"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">કેટેગરી</label>
          <select
            className="input-field"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">યુનિટ</label>
          <select
            className="input-field"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <option value="pcs">pcs (નંગ)</option>
            <option value="kg">kg (કિલો)</option>
            <option value="box">box (બોક્સ)</option>
            <option value="set">set (સેટ)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">ગુરુકુલ સ્ટોક</label>
          <input
            type="number"
            className="input-field bg-emerald-50 font-bold"
            value={formData.gurukul_stock}
            onChange={(e) => setFormData({ ...formData, gurukul_stock: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">સ્ટોર સ્ટોક</label>
          <input
            type="number"
            className="input-field bg-blue-50 font-bold"
            value={formData.store_stock}
            onChange={(e) => setFormData({ ...formData, store_stock: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">ખરીદી કિંમત</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            value={formData.buy_price}
            onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">વેચાણ કિંમત</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            value={formData.sell_price}
            onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <div className="pt-2 flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary min-w-[200px]">
          {submitting ? 'Saving...' : 'Add New Item (નવી વસ્તુ ઉમેરો)'}
        </button>
      </div>
    </form>
  );
};
