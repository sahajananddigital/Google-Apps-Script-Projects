import React, { useState, useEffect } from 'react';

export const ReportPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    setLoading(true);
    if (typeof google !== 'undefined') {
      google.script.run
        .withSuccessHandler((data) => {
          setTransactions(data);
          setLoading(false);
        })
        .withFailureHandler((err) => {
          alert('Failed to load report: ' + err);
          setLoading(false);
        })
        .getTodaysTransactions();
    } else {
      // Mock data
      setTimeout(() => {
        setTransactions([
          { id: '1', timestamp: new Date().toLocaleString(), item_name: 'Bhagavad Gita', type: 'IN', quantity: 10, user: 'admin@gurukul.com', remarks: 'New stock' },
          { id: '2', timestamp: new Date().toLocaleString(), item_name: 'Cotton Dhoti', type: 'OUT', quantity: 2, user: 'admin@gurukul.com', remarks: 'Sold' }
        ]);
        setLoading(false);
      }, 1000);
    }
  };

  const stats = transactions.reduce((acc, curr) => {
    if (curr.type === 'IN') acc.totalIn += Number(curr.quantity);
    else acc.totalOut += Number(curr.quantity);
    return acc;
  }, { totalIn: 0, totalOut: 0 });

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-emerald-50 border-emerald-100 flex flex-col items-center justify-center py-4">
          <p className="text-emerald-600 text-sm font-bold uppercase">Today's Entries (+)</p>
          <p className="text-3xl font-black text-emerald-700">{stats.totalIn}</p>
        </div>
        <div className="card bg-red-50 border-red-100 flex flex-col items-center justify-center py-4">
          <p className="text-red-600 text-sm font-bold uppercase">Today's Sales (-)</p>
          <p className="text-3xl font-black text-red-700">{stats.totalOut}</p>
        </div>
        <div className="card bg-blue-50 border-blue-100 flex flex-col items-center justify-center py-4">
          <p className="text-blue-600 text-sm font-bold uppercase">Total Transactions</p>
          <p className="text-3xl font-black text-blue-700">{transactions.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Transaction History (Today)</h3>
          <button onClick={loadTransactions} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh Report
          </button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">
            No transactions recorded today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{t.timestamp.split(', ')[1]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{t.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{t.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{t.user.split('@')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 italic">{t.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
