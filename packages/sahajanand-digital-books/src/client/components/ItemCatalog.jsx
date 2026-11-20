import { useState, useMemo } from 'react';
import { callGAS } from '../GAS';
import { formatINR, getCurrencySymbol } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';
import { STANDARD_UNITS } from '../utils/units';

const ItemCatalog = ({ items = [], settings = {}, onItemAdded }) => {
  const safeItems = toSafeArray(items);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [loading, setLoading] = useState(false);

  // Modal states: 'add' | 'edit' | 'clone' | null
  const [formMode, setFormMode] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitText, setCustomUnitText] = useState('');

  const initialForm = {
    name: '',
    originalName: '',
    rate: '',
    unit: 'Unit',
    hsnCode: '998312',
    itemGroup: 'Service',
    description: '',
    isClone: false,
  };
  const [formData, setFormData] = useState(initialForm);

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsCustomUnit(false);
    setCustomUnitText('');
    setFormMode('add');
  };

  // Open Edit modal
  const handleOpenEdit = (it) => {
    const itemName = it.name || it.ItemName || '';
    const itemUnit = it.unit || it.Unit || 'Unit';
    const isCustom = !STANDARD_UNITS.includes(itemUnit);

    setIsCustomUnit(isCustom);
    setCustomUnitText(isCustom ? itemUnit : '');

    setFormData({
      name: itemName,
      originalName: itemName,
      rate: parseFloat(it.rate || it.Rate || 0),
      unit: itemUnit,
      hsnCode: it.hsnCode || it.HSN_SAC || '998312',
      itemGroup: it.itemGroup || it.ItemGroup || 'Service',
      description: it.description || it.Description || '',
      isClone: false,
    });
    setFormMode('edit');
    if (viewingItem) setViewingItem(null);
  };

  // Open Clone modal
  const handleOpenClone = (it) => {
    const itemName = it.name || it.ItemName || '';
    const itemUnit = it.unit || it.Unit || 'Unit';
    const isCustom = !STANDARD_UNITS.includes(itemUnit);

    setIsCustomUnit(isCustom);
    setCustomUnitText(isCustom ? itemUnit : '');

    setFormData({
      name: `${itemName} (Copy)`,
      originalName: '',
      rate: parseFloat(it.rate || it.Rate || 0),
      unit: itemUnit,
      hsnCode: it.hsnCode || it.HSN_SAC || '998312',
      itemGroup: it.itemGroup || it.ItemGroup || 'Service',
      description: it.description || it.Description || '',
      isClone: true,
    });
    setFormMode('clone');
    if (viewingItem) setViewingItem(null);
  };

  // Open View modal
  const handleOpenView = (it) => {
    setViewingItem(it);
  };

  // Handle Delete
  const handleDelete = async (it) => {
    const itemName = it.name || it.ItemName || '';
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    setLoading(true);
    try {
      const res = await callGAS('deleteItem', itemName);
      if (res && res.success) {
        if (onItemAdded) onItemAdded();
        if (viewingItem && (viewingItem.name === itemName || viewingItem.ItemName === itemName)) {
          setViewingItem(null);
        }
      } else {
        alert(res?.message || 'Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit form for Add, Edit, or Clone
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter an item name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        originalName: formMode === 'edit' ? formData.originalName : '',
        rate: parseFloat(formData.rate || 0),
        unit: formData.unit || 'Unit',
        hsnCode: formData.hsnCode || '998312',
        itemGroup: formData.itemGroup || 'Service',
        description: formData.description || '',
        isClone: formMode === 'clone',
      };

      const res = await callGAS('saveItem', payload);
      if (res && res.success) {
        setFormMode(null);
        setFormData(initialForm);
        if (onItemAdded) onItemAdded();
      } else {
        alert(res?.message || 'Error saving item');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return safeItems.filter((it) => {
      if (!it) return false;
      const q = searchTerm.toLowerCase();
      const name = String(it.name || it.ItemName || '').toLowerCase();
      const sac = String(it.hsnCode || it.HSN_SAC || '').toLowerCase();
      const desc = String(it.description || it.Description || '').toLowerCase();
      const group = String(it.itemGroup || it.ItemGroup || '').toLowerCase();
      return name.includes(q) || sac.includes(q) || desc.includes(q) || group.includes(q);
    });
  }, [safeItems, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Services & Products Catalog</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure service rates, SAC codes, billing descriptions, view, edit, or clone catalog items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-100 transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Service / Item
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search catalog items by name, HSN/SAC code, category, or description..."
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
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {filteredItems.length} of {safeItems.length} items
        </span>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              No services or products found matching your search.
            </div>
          ) : (
            filteredItems.map((it, idx) => {
              const name = it.name || it.ItemName;
              const sac = it.hsnCode || it.HSN_SAC || '998312';
              const rate = it.rate || it.Rate || 0;
              const unit = it.unit || it.Unit || 'Unit';
              const desc = it.description || it.Description || '';
              const group = it.itemGroup || it.ItemGroup || 'Service';

              return (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        SAC: {sac}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {group}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{name}</h3>

                    {desc ? (
                      <p className="text-xs text-slate-500 line-clamp-2">{desc}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No description provided</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-slate-400">Default Rate:</span>
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {formatINR(rate)} <span className="text-xs font-normal text-slate-500">/{unit}</span>
                      </span>
                    </div>

                    {/* Action Buttons: View, Edit, Clone */}
                    <div className="flex items-center justify-between pt-1 gap-1.5 border-t border-slate-50">
                      <button
                        onClick={() => handleOpenView(it)}
                        className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="View Full Item Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>

                      <button
                        onClick={() => handleOpenEdit(it)}
                        className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="Edit Item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>

                      <button
                        onClick={() => handleOpenClone(it)}
                        className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="Clone Item / Duplicate"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        Clone
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px]">
                  <th className="py-3 px-4">Item / Service Name</th>
                  <th className="py-3 px-4">SAC Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Rate ({getCurrencySymbol(settings.currency)})</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No services or products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it, idx) => {
                    const name = it.name || it.ItemName;
                    const sac = it.hsnCode || it.HSN_SAC || '998312';
                    const rate = it.rate || it.Rate || 0;
                    const unit = it.unit || it.Unit || 'Unit';
                    const desc = it.description || it.Description || '-';
                    const group = it.itemGroup || it.ItemGroup || 'Service';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{name}</td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {sac}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{group}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{desc}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(rate)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">{unit}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenView(it)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1"
                              title="View item"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenEdit(it)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1"
                              title="Edit item"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenClone(it)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold text-[11px] flex items-center gap-1"
                              title="Clone item"
                            >
                              Clone
                            </button>
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
      )}

      {/* View Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                  SAC: {viewingItem.hsnCode || viewingItem.HSN_SAC || '998312'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {viewingItem.name || viewingItem.ItemName}
                </h3>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Unit Rate</span>
                  <span className="text-lg font-black font-mono text-slate-900">
                    {formatINR(viewingItem.rate || viewingItem.Rate || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit of Measurement</span>
                  <span className="text-sm font-bold text-slate-800">
                    {viewingItem.unit || viewingItem.Unit || 'Unit'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Item Group / Type</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {viewingItem.itemGroup || viewingItem.ItemGroup || 'Service'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">SAC / HSN Code</span>
                  <span className="text-xs font-mono font-bold text-blue-700">
                    {viewingItem.hsnCode || viewingItem.HSN_SAC || '998312'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</span>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {(viewingItem.description || viewingItem.Description) || 'No description entered for this item.'}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDelete(viewingItem)}
                disabled={loading}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenClone(viewingItem)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  Clone
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(viewingItem)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit / Clone Modal */}
      {formMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    formMode === 'add'
                      ? 'bg-blue-100 text-blue-700'
                      : formMode === 'edit'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {formMode === 'add' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />}
                    {formMode === 'edit' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                    {formMode === 'clone' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {formMode === 'add' && 'Add Service / Item'}
                    {formMode === 'edit' && `Edit Item: ${formData.originalName || formData.name}`}
                    {formMode === 'clone' && `Clone Item: ${formData.name}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formMode === 'add' && 'Create a new catalog item with pricing and HSN/SAC code'}
                    {formMode === 'edit' && 'Update rates, units, and descriptions across the system'}
                    {formMode === 'clone' && 'Duplicate this item to quickly create a new variant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFormMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Service / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Maintenance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Default Rate ({getCurrencySymbol(settings.currency)}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase flex justify-between">
                    <span>Unit of Measurement</span>
                    {isCustomUnit && <span className="text-[10px] text-blue-600 font-bold">Custom</span>}
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={isCustomUnit ? 'CUSTOM' : formData.unit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setIsCustomUnit(true);
                          if (customUnitText) setFormData((prev) => ({ ...prev, unit: customUnitText }));
                        } else {
                          setIsCustomUnit(false);
                          setFormData((prev) => ({ ...prev, unit: val }));
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs font-medium"
                    >
                      <optgroup label="Academic & Education">
                        <option value="Course">Course</option>
                        <option value="Semester">Semester</option>
                        <option value="Term">Term</option>
                        <option value="Program">Program</option>
                        <option value="Session">Session</option>
                        <option value="Class">Class</option>
                        <option value="Student">Student</option>
                        <option value="Seat">Seat</option>
                      </optgroup>
                      <optgroup label="General & Business">
                        <option value="Unit">Unit</option>
                        <option value="Project">Project</option>
                        <option value="Qty">Qty</option>
                        <option value="Package">Package</option>
                      </optgroup>
                      <optgroup label="Time & Recurring">
                        <option value="Month">Month</option>
                        <option value="Year">Year</option>
                        <option value="Day">Day</option>
                        <option value="Hour">Hour</option>
                        <option value="Domain">Domain</option>
                        <option value="Server">Server</option>
                        <option value="License">License</option>
                      </optgroup>
                      <option value="CUSTOM">Custom Unit...</option>
                    </select>

                    {isCustomUnit && (
                      <input
                        type="text"
                        placeholder="e.g. Batch / Module / Credits"
                        value={customUnitText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomUnitText(val);
                          setFormData((prev) => ({ ...prev, unit: val || 'Unit' }));
                        }}
                        required
                        className="w-full rounded-xl border border-blue-400 p-2 text-xs font-semibold focus:border-blue-600 bg-blue-50/20"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono"
                    placeholder="998312"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Category / Group</label>
                  <select
                    value={formData.itemGroup}
                    onChange={(e) => setFormData({ ...formData, itemGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                  >
                    <option value="Service">Service</option>
                    <option value="Development">Development</option>
                    <option value="Hosting">Hosting</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Product">Product / Hardware</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Default Line Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  placeholder="Enter invoice line description..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormMode(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 text-white rounded-xl font-bold transition-all disabled:opacity-50 ${
                    formMode === 'edit'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : formMode === 'clone'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading
                    ? 'Saving...'
                    : formMode === 'edit'
                    ? 'Update Item'
                    : formMode === 'clone'
                    ? 'Save Cloned Item'
                    : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCatalog;
