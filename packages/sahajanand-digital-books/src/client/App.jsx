import { useState, useEffect, useCallback } from 'react';
import { callGAS } from './GAS';
import { syncOfflineData, getOfflineQueue } from './utils/offlineSync';
import { getTerminology } from './utils/terminology';
import { toSafeArray } from './utils/safeArray';
import { setAppCurrency } from './utils/formatters';
import Dashboard from './components/Dashboard';
import InvoiceManager from './components/InvoiceManager';
import PaymentManager from './components/PaymentManager';
import ExpenseManager from './components/ExpenseManager';
import AccountingManager from './components/AccountingManager';
import ReportsManager from './components/ReportsManager';
import CustomerManager from './components/CustomerManager';
import ItemCatalog from './components/ItemCatalog';
import SettingsManager from './components/SettingsManager';
import TemplateCustomizer from './components/TemplateCustomizer';
import MigrationTool from './components/MigrationTool';
import InvoiceViewer from './components/InvoiceViewer';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'invoices' | 'payments' | 'expenses' | 'accounting' | 'reports' | 'customers' | 'services' | 'settings' | 'migration' | 'template_customizer'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Quick modals
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  // Sync state (matching gurukul-account-manager)
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'done'

  const terminology = getTerminology(settings.organizationType || 'business');

  const performSync = async () => {
    if (!navigator.onLine || getOfflineQueue().length === 0) return;
    setSyncStatus('syncing');
    try {
      await syncOfflineData();
      setOfflineCount(getOfflineQueue().length);
      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 3000);
      loadAllData();
    } catch (e) {
      console.error('Sync failed:', e);
      setSyncStatus('idle');
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setOfflineCount(getOfflineQueue().length);
      if (navigator.onLine) performSync();
    };

    window.addEventListener('online', handleOnline);
    setOfflineCount(getOfflineQueue().length);

    const interval = setInterval(() => {
      const q = getOfflineQueue().length;
      setOfflineCount(q);
      if (navigator.onLine && q > 0 && syncStatus === 'idle') {
        performSync();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [syncStatus]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, payRes, expRes, custRes, itmRes, accRes, jvRes, setRes] = await Promise.all([
        callGAS('getInvoices'),
        callGAS('getPayments'),
        callGAS('getExpenses'),
        callGAS('getCustomers'),
        callGAS('getItems'),
        callGAS('getChartOfAccounts'),
        callGAS('getJournalEntries'),
        callGAS('getAppSettings'),
      ]);

      setInvoices(toSafeArray(invRes));
      setPayments(toSafeArray(payRes));
      setExpenses(toSafeArray(expRes));
      setCustomers(toSafeArray(custRes));
      setItems(toSafeArray(itmRes));
      setAccounts(toSafeArray(accRes));
      setJournalEntries(toSafeArray(jvRes));
      if (setRes) {
        try {
          const parsed = typeof setRes === 'string' ? JSON.parse(setRes) : setRes;
          if (parsed && typeof parsed === 'object') {
            setSettings(parsed);
            if (parsed.currency) setAppCurrency(parsed.currency);
          }
        } catch (e) {
          console.error('Error parsing settings:', e);
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getCustomerForInvoice = (inv) => {
    if (!inv) return null;
    const partyName = inv.party || inv.CustomerName;
    return customers.find((c) => (c.name || c.CustomerName) === partyName) || null;
  };

  const companyDisplayName = settings.companyName || (terminology.isInstitute ? 'Educational Academy' : 'Digital Books');

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section (UI reference from gurukul-account-manager) */}
        <header className="no-print flex flex-col md:flex-row items-center justify-between mb-6 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          {syncStatus === 'syncing' && (
            <div className="absolute top-0 left-0 h-1 bg-blue-500 w-full animate-pulse"></div>
          )}

          <div className="flex items-center gap-4 mb-4 md:mb-0">
            {settings.website ? (
              <a href={settings.website} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center">
                {settings.logoUrl ? (
                  <img
                    className="h-10 md:h-12 w-auto object-contain rounded-lg"
                    src={settings.logoUrl}
                    alt={companyDisplayName}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                    {String(companyDisplayName || '').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </a>
            ) : (
              <div className="shrink-0 flex items-center">
                {settings.logoUrl ? (
                  <img
                    className="h-10 md:h-12 w-auto object-contain rounded-lg"
                    src={settings.logoUrl}
                    alt={companyDisplayName}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                    {String(companyDisplayName || '').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            )}
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                {companyDisplayName}
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-full bg-blue-100 text-blue-700">
                  {terminology.isInstitute ? 'Institute Books' : 'Books'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Accounting, Invoices, Expenses, Reports & General Ledger</p>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <div className="flex items-center gap-3">
              {syncStatus === 'syncing' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 animate-pulse">
                  Syncing to Google Sheets...
                </div>
              )}
              {syncStatus === 'done' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                  ✓ Database Synced
                </div>
              )}
              {offlineCount > 0 && syncStatus !== 'syncing' && (
                <button
                  onClick={performSync}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100"
                >
                  {offlineCount} Pending Sync
                </button>
              )}
              <button
                onClick={loadAllData}
                disabled={loading}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                title="Refresh Data"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="text-right hidden md:block text-slate-500 text-xs font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Navigation Tabs (UI reference from gurukul-account-manager) */}
        <div className="no-print flex flex-wrap gap-1.5 sm:gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {terminology.invoices} ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'payments' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payments ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses' ? 'bg-rose-600 text-white shadow-md shadow-rose-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expenses ({expenses.length})
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'accounting' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Accounting & Ledger
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'customers' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {terminology.customers} ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'services' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {terminology.items} ({items.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'migration' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Migration
          </button>
        </div>

        {/* Tab Content Body */}
        <main>
          {activeTab === 'dashboard' && (
            <Dashboard
              invoices={invoices}
              payments={payments}
              expenses={expenses}
              journalEntries={journalEntries}
              customers={customers}
              accounts={accounts}
              settings={settings}
              onViewInvoice={(inv) => setViewingInvoice(inv)}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceManager
              invoices={invoices}
              customers={customers}
              items={items}
              settings={settings}
              onRefresh={loadAllData}
              onOpenPaymentModal={(inv) => setPaymentModalInvoice(inv)}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentManager
              payments={payments}
              invoices={invoices}
              customers={customers}
              accounts={accounts}
              settings={settings}
              onPaymentAdded={loadAllData}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseManager
              expenses={expenses}
              accounts={accounts}
              settings={settings}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingManager
              accounts={accounts}
              journalEntries={journalEntries}
              settings={settings}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsManager
              invoices={invoices}
              payments={payments}
              expenses={expenses}
              journalEntries={journalEntries}
              accounts={accounts}
              customers={customers}
              settings={settings}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManager
              customers={customers}
              onCustomerAdded={loadAllData}
            />
          )}

          {activeTab === 'services' && (
            <ItemCatalog
              items={items}
              settings={settings}
              onItemAdded={loadAllData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsManager
              settings={settings}
              onSettingsSaved={(newSettings) => {
                setSettings(newSettings);
                if (newSettings.currency) setAppCurrency(newSettings.currency);
              }}
              onOpenCustomizer={() => setActiveTab('template_customizer')}
            />
          )}

          {activeTab === 'template_customizer' && (
            <TemplateCustomizer
              settings={settings}
              onSettingsSaved={(newSettings) => setSettings(newSettings)}
              onBack={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'migration' && (
            <MigrationTool
              onDataImported={loadAllData}
              onNavigateDashboard={() => setActiveTab('dashboard')}
            />
          )}
        </main>

        {/* Payment Modal opened from Invoices tab */}
        {paymentModalInvoice && (
          <PaymentManager
            payments={payments}
            invoices={invoices}
            customers={customers}
            accounts={accounts}
            settings={settings}
            initialInvoice={paymentModalInvoice}
            onPaymentAdded={() => {
              setPaymentModalInvoice(null);
              loadAllData();
            }}
            onCloseModal={() => setPaymentModalInvoice(null)}
          />
        )}

        {/* Global Invoice Print Viewer Modal */}
        {viewingInvoice && (
          <InvoiceViewer
            invoice={viewingInvoice}
            customer={getCustomerForInvoice(viewingInvoice)}
            settings={settings}
            onClose={() => setViewingInvoice(null)}
            onOpenCustomizer={() => setActiveTab('template_customizer')}
          />
        )}

        {/* Footer (Reference from gurukul-account-manager) */}
        <footer className="no-print mt-16 pb-8 text-center border-t border-slate-200 pt-8">
          <p className="text-slate-500 mb-4 font-medium italic text-xs">
            {companyDisplayName} • Powered by Google Apps Script & React
          </p>
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={companyDisplayName}
              className="w-28 h-auto mx-auto grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </footer>
      </div>
    </div>
  );
};

export default App;
