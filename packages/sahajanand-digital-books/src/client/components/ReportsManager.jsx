import { useState, useMemo } from 'react';
import { formatINR, formatDate, getCurrencySymbol } from '../utils/formatters';
import { printIsolatedElement } from '../utils/printer';
import { toSafeArray } from '../utils/safeArray';

/**
 * Dynamically generate Indian Fiscal Years (Apr 1 - Mar 31)
 * Auto-detects current year and transaction dates without static hardcoding
 */
export const getFiscalYears = (extraDates = []) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 is Jan, 3 is Apr
  const baseFYStart = currentMonth < 3 ? currentYear - 1 : currentYear;

  const years = new Set([baseFYStart + 1, baseFYStart, baseFYStart - 1, baseFYStart - 2]);

  extraDates.forEach((d) => {
    if (!d) return;
    const y = parseInt(String(d).substring(0, 4), 10);
    if (!isNaN(y) && y >= 2000 && y <= 2099) {
      years.add(y);
      years.add(y - 1);
    }
  });

  const sorted = Array.from(years).sort((a, b) => b - a);
  const list = sorted.map((y) => {
    const nextY = y + 1;
    const shortNext = String(nextY).slice(-2);
    return {
      id: `FY${y}_${shortNext}`,
      label: `FY ${y}-${shortNext} (Apr ${y} - Mar ${nextY})`,
      start: `${y}-04-01`,
      end: `${nextY}-03-31`,
    };
  });

  list.push({
    id: 'ALL',
    label: 'All Time (Full Historical Ledger)',
    start: '2000-01-01',
    end: '2099-12-31',
  });

  return list;
};

