import { useState, useEffect } from 'react';
import TallyStyleInvoice from '../templates/TallyStyleInvoice';
import ModernStyleInvoice from '../templates/ModernStyleInvoice';
import { printIsolatedElement } from '../utils/printer';

const InvoiceViewer = ({ invoice, customer, settings, onClose, onOpenCustomizer }) => {
  const [template, setTemplate] = useState('tally'); // 'tally' | 'modern_tmb' | 'modern_jupiter'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!invoice) return null;

  const handlePrint = () => {
    printIsolatedElement('invoice-print-area', `${invoice.name || invoice.InvoiceNo || 'Invoice'}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs overflow-y-auto overscroll-contain flex flex-col items-center justify-start p-2 sm:p-4 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Floating / Sticky Control Bar */}
      <div className="no-print sticky top-2 z-30 max-w-[850px] w-full mx-auto mb-4 bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Style:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
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
              Modern Bank 1
            </button>
            <button
              onClick={() => setTemplate('modern_jupiter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                template === 'modern_jupiter' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modern Bank 2
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save 1-Page PDF
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

      {/* Invoice Document Body Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-visible max-w-[850px] w-full mx-auto my-0 transition-all border border-slate-200/80">
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

      {/* Bottom spacer ensuring comfortable scrolling on all devices */}
      <div className="no-print h-16 w-full shrink-0"></div>
    </div>
  );
};

export default InvoiceViewer;
