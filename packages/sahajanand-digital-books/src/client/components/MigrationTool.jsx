import { useState, useEffect } from 'react';
import { callGAS } from '../GAS';
import { parseCSV } from '../utils/csvParser';

const MigrationTool = ({ onDataImported, onNavigateDashboard }) => {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);
  const [logs, setLogs] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [detectedSheets, setDetectedSheets] = useState([]);
  const [parsedPayload, setParsedPayload] = useState(null); // { type: 'excel'|'csv', data: any }
  const [importSuccess, setImportSuccess] = useState(false);

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

  // Handle Excel (.xlsx) file upload
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  const handleCsvUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFileName(`${files.length} CSV file(s) selected`);
    setImportSuccess(false);
    setLogs([]);
    addLog(`Reading ${files.length} CSV files...`);

    const sheetsData = {};
    const detected = [];

    for (const file of files) {
      const sheetName = file.name.replace(/\.[^/.]+$/, ''); // remove .csv
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

  // Run the Migration
  const handleStartMigration = async () => {
    if (!parsedPayload) {
      alert('Please select an Excel (.xlsx) file or CSV files first.');
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
        addLog('Writing CSV sheets batch data into Google Sheets...');
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Introduction Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
              Data Migration
            </span>
            <span className="text-xs text-slate-400">Frappe Books → Google Sheets</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Excel & CSV Migration Tool</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Import your Frappe Books historical invoices, payments, chart of accounts, customers, and ledger entries directly into Google Sheets.
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

      {/* Migration Actions Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Upload Excel File */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Method 1: Upload Excel File (.xlsx)</h4>
                <p className="text-[11px] text-slate-400">Single workbook containing all 11 sheets</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Upload <span className="font-mono font-bold text-slate-800">Sahajanand_Digital_Migration.xlsx</span> or your custom Excel file. All sheets will be extracted and written into Google Sheets.
            </p>

            <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/30">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleExcelUpload}
                disabled={importing}
                className="hidden"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-bold text-slate-700">Choose .xlsx file or drag & drop</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Compatible with Excel OpenXML</span>
            </label>
          </div>
        </div>

        {/* Method 2: Upload CSV Files */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Method 2: Upload CSV Files</h4>
                <p className="text-[11px] text-slate-400">Upload one or multiple CSV sheets</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Select CSV files from the <span className="font-mono font-bold text-slate-800">migration_csvs/</span> folder (e.g. Invoices.csv, Payments.csv, Customers.csv).
            </p>

            <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/30">
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleCsvUpload}
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 bg-gradient-to-b from-blue-50/30 to-white space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Ready to Migrate</span>
              <h4 className="text-base font-bold text-slate-900">{parsedPayload.fileName}</h4>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                Wipe existing data before importing (Recommended)
              </label>

              <button
                onClick={handleStartMigration}
                disabled={importing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
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
                  {s.name}: <strong className="text-blue-600">{s.rows}</strong> rows ({s.cols} cols)
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