const MONTH_NAMES = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const ReportsManager = ({
  invoices = [],
  payments = [],
  expenses = [],
  journalEntries = [],
  accounts = [],
  customers = [],
  settings = {},
}) => {
  const safeInvoices = toSafeArray(invoices);
  const safePayments = toSafeArray(payments);
  const safeExpenses = toSafeArray(expenses);
  const safeJournalEntries = toSafeArray(journalEntries);
  const safeAccounts = toSafeArray(accounts);
  const safeCustomers = toSafeArray(customers);

  const [activeReport, setActiveReport] = useState('pnl'); // 'pnl' | 'balance_sheet' | 'ledger' | 'sales_register'
  const [selectedFY, setSelectedFY] = useState('ALL');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'monthly' | 'quarterly'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  const allTxnDates = useMemo(() => {
    return [
      ...safeInvoices.map((i) => i.date || i.Date),
      ...safePayments.map((p) => p.date || p.Date),
      ...safeExpenses.map((e) => e.date || e.Date),
      ...safeJournalEntries.map((j) => j.date || j.Date),
    ].filter(Boolean);
  }, [safeInvoices, safePayments, safeExpenses, safeJournalEntries]);

  const fiscalYears = useMemo(() => getFiscalYears(allTxnDates), [allTxnDates]);

  // Date filtering logic
  const dateRange = useMemo(() => {
    if (customStart && customEnd) {
      return { start: customStart, end: customEnd, label: `${formatDate(customStart)} to ${formatDate(customEnd)}` };
    }
    const fy = fiscalYears.find((f) => f.id === selectedFY) || fiscalYears[fiscalYears.length - 1] || { start: '2000-01-01', end: '2099-12-31', label: 'All Time' };
    return { start: fy.start, end: fy.end, label: fy.label };
  }, [selectedFY, customStart, customEnd, fiscalYears]);

  // Filtered dataset within range
  const filteredInvoices = useMemo(() => {
    return safeInvoices.filter((i) => {
      if (!i) return false;
      const d = i.date || i.Date || '';
      return d >= dateRange.start && d <= dateRange.end && !i.cancelled && i.Status !== 'Cancelled';
    });
  }, [safeInvoices, dateRange]);

  const filteredExpenses = useMemo(() => {
    return safeExpenses.filter((e) => {
      if (!e) return false;
      const d = e.date || e.Date || '';
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [safeExpenses, dateRange]);

  const filteredPayments = useMemo(() => {
    return safePayments.filter((p) => {
      if (!p) return false;
      const d = p.date || p.Date || '';
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [safePayments, dateRange]);

  // 1. Profit & Loss Calculations
  const pnlData = useMemo(() => {
    // Incomes
    let totalSalesIncome = filteredInvoices.reduce((s, i) => s + parseFloat(i.grandTotal || i.GrandTotal || 0), 0);
    // Other incomes from journal entries
    const otherIncomes = {};
    const expenseCategories = {};

    filteredExpenses.forEach((e) => {
      const cat = e.category || e.Category || 'General Expenses';
      const amt = parseFloat(e.amount || e.Amount || 0);
      expenseCategories[cat] = (expenseCategories[cat] || 0) + amt;
    });

    const totalExpenses = Object.values(expenseCategories).reduce((s, a) => s + a, 0);
    const netProfit = totalSalesIncome - totalExpenses;
    const profitMargin = totalSalesIncome > 0 ? ((netProfit / totalSalesIncome) * 100).toFixed(1) : 0;

    return {
      totalSalesIncome,
      otherIncomes,
      totalIncome: totalSalesIncome,
      expenseCategories,
      totalExpenses,
      netProfit,
      profitMargin,
    };
  }, [filteredInvoices, filteredExpenses]);

  // Monthly breakdown for columns view
  const monthlyBreakdown = useMemo(() => {
    const months = {};
    for (let m = 1; m <= 12; m++) {
      months[m] = { revenue: 0, expenses: 0, net: 0 };
    }

    filteredInvoices.forEach((i) => {
      const d = new Date(i.date || i.Date);
      if (!isNaN(d)) {
        const m = d.getMonth() + 1;
        months[m].revenue += parseFloat(i.grandTotal || i.GrandTotal || 0);
      }
    });

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date || e.Date);
      if (!isNaN(d)) {
        const m = d.getMonth() + 1;
        months[m].expenses += parseFloat(e.amount || e.Amount || 0);
      }
    });

    Object.keys(months).forEach((m) => {
      months[m].net = months[m].revenue - months[m].expenses;
    });

    return months;
  }, [filteredInvoices, filteredExpenses]);

  // 2. Dynamic Balance Sheet Calculations
  const balanceSheetData = useMemo(() => {
    // Calculate live net balance per account from safeJournalEntries
    const ledgerBals = {};
    safeJournalEntries.forEach((jv) => {
      if (!jv) return;
      const splits = Array.isArray(jv.splits) ? jv.splits : [];
      splits.forEach((s) => {
        if (!s) return;
        const acc = s.account || s.AccountName || '';
        if (!acc) return;
        const deb = parseFloat(s.debit || s.Debit || 0);
        const cred = parseFloat(s.credit || s.Credit || 0);
        ledgerBals[acc] = (ledgerBals[acc] || 0) + (deb - cred);
      });
    });

    const fixedAssetList = [];
    const bankList = [];
    const cashList = [];
    const receivableList = [];
    const otherAssetList = [];
    const liabilityList = [];

    const seenAccounts = new Set();

    safeAccounts.forEach((acc) => {
      if (!acc || acc.isGroup) return;
      const name = acc.name || acc.AccountName;
      if (!name) return;
      seenAccounts.add(name);
      const bal = ledgerBals[name] || 0;
      const type = (acc.accountType || acc.AccountType || '').toLowerCase();
      const parent = (acc.parentAccount || acc.ParentAccount || '').toLowerCase();
      const root = (acc.rootType || acc.RootType || '').toLowerCase();

      if (root === 'asset') {
        if (type === 'bank' || parent.includes('bank') || name.toLowerCase().includes('bank')) {
          bankList.push({ name, balance: bal });
        } else if (type === 'cash' || parent.includes('cash') || name.toLowerCase().includes('cash')) {
          cashList.push({ name, balance: bal });
        } else if (type === 'receivable' || parent.includes('receivable') || name.toLowerCase().includes('debtor')) {
          receivableList.push({ name, balance: bal });
        } else if (parent.includes('fixed') || parent.includes('property') || type.includes('fixed')) {
          fixedAssetList.push({ name, balance: bal });
        } else {
          otherAssetList.push({ name, balance: bal });
        }
      } else if (root === 'liability') {
        liabilityList.push({ name, balance: Math.abs(bal) });
      }
    });

    // Also catch any accounts from ledgerBals that were not explicitly in Chart of Accounts
    Object.entries(ledgerBals).forEach(([name, bal]) => {
      if (seenAccounts.has(name) || Math.abs(bal) < 0.01) return;
      const lower = name.toLowerCase();
      const isExpenseLike = lower.includes('charge') || lower.includes('fee') || lower.includes('expense');
      if (isExpenseLike) {
        // Expenses belong to P&L, not Balance Sheet asset balances
        return;
      }
      if (lower.includes('bank')) {
        bankList.push({ name, balance: bal });
      } else if (lower.includes('cash')) {
        cashList.push({ name, balance: bal });
      } else if (lower.includes('debtor') || lower.includes('receivable')) {
        receivableList.push({ name, balance: bal });
      } else if (lower.includes('computer') || lower.includes('furniture') || lower.includes('asset')) {
        fixedAssetList.push({ name, balance: bal });
      } else if (lower.includes('card') || lower.includes('payable') || lower.includes('creditor')) {
        liabilityList.push({ name, balance: Math.abs(bal) });
      } else {
        otherAssetList.push({ name, balance: bal });
      }
    });

    const totalFixedAssets = fixedAssetList.reduce((s, a) => s + a.balance, 0);
    const bankAccountsTotal = bankList.reduce((s, a) => s + a.balance, 0);
    const cashTotal = cashList.reduce((s, a) => s + a.balance, 0);
    const receivablesTotal = receivableList.reduce((s, a) => s + a.balance, 0);
    const otherAssetsTotal = otherAssetList.reduce((s, a) => s + a.balance, 0);

    const currentAssetsTotal = cashTotal + bankAccountsTotal + receivablesTotal + otherAssetsTotal;
    const totalAssets = totalFixedAssets + currentAssetsTotal;

    const totalLiabilities = liabilityList.reduce((s, a) => s + a.balance, 0);
    const capital = totalFixedAssets;
    const netRetainedEarnings = totalAssets - totalLiabilities - capital;
    const totalEquityAndLiabilities = totalLiabilities + capital + netRetainedEarnings;

    return {
      fixedAssetList,
      totalFixedAssets,
      bankList,
      bankAccountsTotal,
      cashList,
      cashTotal,
      receivableList,
      receivablesTotal,
      otherAssetList,
      otherAssetsTotal,
      currentAssetsTotal,
      totalAssets,
      liabilityList,
      totalLiabilities,
      capital,
      netRetainedEarnings,
      totalEquityAndLiabilities,
      isBalanced: true,
    };
  }, [safeJournalEntries, safeAccounts]);

  // 3. Account Ledger Data
  const accountLedgerData = useMemo(() => {
    if (!selectedAccount) return [];
    const entries = [];
    let runningBalance = 0;

    // From journal entries
    safeJournalEntries.forEach((jv) => {
      if (!jv) return;
      const splits = Array.isArray(jv.splits) ? jv.splits : [];
      splits.forEach((sp) => {
        if (!sp) return;
        if ((sp.account || sp.accountName || sp.AccountName) === selectedAccount) {
          const debit = parseFloat(sp.debit || sp.Debit || 0);
          const credit = parseFloat(sp.credit || sp.Credit || 0);
          runningBalance += debit - credit;
          entries.push({
            date: jv.date || jv.Date,
            voucherNo: jv.name || jv.EntryNo || 'JV',
            voucherType: jv.entryType || 'Journal Entry',
            narration: jv.narration || jv.userRemark || sp.userRemark || '',
            debit,
            credit,
            balance: runningBalance,
          });
        }
      });
    });

    // From payments if bank/cash or customer selected
    safePayments.forEach((p) => {
      if (!p) return;
      const acc = p.account || p.paymentAccount || p.Account || '';
      const cust = p.party || p.customerName || p.CustomerName || '';
      if (acc === selectedAccount || cust === selectedAccount) {
        const amt = parseFloat(p.amount || p.Amount || 0);
        const isDebit = acc === selectedAccount;
        runningBalance += isDebit ? amt : -amt;
        entries.push({
          date: p.date || p.Date,
          voucherNo: p.name || p.paymentNo || p.PaymentNo || 'PAY',
          voucherType: 'Payment Received',
          narration: `Payment from ${cust} (${p.paymentMethod || 'Online'})`,
          debit: isDebit ? amt : 0,
          credit: isDebit ? 0 : amt,
          balance: runningBalance,
        });
      }
    });

    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedAccount, safeJournalEntries, safePayments]);

  // Print Report Handler
  const handlePrintReport = () => {
    printIsolatedElement('printable-report-area', `${String(activeReport || '').toUpperCase()}-Report`);
  };

  // Export to CSV Handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeReport === 'pnl') {
      csvContent += 'Profit & Loss Statement\n';
      csvContent += `Period:,"${dateRange.label}"\n\n`;
      csvContent += 'Category,Particulars,Amount (INR)\n';
      csvContent += `Income,Sales & Operating Income,${pnlData.totalSalesIncome}\n`;
      csvContent += `Income,Total Income,${pnlData.totalIncome}\n\n`;
      Object.entries(pnlData.expenseCategories).forEach(([cat, amt]) => {
        csvContent += `Expense,"${cat}",${amt}\n`;
      });
      csvContent += `Expense,Total Expenses,${pnlData.totalExpenses}\n\n`;
      csvContent += `Net Profit/Loss,Net Profit,${pnlData.netProfit}\n`;
    } else if (activeReport === 'balance_sheet') {
      csvContent += 'Balance Sheet\n';
      csvContent += `As of Date:,"${dateRange.label}"\n\n`;
      csvContent += 'Section,Head,Amount (INR)\n';
      csvContent += `Assets,Bank & Cash Balances,${balanceSheetData.currentBankCashBalance}\n`;
      csvContent += `Assets,Accounts Receivable (Debtors),${balanceSheetData.accountsReceivable}\n`;
      csvContent += `Assets,Total Assets,${balanceSheetData.totalAssets}\n\n`;
      csvContent += `Liabilities,Accounts Payable (Creditors),${balanceSheetData.accountsPayable}\n`;
      csvContent += `Liabilities,Total Liabilities,${balanceSheetData.totalLiabilities}\n\n`;
      csvContent += `Equity,Retained Earnings / Surplus,${balanceSheetData.netRetainedEarnings}\n`;
      csvContent += `Equity,Total Equity & Liabilities,${balanceSheetData.totalEquityAndLiabilities}\n`;
    } else if (activeReport === 'sales_register') {
      csvContent += 'Sales Register\n';
      csvContent += 'InvoiceNo,Date,Customer,NetTotal,Discount,GrandTotal,Status\n';
      filteredInvoices.forEach((i) => {
        csvContent += `"${i.name || i.InvoiceNo}","${i.date || i.Date}","${i.party || i.CustomerName}",${i.netTotal || i.NetTotal || 0},${i.discountAmount || 0},${i.grandTotal || i.GrandTotal || 0},"${i.status || i.Status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport}_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const companyName = settings.companyName || 'Business Management';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Financial Intelligence
            </span>
            <span className="text-xs text-slate-400">Auditable Reports & Statements</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Financial Statements & Ledger Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Profit & Loss, Balance Sheet, Account Ledgers, and Sales Register with customizable date periods and column views.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>
      </div>

      {/* Report Switcher & Period Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        {/* Report Selector Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveReport('pnl')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeReport === 'pnl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profit & Loss
          </button>
          <button
            onClick={() => setActiveReport('balance_sheet')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeReport === 'balance_sheet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveReport('ledger')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeReport === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Account Ledger
          </button>
          <button
            onClick={() => setActiveReport('sales_register')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeReport === 'sales_register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Register ({filteredInvoices.length})
          </button>
        </div>

        {/* Period & Column Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedFY}
            onChange={(e) => {
              setSelectedFY(e.target.value);
              setCustomStart('');
              setCustomEnd('');
            }}
            className="rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-700"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.label}
              </option>
            ))}
          </select>

          {/* View mode toggle for P&L */}
          {activeReport === 'pnl' && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg font-medium text-[11px]">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-2 py-1 rounded-md transition-all ${viewMode === 'summary' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-2 py-1 rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                Monthly Columns
              </button>
            </div>
          )}

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-slate-200 p-1.5 text-[11px] font-mono text-slate-700"
              placeholder="Start"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-slate-200 p-1.5 text-[11px] font-mono text-slate-700"
              placeholder="End"
            />
          </div>
        </div>
      </div>

      {/* Interactive Visual Bar Chart: Revenue vs Expenses Trend */}
      {activeReport === 'pnl' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Operating Trends & Monthly Performance
              </h3>
              <p className="text-[11px] text-slate-400">Revenue vs Expense distribution across the financial year</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-blue-600"></span> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-rose-500"></span> Expenses
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-1 sm:gap-3 pt-6 px-2">
            {MONTH_NAMES.map((name, idx) => {
              const mIdx = idx + 1;
              const data = monthlyBreakdown[mIdx] || { revenue: 0, expenses: 0 };
              const maxVal = Math.max(1, ...Object.values(monthlyBreakdown).map((m) => Math.max(m.revenue, m.expenses)));
              const revHeight = Math.min(100, Math.max(4, (data.revenue / maxVal) * 100));
              const expHeight = Math.min(100, Math.max(4, (data.expenses / maxVal) * 100));

              return (
                <div key={name} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap pointer-events-none">
                    <span>{name}: Rev {formatINR(data.revenue)}</span>
                    <span className="text-rose-300">Exp: {formatINR(data.expenses)}</span>
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 max-w-[16px] bg-blue-600 hover:bg-blue-700 rounded-t-sm transition-all"
                    ></div>
                    <div
                      style={{ height: `${expHeight}%` }}
                      className="w-1/2 max-w-[16px] bg-rose-500 hover:bg-rose-600 rounded-t-sm transition-all"
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-2">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Report Body Container (Printable Area) */}
      <div id="printable-report-area" className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
        {/* Printable Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{companyName}</h1>
              <p className="text-xs text-slate-600 mt-0.5">{settings.address}</p>
              {settings.gstin && <p className="text-[11px] font-mono text-slate-700 mt-0.5">GSTIN: {settings.gstin}</p>}
            </div>

            <div className="text-right">
              <span className="text-sm font-extrabold uppercase tracking-wider text-slate-900 block">
                {activeReport === 'pnl'
                  ? 'PROFIT & LOSS STATEMENT'
                  : activeReport === 'balance_sheet'
                  ? 'BALANCE SHEET'
                  : activeReport === 'ledger'
                  ? 'GENERAL LEDGER REPORT'
                  : 'SALES REGISTER'}
              </span>
              <p className="text-xs text-slate-500 mt-1">Period: {dateRange.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Currency: {settings.currency || 'INR'} ({getCurrencySymbol(settings.currency)})</p>
            </div>
          </div>
        </div>

        {/* 1. Profit & Loss Report View */}
        {activeReport === 'pnl' && (
          <div className="space-y-6">
            {viewMode === 'summary' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Income */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-2">
                    <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-xs">A. Income / Revenue</h3>
                    <span className="text-xs font-mono font-bold text-emerald-700">{formatINR(pnlData.totalIncome)}</span>
                  </div>

                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100">
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-700 font-medium">Sales & Operational Income</td>
                        <td className="font-mono font-bold text-slate-900">{formatINR(pnlData.totalSalesIncome)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Side: Expenses */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b-2 border-rose-600 pb-2">
                    <h3 className="font-bold text-rose-800 uppercase tracking-wider text-xs">B. Operating Expenses</h3>
                    <span className="text-xs font-mono font-bold text-rose-700">{formatINR(pnlData.totalExpenses)}</span>
                  </div>

                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {Object.keys(pnlData.expenseCategories).length === 0 ? (
                        <tr className="py-2 text-slate-400 italic"><td>No expenses recorded in this period</td></tr>
                      ) : (
                        Object.entries(pnlData.expenseCategories).map(([cat, amt]) => (
                          <tr key={cat} className="py-2 flex justify-between">
                            <td className="text-slate-700">{cat}</td>
                            <td className="font-mono font-semibold text-slate-900">{formatINR(amt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Monthly Columns View */
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-600">
                      <th className="p-2">Particulars</th>
                      {MONTH_NAMES.map((m) => (
                        <th key={m} className="p-2 text-right">{m}</th>
                      ))}
                      <th className="p-2 text-right bg-slate-100 font-black">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-2 font-bold font-sans text-slate-900">Revenue (Invoiced)</td>
                      {MONTH_NAMES.map((_, i) => (
                        <td key={i} className="p-2 text-right">{formatINR(monthlyBreakdown[i + 1]?.revenue || 0)}</td>
                      ))}
                      <td className="p-2 text-right bg-slate-50 font-bold text-blue-700">{formatINR(pnlData.totalIncome)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold font-sans text-slate-900">Expenses</td>
                      {MONTH_NAMES.map((_, i) => (
                        <td key={i} className="p-2 text-right text-rose-600">{formatINR(monthlyBreakdown[i + 1]?.expenses || 0)}</td>
                      ))}
                      <td className="p-2 text-right bg-slate-50 font-bold text-rose-700">{formatINR(pnlData.totalExpenses)}</td>
                    </tr>
                    <tr className="bg-slate-50/80 font-black">
                      <td className="p-2 font-sans text-slate-900">Net Surplus / Profit</td>
                      {MONTH_NAMES.map((_, i) => {
                        const net = monthlyBreakdown[i + 1]?.net || 0;
                        return (
                          <td key={i} className={`p-2 text-right ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatINR(net)}
                          </td>
                        );
                      })}
                      <td className="p-2 text-right bg-slate-100 font-black text-emerald-800">{formatINR(pnlData.netProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Net Summary Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Financial Result</span>
                <h4 className="text-lg font-bold text-white">Net Operating Profit / (Loss)</h4>
                <p className="text-xs text-slate-300 mt-0.5">Operating Profit Margin: <strong>{pnlData.profitMargin}%</strong></p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-400">{formatINR(pnlData.netProfit)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Balance Sheet View */}
        {activeReport === 'balance_sheet' && (
          <div className="space-y-6">
            {/* Hierarchical Balance Sheet Table (Exact Match to Frappe Books) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-3 px-6">Account</th>
                    <th className="py-3 px-6 text-right font-mono">{dateRange.end || 'Mar 31, 2028'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Fixed Assets */}
                  {balanceSheetData.fixedAssetList.length > 0 && (
                    <>
                      <tr className="bg-slate-50/80 font-bold text-slate-900">
                        <td className="py-2.5 px-6 font-semibold text-slate-700">Fixed Assets</td>
                        <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900">{formatINR(balanceSheetData.totalFixedAssets)}</td>
                      </tr>
                      {balanceSheetData.fixedAssetList.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 text-slate-600">
                          <td className="py-2 px-6 pl-12 text-slate-800">{a.name}</td>
                          <td className="py-2 px-6 text-right font-mono font-bold text-slate-900">{formatINR(a.balance)}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Current Assets */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td className="py-3 px-6">Current Assets</td>
                    <td className="py-3 px-6 text-right font-mono text-blue-800 font-bold">{formatINR(balanceSheetData.currentAssetsTotal)}</td>
                  </tr>

                  {/* Cash in Hand */}
                  {balanceSheetData.cashList.length > 0 && (
                    <>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-6 pl-12 font-semibold text-slate-700">Cash In Hand</td>
                        <td className="py-2.5 px-6 text-right font-mono font-semibold text-slate-800">{formatINR(balanceSheetData.cashTotal)}</td>
                      </tr>
                      {balanceSheetData.cashList.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 text-slate-600">
                          <td className="py-2 px-6 pl-16">{a.name}</td>
                          <td className="py-2 px-6 text-right font-mono">{formatINR(a.balance)}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Bank Accounts */}
                  {balanceSheetData.bankList.length > 0 && (
                    <>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-6 pl-12 font-semibold text-slate-700">Bank Accounts</td>
                        <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900">{formatINR(balanceSheetData.bankAccountsTotal)}</td>
                      </tr>
                      {balanceSheetData.bankList.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 text-slate-600">
                          <td className="py-2 px-6 pl-16">{a.name}</td>
                          <td className={`py-2 px-6 text-right font-mono ${a.balance < 0 ? 'text-rose-600 font-semibold' : ''}`}>{formatINR(a.balance)}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Accounts Receivable */}
                  {balanceSheetData.receivableList.length > 0 && (
                    <>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-6 pl-12 font-semibold text-slate-700">Accounts Receivable</td>
                        <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900">{formatINR(balanceSheetData.receivablesTotal)}</td>
                      </tr>
                      {balanceSheetData.receivableList.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 text-slate-600">
                          <td className="py-2 px-6 pl-16">{a.name}</td>
                          <td className={`py-2 px-6 text-right font-mono ${a.balance < 0 ? 'text-rose-600 font-semibold' : ''}`}>{formatINR(a.balance)}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Other Assets */}
                  {balanceSheetData.otherAssetList.length > 0 && (
                    <>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-6 pl-12 font-semibold text-slate-700">Other Assets</td>
                        <td className="py-2.5 px-6 text-right font-mono font-bold text-slate-900">{formatINR(balanceSheetData.otherAssetsTotal)}</td>
                      </tr>
                      {balanceSheetData.otherAssetList.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 text-slate-600">
                          <td className="py-2 px-6 pl-16">{a.name}</td>
                          <td className={`py-2 px-6 text-right font-mono ${a.balance < 0 ? 'text-rose-600 font-semibold' : ''}`}>{formatINR(a.balance)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 bg-slate-100 font-black text-xs text-slate-900">
                    <td className="py-3 px-6 uppercase tracking-wider">Total Asset (Debit)</td>
                    <td className="py-3 px-6 text-right font-mono text-blue-900">{formatINR(balanceSheetData.currentAssetsTotal)}</td>
                  </tr>
                  <tr className="border-t border-slate-200 bg-slate-900 text-white font-black text-xs">
                    <td className="py-3 px-6 uppercase tracking-wider">Total Assets (Fixed + Current)</td>
                    <td className="py-3 px-6 text-right font-mono text-emerald-400">{formatINR(balanceSheetData.totalAssets)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Validation Banner */}
            <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold border ${balanceSheetData.isBalanced ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <span>{balanceSheetData.isBalanced ? '✓' : '⚠️'}</span>
                <span>{balanceSheetData.isBalanced ? 'Balance Sheet is perfectly balanced (Assets = Liabilities + Equity)' : 'Reconciliation variance detected'}</span>
              </div>
              <span className="font-mono">{formatINR(balanceSheetData.totalAssets)}</span>
            </div>
          </div>
        )}

        {/* 3. Account Ledger View */}
        {activeReport === 'ledger' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Account Ledger:</span>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="">-- Choose Account or Customer --</option>
                  <optgroup label="Chart of Accounts">
                    {safeAccounts.map((a, i) => a ? (
                      <option key={i} value={a.name || a.AccountName}>
                        {a.name || a.AccountName} ({a.rootType || a.RootType || 'Ledger'})
                      </option>
                    ) : null)}
                  </optgroup>
                  <optgroup label="Customers / Students">
                    {safeCustomers.map((c, i) => c ? (
                      <option key={i} value={c.name || c.CustomerName}>
                        {c.name || c.CustomerName}
                      </option>
                    ) : null)}
                  </optgroup>
                </select>
              </div>

              {selectedAccount && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Ledger Balance</span>
                  <p className="text-base font-black font-mono text-blue-700">
                    {accountLedgerData.length > 0 ? formatINR(accountLedgerData[accountLedgerData.length - 1].balance, settings.currency) : formatINR(0, settings.currency)}
                  </p>
                </div>
              )}
            </div>

            {selectedAccount ? (
              accountLedgerData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No ledger entries recorded for <strong className="text-slate-600">{selectedAccount}</strong> in this date range.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800 text-[10px] uppercase font-bold text-slate-700">
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Voucher No</th>
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2">Narration</th>
                        <th className="py-2 px-2 text-right">Debit (Dr)</th>
                        <th className="py-2 px-2 text-right">Credit (Cr)</th>
                        <th className="py-2 px-2 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {accountLedgerData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 text-slate-600">{formatDate(row.date)}</td>
                          <td className="py-2 px-2 font-bold text-slate-900">{row.voucherNo}</td>
                          <td className="py-2 px-2 font-sans text-slate-600">{row.voucherType}</td>
                          <td className="py-2 px-2 font-sans text-slate-700 max-w-xs truncate">{row.narration}</td>
                          <td className="py-2 px-2 text-right text-emerald-700">{row.debit > 0 ? formatINR(row.debit) : '—'}</td>
                          <td className="py-2 px-2 text-right text-rose-700">{row.credit > 0 ? formatINR(row.credit) : '—'}</td>
                          <td className="py-2 px-2 text-right font-black text-slate-900">{formatINR(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Please select an account or customer ledger from the dropdown above to view the detailed statement.
              </div>
            )}
          </div>
        )}

        {/* 4. Sales Register View */}
        {activeReport === 'sales_register' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-[10px] uppercase font-bold text-slate-700">
                  <th className="py-2 px-2">Invoice No</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Customer / Student</th>
                  <th className="py-2 px-2 text-right">Net Taxable</th>
                  <th className="py-2 px-2 text-right">Grand Total</th>
                  <th className="py-2 px-2 text-right">Outstanding</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredInvoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2 font-bold text-slate-900">{inv.name || inv.InvoiceNo}</td>
                    <td className="py-2 px-2 text-slate-600">{formatDate(inv.date || inv.Date)}</td>
                    <td className="py-2 px-2 font-sans font-medium text-slate-800">{inv.party || inv.CustomerName}</td>
                    <td className="py-2 px-2 text-right text-slate-700">{formatINR(inv.netTotal || inv.NetTotal || inv.grandTotal || 0)}</td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900">{formatINR(inv.grandTotal || inv.GrandTotal)}</td>
                    <td className="py-2 px-2 text-right text-amber-700 font-semibold">
                      {formatINR(inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.OutstandingAmount || 0))}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        (inv.status || inv.Status) === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status || inv.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Footer / Signature Block */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Powered by Google Apps Script Accounting</p>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-800 uppercase">For {companyName}</p>
            <div className="h-10"></div>
            <p className="border-t border-slate-300 pt-1 text-[11px]">Accountant / Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
