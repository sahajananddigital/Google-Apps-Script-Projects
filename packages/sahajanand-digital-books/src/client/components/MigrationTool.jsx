import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';
import { parseCSV } from '../utils/csvParser';
import {
  downloadSampleCsv,
  downloadAllSampleCsvs,
  downloadSampleExcel,
  downloadSampleJson,
  SAMPLE_SHEETS_META,
} from '../utils/sampleTemplates';

const MigrationTool = ({ onDataImported, onNavigateDashboard }) => {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);
  const [logs, setLogs] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [detectedSheets, setDetectedSheets] = useState([]);
  const [parsedPayload, setParsedPayload] = useState(null); // { type: 'excel'|'csv'|'json', data: any, fileName: string }
  const [importSuccess, setImportSuccess] = useState(false);
  const [dbAlert, setDbAlert] = useState(null);
  const [copiedCli, setCopiedCli] = useState(false);

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await callGAS('getMigrationStatus');
      if (res && res.success) {
        setStatus(res);
      }
    } catch (err) {
      console.error('Error fetching migration status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 1-Click Initialize Clean Database Schema
  const handleQuickLaunch = async () => {
    if (
      !window.confirm(
        '⚙️ This will initialize all 11 database sheets with clean schema headers, standard chart of accounts, and number series in your Google Sheet. Proceed?'
      )
    ) {
      return;
    }

    setImporting(true);
    setImportSuccess(false);
    setLogs([]);
    addLog('⚙️ Initializing Google Sheets database schema and headers...');

    try {
      const res = await callGAS('importDefaultSeedData', clearExisting);
      if (res && res.success) {
        addLog('🎉 Database initialized successfully! All 11 sheets are ready.');
        addLog('💡 You can now upload your historical Excel/CSV files below, or begin adding invoices directly.');
        setImportSuccess(true);
        await fetchStatus();
        if (onDataImported) onDataImported();
      } else {
        addLog(`❌ Setup failed: ${res?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      addLog(`❌ Exception: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Handle JSON file upload (migration_payload.json)
  const handleJsonUpload = async (file) => {
    try {
      setDbAlert(null);
      setSelectedFileName(file.name);
      setImportSuccess(false);
      setLogs([]);
      addLog(`Reading JSON payload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);

      const text = await file.text();
      const json = JSON.parse(text);
      const sheetsData = json.sheetsData || json;

      const detected = [];
      Object.entries(sheetsData).forEach(([sheetName, rows]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          detected.push({
            name: sheetName,
            rows: rows.length - 1,
            cols: rows[0].length,
          });
          addLog(`✓ Found sheet "${sheetName}": ${rows.length - 1} records`);
        }
      });

      if (detected.length === 0) {
        addLog('❌ No valid sheet tables found in this JSON file.');
        return;
      }

      setDetectedSheets(detected);
      setParsedPayload({
        type: 'json',
        data: sheetsData,
        fileName: file.name,
      });
      addLog(`✓ Ready to import ${detected.length} sheets from JSON!`);
    } catch (err) {
      addLog(`❌ Failed to parse JSON: ${err.message}`);
    }
  };

  // Handle Excel (.xlsx) file upload
  const handleExcelUpload = (file) => {
    setDbAlert(null);
    setSelectedFileName(file.name);
    setDetectedSheets([]);
    setImportSuccess(false);
    setLogs([]);
    addLog(`Selected Excel file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setParsedPayload({
        type: 'excel',
        data: base64Data,
        fileName: file.name,
      });
      addLog('✓ Excel file ready for import to Google Sheets');
    };
    reader.onerror = (err) => {
      addLog(`❌ Failed to read file: ${err.message}`);
    };
    reader.readAsDataURL(file);
  };

  // Handle multiple CSV files upload
  const handleCsvUpload = async (files) => {
    setDbAlert(null);
    setSelectedFileName(`${files.length} CSV file(s) selected`);
    setImportSuccess(false);
    setLogs([]);
    addLog(`Reading ${files.length} CSV files...`);

    const sheetsData = {};
    const detected = [];

    for (const file of files) {
      const sheetName = file.name.replace(/\.[^/.]+$/, '');
      try {
        const text = await file.text();
        const parsedRows = parseCSV(text);
        if (parsedRows.length > 0) {
          sheetsData[sheetName] = parsedRows;
          detected.push({ name: sheetName, rows: parsedRows.length - 1, cols: parsedRows[0].length });
          addLog(`✓ Parsed "${sheetName}": ${parsedRows.length - 1} records (${parsedRows[0].length} columns)`);
        }
      } catch (err) {
        addLog(`❌ Error reading "${file.name}": ${err.message}`);
      }
    }

    setDetectedSheets(detected);
    setParsedPayload({
      type: 'csv',
      data: sheetsData,
      fileName: `${files.length} CSV files`,
    });
  };

  // Unified File Drop / Select Handler
  const handleFilesChosen = (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    if (fileList.length === 1) {
      const file = fileList[0];
      const name = file.name.toLowerCase();

      if (name.endsWith('.books.db') || name.endsWith('.db') || name.endsWith('.sqlite')) {
        setDbAlert({
          fileName: file.name,
          cliCommand: `python3 packages/sahajanand-digital-books/scripts/frappe_books_migrator.py "${file.name}"`,
        });
        addLog(`⚠️ "${file.name}" is a raw Frappe Books SQLite file.`);
        addLog('💡 Run the zero-dependency Python script shown above to generate migration_payload.json, then drop it here.');
        return;
      }

      if (name.endsWith('.json')) {
        handleJsonUpload(file);
        return;
      }

      if (name.endsWith('.xlsx')) {
        handleExcelUpload(file);
        return;
      }

      if (name.endsWith('.csv')) {
        handleCsvUpload([file]);
        return;
      }
    }

    // Multiple files (CSV batch)
    const csvFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.csv'));
    if (csvFiles.length > 0) {
      handleCsvUpload(csvFiles);
    } else {
      alert('Please upload .json, .xlsx, or .csv files.');
    }
  };

  // Run the Migration
  const handleStartMigration = async () => {
    if (!parsedPayload) {
      alert('Please select a migration file (.json, .xlsx, or .csv) first.');
      return;
    }

    setImporting(true);
    setImportSuccess(false);
    addLog('🚀 Starting migration into Google Sheets database...');

    try {
      let res;
      if (parsedPayload.type === 'excel') {
        addLog('Uploading and extracting Excel sheets via GAS...');
        res = await callGAS('importExcelFile', {
          base64Data: parsedPayload.data,
          clearExisting,
        });
      } else {
        // 'csv' or 'json'
        addLog('Writing sheets batch data into Google Sheets...');
        res = await callGAS('importMigrationSheets', {
          sheetsData: parsedPayload.data,
          clearExisting,
        });
      }

      if (res && res.success) {
        addLog('🎉 Migration finished successfully!');
        if (res.importedCounts) {
          Object.entries(res.importedCounts).forEach(([sheet, count]) => {
            addLog(`  • ${sheet}: ${count} rows imported`);
          });
        }
        setImportSuccess(true);
        await fetchStatus();
        if (onDataImported) onDataImported();
      } else {
        addLog(`❌ Migration failed: ${res?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      addLog(`❌ Exception during migration: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Reset database handler
  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        '⚠️ Are you sure you want to clear all data rows in your Google Sheet? (Headers and default configurations will be preserved)'
      )
    ) {
      return;
    }

    setImporting(true);
    addLog('⚠️ Resetting all sheets to clean empty tables...');
    try {
      const res = await callGAS('resetDatabase');
      if (res && res.success) {
        addLog('✓ Database successfully cleared and re-initialized.');
        await fetchStatus();
        if (onDataImported) onDataImported();
      } else {
        addLog(`❌ Reset failed: ${res?.message}`);
      }
    } catch (e) {
      addLog(`❌ Error resetting: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const copyCliCommand = () => {
    if (dbAlert?.cliCommand) {
      navigator.clipboard.writeText(dbAlert.cliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Introduction Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
              Frappe Books Migration
            </span>
            <span className="text-xs text-slate-400">Direct Database & File Importer</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Frappe Books to Google Sheets Migration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Migrate your complete Frappe Books accounting database, 369 General Ledgers, 89 Expenses, Invoices, and Payments into Google Sheets.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${loadingStatus ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Sheet Status
        </button>
      </div>

      {/* 🚀 Hero Card: 1-Click Clean Database Setup */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-indigo-900/10 border border-indigo-700/30">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⭐ Clean Architecture • 1-Click Setup
              </span>
              <span className="text-xs text-blue-200 font-mono">Zero Server Cost ERP</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Initialize Clean Accounting Database
            </h3>

            <p className="text-xs text-blue-100 leading-relaxed">
              Start with a clean 11-table double-entry accounting structure, or upload your historical records directly using our Excel (.xlsx) / CSV importers below:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-medium">Accounting Architecture</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">11 Tables</div>
                <div className="text-[9px] text-emerald-300 mt-0.5">Double-entry ready</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-medium">Data Storage</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">Google Sheets</div>
                <div className="text-[9px] text-blue-200 mt-0.5">100% Private in Drive</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-medium">Financial Reports</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">P&L & Balance Sheet</div>
                <div className="text-[9px] text-blue-200 mt-0.5">Live General Ledger</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-blue-200 font-medium">Invoicing & Fees</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">Print + UPI QR</div>
                <div className="text-[9px] text-blue-200 mt-0.5">Full & Installment receipts</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-3 w-full lg:w-auto">
            <button
              onClick={handleQuickLaunch}
              disabled={importing}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {importing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Initializing Sheets...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Initialize Clean Database
                </>
              )}
            </button>
            <span className="text-[10px] text-blue-200/80 text-center sm:text-right">
              Ensures all 11 sheets & headers exist
            </span>
          </div>
        </div>
      </div>

      {/* Database Status Grid */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Current Google Sheets Status</h3>
            <p className="text-[11px] text-slate-400">Live row counts for each sheet in the active spreadsheet</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Records</span>
            <p className="text-lg font-black text-blue-700 font-mono">
              {status?.totalRecords !== undefined ? status.totalRecords : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {status?.sheetCounts ? (
            Object.entries(status.sheetCounts).map(([sheet, count]) => (
              <div key={sheet} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-600 truncate" title={sheet}>
                  {sheet}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base font-black font-mono ${count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                    {count}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">rows</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              Loading sheet counts from Google Sheets...
            </div>
          )}
        </div>
      </div>

      {/* SQLite Helper Alert (Shown when user drops a .books.db file) */}
      {dbAlert && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900">
                Frappe Books SQLite Database Detected ({dbAlert.fileName})
              </h4>
              <p className="text-xs text-amber-800">
                Web browsers cannot execute native SQLite files directly. Run this zero-dependency Python migrator script in your Terminal to extract it in 1 second:
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto justify-between">
            <span className="truncate">{dbAlert.cliCommand}</span>
            <button
              onClick={copyCliCommand}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-sans font-bold flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
            >
              {copiedCli ? '✓ Copied!' : 'Copy Command'}
            </button>
          </div>

          <p className="text-[11px] text-amber-700">
            This script extracts all 11 sheets into <span className="font-mono font-bold">migration_payload.json</span> and <span className="font-mono font-bold">Frappe_Books_Migration.xlsx</span>. Once generated, simply drop either file below!
          </p>
        </div>
      )}

      {/* 📥 Download Example Templates (Excel & CSV) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Data Templates
              </span>
              <span className="text-xs text-slate-400">Excel (.xlsx) & CSV (.csv) Samples</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mt-1">Download Example Templates (Fill & Import)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Download pre-formatted sample files with valid headers and example rows. Fill in your historical figures and upload below!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadSampleExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-emerald-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Sample Excel (.xlsx)
            </button>

            <button
              onClick={downloadSampleJson}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Sample JSON
            </button>
          </div>
        </div>

        {/* Individual CSV downloads */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Download Individual Table CSVs
            </span>
            <button
              onClick={downloadAllSampleCsvs}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              Download All 11 CSVs ↓
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {SAMPLE_SHEETS_META.map((meta) => (
              <button
                key={meta.name}
                onClick={() => downloadSampleCsv(meta.name)}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all flex flex-col justify-between group"
                title={`Click to download ${meta.name}_Sample_Template.csv`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-slate-800 text-xs group-hover:text-blue-700 truncate">
                    {meta.name}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-mono">.csv ↓</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{meta.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Migration File Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: JSON Payload or Excel Upload */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Frappe Books Package (.json / .xlsx)</h4>
                <p className="text-[11px] text-slate-400">All 11 accounting tables in one file</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Upload <span className="font-mono font-bold text-slate-800">migration_payload.json</span> or an Excel workbook (<span className="font-mono font-bold text-slate-800">.xlsx</span>).
            </p>

            <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/30">
              <input
                type="file"
                accept=".json,.xlsx,.csv,.db,.books.db"
                onChange={handleFilesChosen}
                disabled={importing}
                className="hidden"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-bold text-slate-700">Choose .json or .xlsx file</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Drag & drop supported</span>
            </label>
          </div>
        </div>

        {/* Method 2: Batch CSV Upload */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Method 2: Batch CSV Upload</h4>
                <p className="text-[11px] text-slate-400">Upload one or multiple CSV tables</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Select one or more CSV files (e.g. <span className="font-mono font-bold text-slate-800">Invoices.csv</span>, <span className="font-mono font-bold text-slate-800">JournalLedgers.csv</span>, <span className="font-mono font-bold text-slate-800">Expenses.csv</span>).
            </p>

            <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/30">
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFilesChosen}
                disabled={importing}
                className="hidden"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-bold text-slate-700">Select multiple .csv files</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Auto-matches sheet names by file name</span>
            </label>
          </div>
        </div>
      </div>

      {/* Selected File & Import Execution Card */}
      {parsedPayload && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">File Selected & Ready</span>
              <h4 className="text-base font-bold text-slate-900">{parsedPayload.fileName}</h4>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Wipe existing data before importing (Recommended)
              </label>

              <button
                onClick={handleStartMigration}
                disabled={importing}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Importing to Google Sheets...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Start Migration to Google Sheets
                  </>
                )}
              </button>
            </div>
          </div>

          {detectedSheets.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {detectedSheets.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 font-mono">
                  {s.name}: <strong className="text-indigo-600">{s.rows}</strong> rows ({s.cols} cols)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Migration Log Stream */}
      {logs.length > 0 && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-sm space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Migration Progress Log</span>
            {importSuccess && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ Import Complete
              </span>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 text-slate-300">
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>

          {importSuccess && onNavigateDashboard && (
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={onNavigateDashboard}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs font-sans transition-all flex items-center gap-1.5"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Database Maintenance / Danger Zone */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Database Reset
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Clear all data rows from Google Sheets and restore blank schema headers (cannot be undone)
          </p>
        </div>

        <button
          onClick={handleResetDatabase}
          disabled={importing}
          className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          Reset to Clean Slate
        </button>
      </div>
    </div>
  );
};

export default MigrationTool;
