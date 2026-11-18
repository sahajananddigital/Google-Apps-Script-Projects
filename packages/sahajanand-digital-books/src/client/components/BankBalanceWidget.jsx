import { useMemo } from 'react';
import { formatINR } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';

const GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-800',
  'from-purple-600 to-indigo-800',
  'from-slate-700 to-slate-900',
];

const BankBalanceWidget = ({ payments = [], expenses = [], journalEntries = [], accounts = [], settings = {} }) => {
  const safePayments = toSafeArray(payments);
  const safeExpenses = toSafeArray(expenses);
  const safeJournalEntries = toSafeArray(journalEntries);
  const safeAccounts = toSafeArray(accounts);

  // Dynamically build the list of Bank & Cash accounts
  const bankAccounts = useMemo(() => {
    const list = [];
    const addedNames = new Set();

    // 1. Primary Bank from settings
    if (settings.primaryBankName && !addedNames.has(settings.primaryBankName)) {
      list.push({
        id: 'primary',
        name: settings.primaryBankName,
        branch: settings.primaryBankBranch || 'Primary Branch',
        accountNo: settings.primaryAccountNo ? String(settings.primaryAccountNo) : '',
        ifsc: settings.primaryIfsc || '',
        upi: settings.primaryUpiId || '',
        type: `${settings.primaryAccountType || 'Primary'} Account`,
        gradient: GRADIENTS[0],
      });
      addedNames.add(settings.primaryBankName);
    }

    // 2. Secondary Bank from settings
    if (settings.secondaryBankName && !addedNames.has(settings.secondaryBankName)) {
      list.push({
        id: 'secondary',
        name: settings.secondaryBankName,
        branch: settings.secondaryBankBranch || 'Secondary Branch',
        accountNo: settings.secondaryAccountNo ? String(settings.secondaryAccountNo) : '',
        ifsc: settings.secondaryIfsc || '',
        upi: settings.secondaryUpiId || '',
        type: `${settings.secondaryAccountType || 'Secondary'} Account`,
        gradient: GRADIENTS[1],
      });
      addedNames.add(settings.secondaryBankName);
    }

    // 3. Accounts from Chart of Accounts
    safeAccounts.forEach((a) => {
      if (!a) return;
      const name = a.name || a.AccountName;
      const type = String(a.accountType || a.AccountType || '').toLowerCase();
      const parent = String(a.parentAccount || a.ParentAccount || '').toLowerCase();

      if (!a.isGroup && (type === 'bank' || type === 'cash' || parent.includes('bank') || parent.includes('cash'))) {
        if (name && !addedNames.has(name)) {
          list.push({
            id: `acc-${name}`,
            name: name,
            branch: 'Ledger Account',
            accountNo: '',
            ifsc: '',
            upi: '',
            type: type === 'cash' ? 'Cash Account' : 'Bank Account',
            gradient: GRADIENTS[list.length % GRADIENTS.length],
          });
          addedNames.add(name);
        }
      }
    });

    // 4. Always include Cash In Hand if not present
    if (!addedNames.has('Cash In Hand') && !addedNames.has('Cash')) {
      list.push({
        id: 'cash-in-hand',
        name: 'Cash In Hand',
        branch: 'Office Cash',
        accountNo: '',
        ifsc: '',
        upi: '',
        type: 'Cash Register',
        gradient: GRADIENTS[list.length % GRADIENTS.length],
      });
    }

    return list;
  }, [safeAccounts, settings]);

  const calculateBalance = (accountName) => {
    let balance = 0;
    const nameLower = String(accountName || '').toLowerCase();

    // Inflow from payments
    safePayments.forEach((p) => {
      if (!p) return;
      const acc = String(p.paymentAccount || p.account || p.Account || '').toLowerCase();
      if (acc === nameLower || acc.includes(nameLower) || nameLower.includes(acc)) {
        balance += parseFloat(p.amount || p.Amount || 0);
      }
    });

    // Outflow from expenses
    safeExpenses.forEach((e) => {
      if (!e) return;
      const acc = String(e.paidVia || e.PaidVia || '').toLowerCase();
      if (acc === nameLower || acc.includes(nameLower) || nameLower.includes(acc)) {
        balance -= parseFloat(e.amount || e.Amount || 0);
      }
    });

    // Flow from Journal Entries
    safeJournalEntries.forEach((jv) => {
      if (!jv) return;
      const splits = Array.isArray(jv.splits) ? jv.splits : [];
      splits.forEach((s) => {
        if (!s) return;
        const acc = String(s.account || s.AccountName || '').toLowerCase();
        if (acc === nameLower || acc.includes(nameLower) || nameLower.includes(acc)) {
          balance += parseFloat(s.debit || s.Debit || 0) - parseFloat(s.credit || s.Credit || 0);
        }
      });
    });

    return balance;
  };

  const totalLiquidity = bankAccounts.reduce((sum, acc) => sum + calculateBalance(acc.name), 0);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            Bank & Cash Balances
            <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-full bg-slate-100 text-slate-600">
              Live Reconciliation
            </span>
          </h3>
          <p className="text-xs text-slate-500">Available funds calculated from customer deposits, business expenses, and ledger entries</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Liquidity:</span>
          <p className="text-lg font-black text-slate-900 font-mono">{formatINR(totalLiquidity)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map((acc) => {
          const bal = calculateBalance(acc.name);

          return (
            <div
              key={acc.id}
              className={`rounded-2xl p-4 text-white bg-gradient-to-br ${acc.gradient} shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {acc.type}
                  </span>
                  <h4 className="font-extrabold text-sm text-white tracking-tight leading-snug">
                    {acc.name}
                  </h4>
                  {acc.branch && <p className="text-[10px] text-white/80">{acc.branch}</p>}
                </div>
                <div className="p-1.5 bg-white/20 backdrop-blur-xs rounded-xl text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/20 flex justify-between items-end">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/70">Available Balance</p>
                  <p className="text-xl font-black font-mono tracking-tight text-white">
                    {formatINR(bal)}
                  </p>
                </div>
                {Boolean(acc.accountNo) && (
                  <span className="text-[9px] font-mono text-white/80 bg-black/20 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                    •••• {String(acc.accountNo).trim().slice(-4)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BankBalanceWidget;
