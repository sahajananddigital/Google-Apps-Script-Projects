import { useState, useRef } from 'react';
import { callGAS } from '../GAS';
import TallyStyleInvoice from '../templates/TallyStyleInvoice';
import ModernStyleInvoice from '../templates/ModernStyleInvoice';
import EducationFeeReceipt from '../templates/EducationFeeReceipt';
import EducationPartialFeeReceipt from '../templates/EducationPartialFeeReceipt';
import { printIsolatedElement } from '../utils/printer';
import { AVAILABLE_MARKERS } from '../utils/markerEngine';

const SAMPLE_INVOICE = {
  name: 'SINV-1062',
  date: new Date().toISOString().split('T')[0],
  party: 'Gurukul Academy & Research Foundation',
  netTotal: 12500,
  discountAmount: 500,
  grandTotal: 12000,
  outstandingAmount: 0,
  status: 'Paid',
  terms: 'Payment due on receipt. Thank you for your continued partnership.',
  items: [
    { item: 'Annual Educational Portal Hosting', description: 'Cloud server with daily backups', hsnCode: '998312', quantity: 1, rate: 8000, amount: 8000 },
    { item: 'Domain Registration & SSL Certificate', description: '2 Years Premium Domain & Wildcard SSL', hsnCode: '998313', quantity: 1, rate: 4500, amount: 4500 },
  ],
};

const SAMPLE_CUSTOMER = {
  name: 'Gurukul Academy & Research Foundation',
  addressLine1: 'Campus Road, Near Science City',
  city: 'Ahmedabad',
  state: 'Gujarat',
  postalCode: '380060',
  phone: '+91 98765 43210',
  gstin: '24AAAAA0000A1Z5',
};

