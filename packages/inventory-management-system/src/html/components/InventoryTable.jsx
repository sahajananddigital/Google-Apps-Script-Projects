import React from 'react';

export const InventoryTable = ({ inventory, loading, onRecord, onEdit }) => {
  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!inventory || inventory.length === 0) return (
    <div className="text-center p-12 text-slate-500 italic bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
      કોઈ ડેટા મળ્યો નથી.
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">વસ્તુનું નામ</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ગુરુકુલ સ્ટોક</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">સ્ટોર સ્ટોક</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ખરીદી કિંમત</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">વેચાણ કિંમત</th>
            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {inventory.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                <div className="font-bold text-slate-900">{item.name}</div>
                <div className="text-[10px] text-emerald-600 font-bold uppercase">{item.category}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`font-black text-lg ${Number(item.gurukul_stock) <= 5 ? 'text-red-600' : 'text-slate-900'}`}>
                  {item.gurukul_stock}
                </span>
                <span className="text-[10px] text-slate-400 ml-1 uppercase">{item.unit}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-lg font-bold text-blue-600">
                {item.store_stock}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">₹{item.buy_price}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-900">₹{item.sell_price}</td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button 
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                  title="Edit Item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button 
                  onClick={() => onRecord(item, 'IN')}
                  className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                  title="Stock In (+)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" /></svg>
                </button>
                <button 
                  onClick={() => onRecord(item, 'OUT')}
                  className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                  title="Stock Out (-)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 12H6" /></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
