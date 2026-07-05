import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import UserRegistry from './components/UserRegistry';
import FormsContainer from './components/FormsContainer';
import { syncOfflineData, getOfflineQueue } from './utils/offlineSync';

const App = () => {
  const [activeTab, setActiveTab] = useState('forms'); // 'forms', 'dashboard', 'registry'
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'done'

  const performSync = async () => {
    if (!navigator.onLine || getOfflineQueue().length === 0) return;
    
    setSyncStatus('syncing');
    try {
      await syncOfflineData();
      setOfflineCount(getOfflineQueue().length);
      setSyncStatus('done');
      
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus('idle');
    }
  };

  useEffect(() => {
    const handleSync = () => {
      setOfflineCount(getOfflineQueue().length);
      if (navigator.onLine) performSync();
    };

    window.addEventListener('online', handleSync);
    const count = getOfflineQueue().length;
    setOfflineCount(count);
    if (navigator.onLine && count > 0) performSync();

    const interval = setInterval(() => {
      setOfflineCount(getOfflineQueue().length);
      if (navigator.onLine && getOfflineQueue().length > 0 && syncStatus === 'idle') {
        performSync();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleSync);
      clearInterval(interval);
    };
  }, [syncStatus]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          {syncStatus === 'syncing' && (
            <div className="absolute top-0 left-0 h-1 bg-orange-500 w-full animate-progress-indefinite"></div>
          )}
          
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <img
              className="w-48 md:w-64"
              src="https://gurukul.org/wp-content/uploads/2023/09/head-logo-1.svg"
              alt="Gurukul Logo"
            />
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">પ્રાતઃ શિરામણી ડેટા મેનેજર</h1>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <div className="flex items-center gap-3">
              {syncStatus === 'syncing' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100 animate-pulse">
                  Syncing Database...
                </div>
              )}
              {syncStatus === 'done' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                  Data Synced
                </div>
              )}
              {offlineCount > 0 && syncStatus !== 'syncing' && (
                <button onClick={performSync} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100 cursor-pointer">
                  {offlineCount} Pending Sync
                </button>
              )}
            </div>
            <div className="text-right hidden md:block text-slate-500 text-sm font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('forms')}
            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer ${
              activeTab === 'forms' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
              : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            થાળ નોંધણી
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer ${
              activeTab === 'dashboard' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
              : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            ડેશબોર્ડ
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer ${
              activeTab === 'registry' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
              : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            સભ્ય રજીસ્ટ્રી
          </button>
        </div>

        <main>
          {activeTab === 'forms' && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <FormsContainer />
            </section>
          )}

          {activeTab === 'dashboard' && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <Dashboard />
            </section>
          )}

          {activeTab === 'registry' && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <UserRegistry />
            </section>
          )}
        </main>

        <footer className="mt-16 pb-8 text-center border-t border-slate-200 pt-8">
          <p className="text-slate-500 mb-4 font-medium italic">Designed & Developed By Sahajanand Digital</p>
          <a href="http://sahajananddigital.in" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105">
            <img src="https://sahajananddigital.in/images/logo.png" alt="Logo" className="w-40 h-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
          </a>
        </footer>
      </div>
    </div>
  );
};

export default App;