const TemplateCustomizer = ({ settings = {}, onSettingsSaved, onBack }) => {
  const [activeTemplate, setActiveTemplate] = useState(settings.defaultPrintTemplate || 'IndianStyleTally');
  const [invoiceTitle, setInvoiceTitle] = useState(settings.invoiceTitle || 'Tax Invoice / Bill of Supply');
  const [leftSideNote, setLeftSideNote] = useState(
    settings.leftSideNote || 'Thank you for choosing {{companyName}}! For support contact {{companyPhone}} or {{companyEmail}}.'
  );
  const [declaration, setDeclaration] = useState(
    settings.gstDeclaration || 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.'
  );
  const [terms, setTerms] = useState(
    settings.defaultTerms || '1. Goods / Services once confirmed are non-refundable.\n2. Please mention {{invoiceNo}} on all bank transfers.'
  );
  const [brandColor, setBrandColor] = useState(settings.brandColor || '#112B42');
  const [showQrCode, setShowQrCode] = useState(settings.showQrCode !== false);
  const [showBankDetails, setShowBankDetails] = useState(settings.showBankDetails !== false);
  const [showSignatory, setShowSignatory] = useState(settings.showSignatory !== false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const activeInputRef = useRef(null);

  // Dynamic preview settings object
  const previewSettings = {
    ...settings,
    invoiceTitle,
    leftSideNote,
    gstDeclaration: declaration,
    defaultTerms: terms,
    brandColor,
    showQrCode,
    showBankDetails,
    showSignatory,
  };

  const handleInsertMarker = (markerTag) => {
    const textToInsert = `{{${markerTag}}}`;
    if (activeInputRef.current) {
      const el = activeInputRef.current;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const val = el.value || '';
      const newVal = val.substring(0, start) + textToInsert + val.substring(end);
      el.value = newVal;

      if (el.name === 'leftSideNote') setLeftSideNote(newVal);
      if (el.name === 'declaration') setDeclaration(newVal);
      if (el.name === 'terms') setTerms(newVal);
      if (el.name === 'invoiceTitle') setInvoiceTitle(newVal);

      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }, 50);
    } else {
      setLeftSideNote((prev) => `${prev} ${textToInsert}`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = {
        ...settings,
        defaultPrintTemplate: activeTemplate,
        invoiceTitle,
        leftSideNote,
        gstDeclaration: declaration,
        defaultTerms: terms,
        brandColor,
        showQrCode,
        showBankDetails,
        showSignatory,
      };

      const res = await callGAS('saveAppSettings', updated);
      if (res && res.success) {
        setSavedSuccess(true);
        if (onSettingsSaved) onSettingsSaved(updated);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(res?.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving customizer settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintTest = () => {
    printIsolatedElement('invoice-print-area', 'Test-Template-Preview');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">
              Template Designer
            </span>
            <span className="text-xs text-slate-400">Dynamic Markers & Live Real-Time Preview</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Invoice Template Customizer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize header titles, left-side notes, legal terms, and embed dynamic tags (like company, student, or bank details).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
            >
              Back
            </button>
          )}

          <button
            onClick={handlePrintTest}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Test Print
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5"
          >
            {saving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customizer Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Template Format & Title */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              1. Base Style & Header Title
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Base Invoice Layout</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'EducationFeeReceipt', label: '🎓 Fee Receipt' },
                  { id: 'EducationPartialFeeReceipt', label: '💳 Partial Receipt' },
                  { id: 'IndianStyleTally', label: 'Indian Tally' },
                  { id: 'ModernProfessional', label: 'Modern (Primary)' },
                  { id: 'ModernMinimalist', label: 'Modern (Secondary)' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setActiveTemplate(tpl.id)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                      activeTemplate === tpl.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Invoice Header Title</label>
              <input
                type="text"
                name="invoiceTitle"
                value={invoiceTitle}
                ref={(el) => {
                  if (document.activeElement === el) activeInputRef.current = el;
                }}
                onFocus={(e) => {
                  activeInputRef.current = e.target;
                }}
                onChange={(e) => setInvoiceTitle(e.target.value)}
                placeholder="e.g. TAX INVOICE / BILL OF SUPPLY / FEE RECEIPT"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 focus:border-blue-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Tax Invoice / Bill of Supply', 'Fee Receipt / Receipt Voucher', 'Tax Invoice', 'Bill of Supply', 'Proforma Invoice'].map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setInvoiceTitle(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Accent Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-9 w-12 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                />
                <span className="font-mono text-xs font-bold text-slate-700">{brandColor}</span>
                <div className="flex gap-1">
                  {['#112B42', '#047857', '#1e40af', '#6b21a8', '#b91c1c'].map((c) => (
                    <div
                      key={c}
                      onClick={() => setBrandColor(c)}
                      style={{ backgroundColor: c }}
                      className="h-6 w-6 rounded-full cursor-pointer border-2 border-white shadow-2xs hover:scale-110 transition-all"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Interactive Markers Tool Palette */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Click-to-Insert Markers
              </h3>
              <span className="text-[10px] text-slate-400">Inserts at cursor</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Click any tag below to insert its dynamic variable into the focused text box:
            </p>

            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
              {AVAILABLE_MARKERS.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.group}</span>
                  <div className="flex flex-wrap gap-1">
                    {group.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertMarker(tag)}
                        className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-all"
                        title={`Insert {{${tag}}}`}
                      >
                        {`{{${tag}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Left-Side Notes & Custom Text */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              3. Left-Side Text & Payment Notes
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">
                Left-Side Notice / Remarks (Supports markers)
              </label>
              <textarea
                name="leftSideNote"
                rows="3"
                value={leftSideNote}
                ref={(el) => {
                  if (document.activeElement === el) activeInputRef.current = el;
                }}
                onFocus={(e) => {
                  activeInputRef.current = e.target;
                }}
                onChange={(e) => setLeftSideNote(e.target.value)}
                placeholder="Custom left-side remarks, payment instructions or thanks note..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500 font-mono"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">
                Terms & Conditions
              </label>
              <textarea
                name="terms"
                rows="3"
                value={terms}
                ref={(el) => {
                  if (document.activeElement === el) activeInputRef.current = el;
                }}
                onFocus={(e) => {
                  activeInputRef.current = e.target;
                }}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Terms and conditions printed on invoice..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500 font-mono"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">
                Legal Declaration / Footnote
              </label>
              <textarea
                name="declaration"
                rows="2"
                value={declaration}
                ref={(el) => {
                  if (document.activeElement === el) activeInputRef.current = el;
                }}
                onFocus={(e) => {
                  activeInputRef.current = e.target;
                }}
                onChange={(e) => setDeclaration(e.target.value)}
                placeholder="Legal declaration..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500 font-mono"
              ></textarea>
            </div>
          </div>

          {/* 4. Display Toggles */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              4. Layout Elements Visibility
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-700">Display UPI QR Code for instant mobile payments</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBankDetails}
                  onChange={(e) => setShowBankDetails(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-700">Display Bank Account, IFSC & Branch details</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatory}
                  onChange={(e) => setShowSignatory(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-700">Display "Authorised Signatory" signature block</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Real-Time Predefined Preview (7 cols) */}
        <div className="lg:col-span-7 sticky top-4 space-y-3">
          <div className="flex justify-between items-center bg-white p-3 px-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Invoice Preview</span>
            </div>
            <span className="text-[11px] text-slate-400">Updates instantly as you edit</span>
          </div>

          <div className="bg-slate-100 p-2 sm:p-4 rounded-2xl border border-slate-200 overflow-x-auto max-h-[85vh] overflow-y-auto shadow-inner">
            <div className="bg-white rounded-xl shadow-lg mx-auto overflow-hidden">
              {activeTemplate === 'EducationFeeReceipt' || activeTemplate === 'education_receipt' ? (
                <EducationFeeReceipt
                  invoice={SAMPLE_INVOICE}
                  customer={SAMPLE_CUSTOMER}
                  settings={previewSettings}
                />
              ) : activeTemplate === 'EducationPartialFeeReceipt' || activeTemplate === 'education_partial' ? (
                <EducationPartialFeeReceipt
                  invoice={SAMPLE_INVOICE}
                  customer={SAMPLE_CUSTOMER}
                  settings={previewSettings}
                />
              ) : activeTemplate === 'IndianStyleTally' ? (
                <TallyStyleInvoice
                  invoice={SAMPLE_INVOICE}
                  customer={SAMPLE_CUSTOMER}
                  settings={previewSettings}
                />
              ) : activeTemplate === 'ModernProfessional' || activeTemplate === 'TamilnadMercantileBank' ? (
                <ModernStyleInvoice
                  invoice={SAMPLE_INVOICE}
                  customer={SAMPLE_CUSTOMER}
                  settings={previewSettings}
                  templateVariant="tmb"
                />
              ) : (
                <ModernStyleInvoice
                  invoice={SAMPLE_INVOICE}
                  customer={SAMPLE_CUSTOMER}
                  settings={previewSettings}
                  templateVariant="jupiter"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCustomizer;
