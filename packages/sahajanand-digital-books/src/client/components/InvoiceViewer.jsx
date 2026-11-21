import { useState, useEffect } from 'react';
import TallyStyleInvoice from '../templates/TallyStyleInvoice';
import ModernStyleInvoice from '../templates/ModernStyleInvoice';
import EducationFeeReceipt from '../templates/EducationFeeReceipt';
import EducationPartialFeeReceipt from '../templates/EducationPartialFeeReceipt';
import { printIsolatedElement, downloadStandaloneReceipt } from '../utils/printer';

const InvoiceViewer = ({ invoice, customer, settings = {}, autoPrint = false, onClose, onOpenCustomizer }) => {
  // Normalize default template key
  const getDefaultTemplate = () => {
    const def = settings?.defaultPrintTemplate;
    if (def === 'education_receipt' || def === 'EducationFeeReceipt') return 'education_receipt';
    if (def === 'education_partial' || def === 'EducationPartialFeeReceipt') return 'education_partial';
    if (def === 'IndianStyleTally' || def === 'tally') return 'tally';
    if (def === 'ModernProfessional' || def === 'TamilnadMercantileBank' || def === 'modern_tmb') return 'modern_tmb';
    if (def === 'ModernMinimalist' || def === 'JupiterBank' || def === 'modern_jupiter') return 'modern_jupiter';
    return settings?.organizationType === 'institute' ? 'education_receipt' : 'tally';
  };

  const [template, setTemplate] = useState(getDefaultTemplate);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!invoice) return null;

  const invoiceNo = String(
    invoice.InvoiceNo || invoice.invoiceNo || invoice.name || 'SINV-XXXX'
  ).trim();

  const handlePrint = () => {
    printIsolatedElement('invoice-print-area', invoiceNo);
  };

  const handleDownloadHtml = () => {
    downloadStandaloneReceipt('invoice-print-area', invoiceNo);
  };

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs overflow-y-auto overscroll-contain flex flex-col items-center justify-start p-2 sm:p-4 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Floating / Sticky Control Bar */}
      <div className="no-print sticky top-2 z-30 max-w-[850px] w-full mx-auto mb-4 bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider shrink-0">Style:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setTemplate('education_receipt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                template === 'education_receipt' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎓 Fee Receipt
            </button>
            <button
              onClick={() => setTemplate('education_partial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                template === 'education_partial' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💳 Partial Fee Receipt
            </button>
            <button
              onClick={() => setTemplate('tally')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                template === 'tally' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Indian Tally
            </button>
            <button
              onClick={() => setTemplate('modern_tmb')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                template === 'modern_tmb' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modern (Primary Bank)
            </button>
            <button
              onClick={() => setTemplate('modern_jupiter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                template === 'modern_jupiter' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modern (Secondary Bank)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenCustomizer && (
            <button
              onClick={() => {
                onClose();
                onOpenCustomizer();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              title="Customize Template Markers & Text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Customize
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
            title={`Download or Print as ${invoiceNo}.pdf`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download {invoiceNo}.pdf
          </button>

          <button
            onClick={handleDownloadHtml}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title={`Download standalone offline copy: ${invoiceNo}.html`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            .HTML
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Close (Esc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Document Body Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-visible max-w-[850px] w-full mx-auto my-0 transition-all border border-slate-200/80">
        {template === 'education_receipt' && (
          <EducationFeeReceipt invoice={invoice} customer={customer} settings={settings} />
        )}
        {template === 'education_partial' && (
          <EducationPartialFeeReceipt invoice={invoice} customer={customer} settings={settings} />
        )}
        {template === 'tally' && (
          <TallyStyleInvoice invoice={invoice} customer={customer} settings={settings} />
        )}
        {template === 'modern_tmb' && (
          <ModernStyleInvoice invoice={invoice} customer={customer} settings={settings} templateVariant="tmb" />
        )}
        {template === 'modern_jupiter' && (
          <ModernStyleInvoice invoice={invoice} customer={customer} settings={settings} templateVariant="jupiter" />
        )}
      </div>

      <div className="no-print h-16 w-full shrink-0"></div>
    </div>
  );
};

export default InvoiceViewer;
