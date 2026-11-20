import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';
import { formatINR, formatDate, getCurrencySymbol } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';
import ChartOfAccountsTree from './ChartOfAccountsTree';

const AccountingManager = ({ accounts = [], journalEntries = [], settings = {}, onRefresh }) => {
  const safeAccounts = toSafeArray(accounts);
  const safeJournalEntries = toSafeArray(journalEntries);

  const [subTab, setSubTab] = useState('chart'); // 'chart' | 'journal' | 'ledger'
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('Debtors');
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const getInitialSplits = () => {
    const debitAcc = safeAccounts.find((a) => (a.rootType || a.RootType) === 'Expense')?.name || 'Operating Expenses';
    const creditAcc = settings.primaryBankName || safeAccounts.find((a) => (a.accountType || a.AccountType) === 'Bank')?.name || 'Primary Bank';
    return [
      { account: debitAcc, debit: 0, credit: 0 },
      { account: creditAcc, debit: 0, credit: 0 },
    ];
  };

  // New JV State
  const [showNewJvModal, setShowNewJvModal] = useState(false);
  const [jvData, setJvData] = useState({
    date: new Date().toISOString().substring(0, 10),
    entryType: 'Journal Entry',
    narration: '',
    splits: getInitialSplits(),
  });
  const [jvSaving, setJvSaving] = useState(false);

  // Load ledger statement when selected account changes
  useEffect(() => {
    if (subTab === 'ledger' && selectedLedgerAccount) {
      loadLedger(selectedLedgerAccount);
    }
  }, [subTab, selectedLedgerAccount]);

  const loadLedger = async (accountName) => {
    setLedgerLoading(true);
    try {
      const res = await callGAS('getAccountLedger', accountName);
      setLedgerEntries(toSafeArray(res));
    } catch (e) {
      console.error(e);
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleSelectAccountFromTree = (accountName) => {
    setSelectedLedgerAccount(accountName);
    setSubTab('ledger');
  };

  const handleAddSplitRow = () => {
    setJvData((prev) => ({
      ...prev,
      splits: [...prev.splits, { account: safeAccounts[0]?.name || 'Cash', debit: 0, credit: 0 }],
    }));
  };

  const handleRemoveSplitRow = (idx) => {
    if (jvData.splits.length <= 2) return;
    setJvData((prev) => ({
      ...prev,
      splits: prev.splits.filter((_, i) => i !== idx),
    }));
  };

  const handleSplitChange = (idx, field, value) => {
    const updated = [...jvData.splits];
    updated[idx] = { ...updated[idx], [field]: value };
    setJvData((prev) => ({ ...prev, splits: updated }));
  };

  const totalDebits = jvData.splits.reduce((s, row) => s + parseFloat(row.debit || 0), 0);
  const totalCredits = jvData.splits.reduce((s, row) => s + parseFloat(row.credit || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleSaveJv = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      alert(`Debits (${totalDebits}) and Credits (${totalCredits}) must match!`);
      return;
    }

    setJvSaving(true);
    try {
      const res = await callGAS('addJournalEntry', jvData);
      if (res.success) {
        setShowNewJvModal(false);
        setJvData({
          date: new Date().toISOString().substring(0, 10),
          entryType: 'Journal Entry',
          narration: '',
          splits: getInitialSplits(),
        });
        if (onRefresh) onRefresh();
      } else {
        alert(res.message || 'Error saving journal entry');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save journal voucher');
    } finally {
      setJvSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation & Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Accounting & General Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">Hierarchical Chart of Accounts, Journal Vouchers, and Ledger Statements</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSubTab('chart')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'chart' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chart of Accounts Tree
            </button>
            <button
              onClick={() => setSubTab('journal')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'journal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Journal Vouchers ({journalEntries.length})
            </button>
            <button
              onClick={() => setSubTab('ledger')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'ledger' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Account Ledger
            </button>
          </div>

          {subTab === 'journal' && (
            <button
              onClick={() => setShowNewJvModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-blue-100"
            >
              + Add JV
            </button>
          )}
        </div>
      </div>

      {/* 1. Collapsible Chart of Accounts Tree View */}
      {subTab === 'chart' && (
        <ChartOfAccountsTree
          accounts={accounts}
          onSelectAccount={handleSelectAccountFromTree}
        />
      )}

      {/* 2. Journal Vouchers View */}
      {subTab === 'journal' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px]">
                  <th className="py-3 px-4">JV #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Narration / Remark</th>
                  <th className="py-3 px-4">Account Splits (Debit / Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeJournalEntries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No journal entries found.
                    </td>
                  </tr>
                ) : (
                  safeJournalEntries.map((jv, idx) => {
                    if (!jv) return null;
                    const splits = Array.isArray(jv.splits) ? jv.splits : [];
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 align-top">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{jv.name || jv.EntryNo}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(jv.date || jv.Date)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                            {jv.entryType || jv.EntryType || 'JV'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{jv.userRemark || jv.Narration || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {splits.map((s, i) => s ? (
                              <div key={i} className="flex justify-between gap-4 font-mono text-[11px]">
                                <span className="font-sans text-slate-700">{s.account || s.AccountName}</span>
                                <div className="flex gap-3">
                                  {parseFloat(s.debit || s.Debit || 0) > 0 && (
                                    <span className="text-green-700 font-bold">Dr: {formatINR(s.debit || s.Debit)}</span>
                                  )}
                                  {parseFloat(s.credit || s.Credit || 0) > 0 && (
                                    <span className="text-red-700 font-bold">Cr: {formatINR(s.credit || s.Credit)}</span>
                                  )}
                                </div>
                              </div>
                            ) : null)}
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

      {/* 3. General Ledger Statement View */}
      {subTab === 'ledger' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Account</p>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="mt-1 rounded-xl border border-slate-200 p-2.5 text-xs font-bold bg-white min-w-64"
              >
                {safeAccounts.filter((a) => a && !a.isGroup).map((a, i) => (
                  <option key={i} value={a.name || a.AccountName}>
                    {a.name || a.AccountName} ({a.rootType || a.RootType})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadLedger(selectedLedgerAccount)}
              disabled={ledgerLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              {ledgerLoading ? 'Loading Statement...' : 'Refresh Statement'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4 text-right">Debit ({getCurrencySymbol(settings.currency)})</th>
                  <th className="py-3 px-4 text-right">Credit ({getCurrencySymbol(settings.currency)})</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No ledger transactions found for {selectedLedgerAccount}.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((row, idx) => row ? (
                    <tr key={idx} className="hover:bg-slate-50/70 font-mono">
                      <td className="py-2.5 px-4 font-sans text-slate-500">{formatDate(row.date)}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{row.entryNo}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">{row.narration || '-'}</td>
                      <td className="py-2.5 px-4 text-right text-green-700 font-bold">{row.debit > 0 ? formatINR(row.debit) : '-'}</td>
                      <td className="py-2.5 px-4 text-right text-red-700 font-bold">{row.credit > 0 ? formatINR(row.credit) : '-'}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatINR(row.balance)}</td>
                    </tr>
                  ) : null)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add JV Modal */}
      {showNewJvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 md:p-8">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Journal Voucher</h3>
              <button onClick={() => setShowNewJvModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveJv} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Date</label>
                  <input
                    type="date"
                    value={jvData.date}
                    onChange={(e) => setJvData({ ...jvData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Narration</label>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    value={jvData.narration}
                    onChange={(e) => setJvData({ ...jvData, narration: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              {/* Splits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase text-slate-600">Account Allocations</span>
                  <button type="button" onClick={handleAddSplitRow} className="text-blue-600 font-bold hover:underline">
                    + Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {jvData.splits.map((split, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <select
                        value={split.account}
                        onChange={(e) => handleSplitChange(i, 'account', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 p-1.5 text-xs bg-white"
                      >
                        {safeAccounts.filter((a) => a && !a.isGroup).map((a, idx) => (
                          <option key={idx} value={a.name || a.AccountName}>
                            {a.name || a.AccountName}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Debit"
                        value={split.debit || ''}
                        onChange={(e) => handleSplitChange(i, 'debit', e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 p-1.5 text-xs font-mono text-right"
                      />
                      <input
                        type="number"
                        placeholder="Credit"
                        value={split.credit || ''}
                        onChange={(e) => handleSplitChange(i, 'credit', e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 p-1.5 text-xs font-mono text-right"
                      />
                      {jvData.splits.length > 2 && (
                        <button type="button" onClick={() => handleRemoveSplitRow(i)} className="text-red-500 p-1">
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-mono font-bold">
                <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                  Total Debit: {formatINR(totalDebits)} | Total Credit: {formatINR(totalCredits)}
                </span>
                <span>{isBalanced ? '✓ Balanced' : '✗ Unbalanced'}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewJvModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || jvSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {jvSaving ? 'Saving...' : 'Save Journal Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingManager;
