import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';
import { formatCurrency, CURRENCY_CONFIG, getCurrencySymbol } from '../utils/formatters';

const SettingsManager = ({ settings = {}, onSettingsSaved, onDatabaseChanged, onOpenCustomizer }) => {
  const [formData, setFormData] = useState({
    organizationType: settings.organizationType || 'business', // 'business' | 'institute'
    companyName: settings.companyName || '',
    currency: settings.currency || 'INR',
    fullname: settings.fullname || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    pan: settings.pan || '',
    udyam: settings.udyam || '',
    gstin: settings.gstin || '',
    gstDeclaration: settings.gstDeclaration || 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
    brandColor: settings.brandColor || '#112B42',
    logoUrl: settings.logoUrl || '',
    // Primary Bank
    primaryBankName: settings.primaryBankName || '',
    primaryBankBranch: settings.primaryBankBranch || '',
    primaryAccountType: settings.primaryAccountType || 'Current',
    primaryAccountNo: settings.primaryAccountNo || '',
    primaryIfsc: settings.primaryIfsc || '',
    primaryUpiId: settings.primaryUpiId || '',
    upiPayeeName: settings.upiPayeeName || '',
    // Secondary Bank
    secondaryBankName: settings.secondaryBankName || '',
    secondaryBankBranch: settings.secondaryBankBranch || '',
    secondaryAccountType: settings.secondaryAccountType || 'Savings',
    secondaryAccountNo: settings.secondaryAccountNo || '',
    secondaryIfsc: settings.secondaryIfsc || '',
    secondaryUpiId: settings.secondaryUpiId || '',
    defaultPrintTemplate: settings.defaultPrintTemplate || 'IndianStyleTally',
  });
  const [isCustomCurrency, setIsCustomCurrency] = useState(
    Boolean(settings.currency && !CURRENCY_CONFIG[settings.currency.toUpperCase()])
  );
  const [customCurrencyCode, setCustomCurrencyCode] = useState(
    settings.currency && !CURRENCY_CONFIG[settings.currency.toUpperCase()] ? settings.currency : ''
  );
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Per-user database spreadsheet state
  const [dbInfo, setDbInfo] = useState({
    configured: false,
    spreadsheetId: '',
    spreadsheetName: '',
    spreadsheetUrl: '',
  });
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [connectInput, setConnectInput] = useState('');
  const [showConnectBox, setShowConnectBox] = useState(false);

  const loadDatabaseInfo = async () => {
    setLoadingDb(true);
    try {
      const res = await callGAS('getDatabaseInfo');
      if (res && res.spreadsheetId) {
        setDbInfo(res);
      }
    } catch (e) {
      console.error('Failed to load DB info:', e);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const handleCreateNewDatabase = async () => {
    const defaultName = formData.companyName
      ? `${formData.companyName} - Financial ERP Database`
      : 'Gurukul Books - Financial ERP Database';
    const name = window.prompt('Enter name for your new Google Spreadsheet in Google Drive:', defaultName);
    if (!name) return;

    setLoadingDb(true);
    setDbMessage('');
    try {
      const res = await callGAS('createNewDatabaseFromUI', name);
      if (res.success) {
        setDbMessage(`✓ Successfully created and connected: ${res.spreadsheetName}`);
        await loadDatabaseInfo();
        if (onDatabaseChanged) onDatabaseChanged();
      } else {
        alert(res.message || 'Failed to create database');
      }
    } catch (e) {
      alert('Error creating spreadsheet: ' + (e.message || String(e)));
    } finally {
      setLoadingDb(false);
    }
  };

  const handleConnectExisting = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!connectInput.trim()) return;

    setLoadingDb(true);
    setDbMessage('');
    try {
      const res = await callGAS('connectExistingSpreadsheet', connectInput.trim());
      if (res.success) {
        setDbMessage(`✓ Connected to spreadsheet: ${res.spreadsheetName}`);
        setShowConnectBox(false);
        setConnectInput('');
        await loadDatabaseInfo();
        if (onDatabaseChanged) onDatabaseChanged();
      } else {
        alert(res.message || 'Failed to connect spreadsheet');
      }
    } catch (e) {
      alert('Error connecting spreadsheet: ' + (e.message || String(e)));
    } finally {
      setLoadingDb(false);
    }
  };

  const handleSwitchDatabase = async (targetId) => {
    if (!targetId || targetId === dbInfo.spreadsheetId) return;
    setLoadingDb(true);
    setDbMessage('');
    try {
      const res = await callGAS('switchDatabase', targetId);
      if (res.success) {
        setDbMessage(`✓ Switched to database: ${res.spreadsheetName}`);
        await loadDatabaseInfo();
        if (onDatabaseChanged) onDatabaseChanged();
      } else {
        alert(res.message || 'Failed to switch database');
      }
    } catch (e) {
      alert('Error switching database: ' + (e.message || String(e)));
    } finally {
      setLoadingDb(false);
    }
  };

  const handleRemoveSavedDatabase = async (targetId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Remove this sheet from your quick-switch list? (The spreadsheet file in Google Drive will NOT be deleted).')) {
      return;
    }
    try {
      const res = await callGAS('removeSavedDatabase', targetId);
      if (res && res.success) {
        setDbInfo((prev) => ({
          ...prev,
          savedDatabases: (prev.savedDatabases || []).filter((d) => d.id !== targetId),
        }));
      }
    } catch (err) {
      console.error('Error removing saved database:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCurrencySelect = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomCurrency(true);
      if (customCurrencyCode) {
        setFormData((prev) => ({ ...prev, currency: customCurrencyCode.toUpperCase() }));
      }
    } else {
      setIsCustomCurrency(false);
      setFormData((prev) => ({ ...prev, currency: val }));
    }
  };

  const handleCustomCurrencyChange = (e) => {
    const val = e.target.value.toUpperCase();
    setCustomCurrencyCode(val);
    setFormData((prev) => ({ ...prev, currency: val || 'INR' }));
  };

  const handleOrgTypeSwitch = (type) => {
    setFormData((prev) => {
      const isInst = type === 'institute';
      return {
        ...prev,
        organizationType: type,
        gstDeclaration: isInst
          ? 'We acknowledge receipt of fees / donation towards educational and institutional purposes with gratitude.'
          : 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedMessage('');
    try {
      const res = await callGAS('saveAppSettings', formData);
      if (res.success) {
        setSavedMessage('✓ Settings successfully saved to Google Sheets');
        if (onSettingsSaved) onSettingsSaved(formData);
      } else {
        alert(res.message || 'Error saving settings');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Business & Bank Settings</h2>
          <p className="text-xs text-slate-500 mt-1">Configure company identity, tax details, organization mode, and banking</p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCustomizer && (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-blue-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Customize Invoice Template
            </button>
          )}

          {savedMessage && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              {savedMessage}
            </span>
          )}
        </div>
      </div>

      {/* Google Sheets Database Connection Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl shadow-sm text-white space-y-4 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-lg">📊</span>
              <h3 className="text-sm font-bold tracking-wide uppercase text-white">Google Sheets Database Storage</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Each user creates and owns their personal accounting database in their Google Drive. Data is 100% private.
            </p>
          </div>
          {dbInfo.spreadsheetId && (
            <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected & Active
            </span>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Active Database Spreadsheet:</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {dbInfo.spreadsheetName || 'Gurukul Books - Financial ERP Database'}
            </div>
            {dbInfo.spreadsheetId && (
              <div className="text-[11px] text-slate-400 font-mono break-all">
                ID: {dbInfo.spreadsheetId}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dbInfo.spreadsheetUrl && (
              <a
                href={dbInfo.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Open in Sheets</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <button
              type="button"
              onClick={handleCreateNewDatabase}
              disabled={loadingDb}
              className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs border border-emerald-500/30 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>➕ Create New Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConnectBox(!showConnectBox)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-xs border border-white/20 transition-all"
            >
              <span>🔗 Connect Another Sheet</span>
            </button>
          </div>
        </div>

        {dbMessage && (
          <div className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-2 rounded-lg">
            {dbMessage}
          </div>
        )}

        {/* Saved Sheets Quick Switcher */}
        {dbInfo.savedDatabases && dbInfo.savedDatabases.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <span>⚡</span>
                <span>Switch Between Organizations & Saved Sheets:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {dbInfo.savedDatabases.length} saved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dbInfo.savedDatabases.map((db) => {
                const isActive = db.id === dbInfo.spreadsheetId;
                return (
                  <div
                    key={db.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xs'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{isActive ? '🟢' : '📁'}</span>
                        <span className="font-bold text-xs text-white truncate block">
                          {db.name || 'Google Sheet Database'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        ID: {db.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isActive ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchDatabase(db.id)}
                          disabled={loadingDb}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs"
                        >
                          Switch
                        </button>
                      )}

                      {db.url && (
                        <a
                          href={db.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in Google Sheets"
                          className="p-1 hover:bg-white/10 text-slate-300 rounded-md transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}

                      {!isActive && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedDatabase(db.id, e)}
                          title="Remove from saved list"
                          className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-md transition-all text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showConnectBox && (
          <div className="bg-white/10 p-4 rounded-xl border border-white/15 space-y-3">
            <div className="text-xs font-semibold text-slate-200">
              Connect an Existing Google Sheet from your Google Drive:
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={connectInput}
                onChange={(e) => setConnectInput(e.target.value)}
                placeholder="Paste Google Sheet URL (https://docs.google.com/spreadsheets/d/...) or Sheet ID"
                className="flex-1 bg-white text-slate-900 px-3 py-2 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={handleConnectExisting}
                disabled={loadingDb || !connectInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all whitespace-nowrap"
              >
                {loadingDb ? 'Connecting...' : 'Connect Spreadsheet'}
              </button>
              <button
                type="button"
                onClick={() => setShowConnectBox(false)}
                className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              * Ensure your Google Account has Edit access to this spreadsheet. All 11 tables and schemas will be automatically verified and initialized.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 0. Organization Mode Preset Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Organization Type & Reusability Preset
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {formData.organizationType === 'institute' ? 'Institute / Gurukul Mode' : 'Commercial Business Mode'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Select your operational model. This automatically adapts labels across the application (e.g. Invoices vs Fee Receipts, Customers vs Students/Donors, Services vs Fee Heads).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => handleOrgTypeSwitch('business')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.organizationType === 'business'
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💼</span>
                <h4 className="font-bold text-slate-900 text-xs">Commercial Business / Agency</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tailored for IT agencies, consulting firms, service providers, and traders. Terms: Tax Invoices, Customers, Service Catalog, Sales Income.
              </p>
            </div>

            <div
              onClick={() => handleOrgTypeSwitch('institute')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.organizationType === 'institute'
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🏛️</span>
                <h4 className="font-bold text-slate-900 text-xs">Educational Institute / Gurukul / Trust</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tailored for schools, gurukuls, research academies, and non-profits. Terms: Fee Receipts, Students / Donors, Fee Heads, Receipt Vouchers.
              </p>
            </div>
          </div>
        </div>

        {/* 0.5 Default Print / Receipt Template Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Default Print & Receipt Template
              </h3>
              <p className="text-[11px] text-slate-400">
                Selected template opens automatically when generating, viewing, or printing receipts & invoices
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 font-mono">
              Active: {formData.defaultPrintTemplate}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                id: 'EducationFeeReceipt',
                title: '🎓 Educational Fee Receipt',
                badge: 'Recommended for Institute',
                desc: 'Official fee receipt with institute logo, student details, course fee table, and UPI QR code.',
              },
              {
                id: 'EducationPartialFeeReceipt',
                title: '💳 Partial Fee / Installment Receipt',
                badge: 'Installments',
                desc: 'Displays Total Course Fee, Amount Paid Today, and Remaining Balance Due with UPI balance link.',
              },
              {
                id: 'IndianStyleTally',
                title: '🇮🇳 Indian Tally Tax Invoice',
                badge: 'Classic Tally',
                desc: 'Formal double-entry tax invoice with HSN breakdown, GST declaration, and authorized stamp.',
              },
              {
                id: 'ModernProfessional',
                title: '🏦 Modern Professional (Primary Bank)',
                badge: 'Corporate',
                desc: 'Modern corporate layout with primary bank details, totals banner, and UPI QR code.',
              },
              {
                id: 'ModernMinimalist',
                title: '⚡ Modern Minimalist (Secondary Bank)',
                badge: 'Digital Banking',
                desc: 'Sleek digital-first receipt layout designed with secondary bank account and UPI link.',
              },
            ].map((tpl) => {
              const isSelected =
                formData.defaultPrintTemplate === tpl.id ||
                (tpl.id === 'ModernProfessional' && formData.defaultPrintTemplate === 'TamilnadMercantileBank') ||
                (tpl.id === 'ModernMinimalist' && formData.defaultPrintTemplate === 'JupiterBank');
              return (
                <div
                  key={tpl.id}
                  onClick={() => setFormData((prev) => ({ ...prev, defaultPrintTemplate: tpl.id }))}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                <div>
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <h4 className="font-bold text-slate-900 text-xs">{tpl.title}</h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{tpl.desc}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${formData.defaultPrintTemplate === tpl.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {formData.defaultPrintTemplate === tpl.id ? '✓ Default Selected' : 'Click to set default'}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* 1. Company Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Organization Profile & Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">
                {formData.organizationType === 'institute' ? 'Institute / Trust Name *' : 'Business / Company Name *'}
              </label>
              <input
                type="text"
                name="companyName"
                placeholder={formData.organizationType === 'institute' ? 'e.g. Shree Gurukul Vidhyalaya' : 'e.g. Acme Digital Solutions'}
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-600 uppercase text-xs">
                  Default Currency *
                </label>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Preview: {formatCurrency(125000, formData.currency)}
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  value={isCustomCurrency ? 'CUSTOM' : formData.currency}
                  onChange={handleCurrencySelect}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500 bg-white"
                >
                  <option value="INR">INR (₹) - Indian Rupee (Default)</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (AED) - UAE Dirham</option>
                  <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                  <option value="AUD">AUD (A$) - Australian Dollar</option>
                  <option value="SGD">SGD (SG$) - Singapore Dollar</option>
                  <option value="SAR">SAR (SAR) - Saudi Riyal</option>
                  <option value="QAR">QAR (QAR) - Qatari Riyal</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                  <option value="CUSTOM">Custom Currency...</option>
                </select>

                {isCustomCurrency && (
                  <input
                    type="text"
                    placeholder="e.g. BRL"
                    value={customCurrencyCode}
                    onChange={handleCustomCurrencyChange}
                    maxLength={6}
                    className="w-28 rounded-xl border border-blue-400 p-2.5 text-xs font-mono font-bold uppercase focus:border-blue-600 bg-blue-50/30"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">
                {formData.organizationType === 'institute' ? 'Principal / Trustee / Contact' : 'Owner / Contact Name'}
              </label>
              <input
                type="text"
                name="fullname"
                placeholder="e.g. Authorized Signatory / Administrator"
                value={formData.fullname}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Official Phone</label>
              <input
                type="text"
                name="phone"
                placeholder="+91..."
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Official Email</label>
              <input
                type="email"
                name="email"
                placeholder="contact@yourdomain.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Website URL</label>
              <input
                type="url"
                name="website"
                placeholder="https://..."
                value={formData.website}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Logo Image URL</label>
              <input
                type="url"
                name="logoUrl"
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 uppercase">Address / Campus Location</label>
            <textarea
              name="address"
              rows="2"
              placeholder="Suite / Campus, Street, City, State, Pincode"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
            ></textarea>
          </div>
        </div>

        {/* 2. Tax & Legal Information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Tax Registration & Legal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">GSTIN / Tax ID</label>
              <input
                type="text"
                name="gstin"
                placeholder="e.g. 24AAAAA0000A1Z5 or URP"
                value={formData.gstin}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Reg / Trust / UDYAM No</label>
              <input
                type="text"
                name="udyam"
                placeholder="e.g. TRUST-REG-XXXX or UDYAM-XX"
                value={formData.udyam}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">PAN Number</label>
              <input
                type="text"
                name="pan"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 uppercase">Receipt / Invoice Legal Declaration</label>
            <textarea
              name="gstDeclaration"
              rows="2"
              placeholder="Legal declaration printed at bottom of invoices/receipts"
              value={formData.gstDeclaration}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
            ></textarea>
          </div>
        </div>

        {/* 3. Primary Bank Account */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Primary Bank Account (Default for Payments & UPI QR)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
              Primary
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Bank Name</label>
              <input
                type="text"
                name="primaryBankName"
                placeholder="e.g. State Bank of India / HDFC Bank"
                value={formData.primaryBankName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Branch Name</label>
              <input
                type="text"
                name="primaryBankBranch"
                placeholder="e.g. Main Branch"
                value={formData.primaryBankBranch}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Type</label>
              <select
                name="primaryAccountType"
                value={formData.primaryAccountType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              >
                <option value="Current">Current Account</option>
                <option value="Savings">Savings Account</option>
                <option value="Trust / Institutional">Trust / Institutional Account</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Number</label>
              <input
                type="text"
                name="primaryAccountNo"
                placeholder="e.g. 123456789012"
                value={formData.primaryAccountNo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">IFSC Code</label>
              <input
                type="text"
                name="primaryIfsc"
                placeholder="e.g. SBIN0001234"
                value={formData.primaryIfsc}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">UPI VPA / QR ID</label>
              <input
                type="text"
                name="primaryUpiId"
                placeholder="e.g. yourname@upi or institute@bank"
                value={formData.primaryUpiId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold text-blue-600 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">UPI Payee / Account Holder Name</label>
              <input
                type="text"
                name="upiPayeeName"
                placeholder="e.g. Account Holder / Organization Name"
                value={formData.upiPayeeName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Secondary Bank Account */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              4. Secondary Bank Account (Optional)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              Secondary
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Secondary Bank Name</label>
              <input
                type="text"
                name="secondaryBankName"
                placeholder="e.g. State Bank of India / HDFC Bank"
                value={formData.secondaryBankName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Branch Name</label>
              <input
                type="text"
                name="secondaryBankBranch"
                placeholder="Branch"
                value={formData.secondaryBankBranch}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Type</label>
              <select
                name="secondaryAccountType"
                value={formData.secondaryAccountType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-500"
              >
                <option value="Savings">Savings Account</option>
                <option value="Current">Current Account</option>
                <option value="Trust / Institutional">Trust / Institutional Account</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">Account Number</label>
              <input
                type="text"
                name="secondaryAccountNo"
                placeholder="Account number"
                value={formData.secondaryAccountNo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">IFSC Code</label>
              <input
                type="text"
                name="secondaryIfsc"
                placeholder="IFSC Code"
                value={formData.secondaryIfsc}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase font-bold focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 uppercase">UPI VPA</label>
              <input
                type="text"
                name="secondaryUpiId"
                placeholder="secondary@bank"
                value={formData.secondaryUpiId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold text-blue-600 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-100 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;
