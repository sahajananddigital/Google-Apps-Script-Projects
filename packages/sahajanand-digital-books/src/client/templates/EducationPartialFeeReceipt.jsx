import { formatINR, formatDate, numberToWordsINR, amountToWords } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';

/**
 * Educational Institute Partial Fee / Installment Receipt Template
 * Specially designed for installment-based fee collection:
 * - Clear "PARTIAL FEE RECEIPT" badge with installment tracking
 * - 3-tier financial summary: Total Course Fees, Amount Paid Today, Remaining Balance Due
 * - Next installment due date tracking
 * - Dynamic UPI QR code formatted for paying the remaining balance or next installment
 * - Signatures for both Authorized Cashier and Student/Guardian
 */
const EducationPartialFeeReceipt = ({ invoice, customer, settings = {} }) => {
  if (!invoice) return null;

  const invoiceNo = invoice.name || invoice.InvoiceNo || 'PART-REC-XXXX';
  const invoiceDate = formatDate(invoice.date || invoice.Date);
  const studentName = invoice.party || invoice.CustomerName || customer?.name || 'Student';
  const totalCourseFee = parseFloat(invoice.grandTotal || invoice.GrandTotal || 0);
  const remainingDue = parseFloat(
    invoice.outstandingAmount !== undefined ? invoice.outstandingAmount : totalCourseFee * 0.5
  );
  // Amount paid on this voucher/receipt
  const paidToday = Math.max(0, totalCourseFee - remainingDue);
  const isFullyPaid = remainingDue <= 0;

  const rawItems = toSafeArray(invoice.items);
  const items = rawItems.length > 0 ? rawItems : [
    {
      item: invoice.remarks || invoice.party || invoice.CustomerName || 'Diploma Program / Course Tuition',
      description: invoice.description || invoice.Description || 'Course Fee Installment Payment',
      hsnCode: invoice.hsnCode || invoice.HSN_SAC || '999293',
      quantity: 1,
      duration: 'Installment 1',
      rate: totalCourseFee,
      amount: totalCourseFee,
    }
  ];

  const companyName = settings.companyName || 'Educational Institute';
  const address = settings.address || customer?.addressLine1 || '';
  const email = settings.email || '';
  const phone = settings.phone || '';
  const gstin = settings.gstin || '';
  const logoUrl = settings.logoUrl || '';
  const brandColor = settings.brandColor || '#112B42';

  // UPI configuration for paying remaining balance
  const upiPayeeName = settings.upiPayeeName || settings.fullname || settings.companyName || '';
  const upiId = settings.primaryUpiId || '';
  const showQr = settings.showQrCode !== false && Boolean(upiId);
  const remainingDueClean = (remainingDue > 0 ? remainingDue : totalCourseFee).toString().replace(/[^\d.]/g, '');
  const upiQrUrl = showQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&tn=Balance Due ${invoiceNo}&cu=INR&am=${remainingDueClean}`
      )}`
    : null;

  const studentAddress = [
    customer?.addressLine1,
    customer?.addressLine2,
    customer?.city,
    customer?.state,
    customer?.postalCode
  ].filter(Boolean).join(', ');

  const showHSN = items.some((it) => Boolean(it.hsnCode || it.hsn || it.HSNCode));

  return (
    <main
      id="invoice-print-area"
      className="bg-white text-slate-900 w-full min-h-[1050px] flex flex-col justify-between font-sans selection:bg-amber-100"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* 1. Header Section */}
      <div>
        <header className="bg-gradient-to-r from-slate-100 via-amber-50/40 to-slate-100 px-8 py-8 md:px-12 md:py-10 border-b border-amber-200/80">
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="h-14 max-w-36 object-contain mr-4 rounded-lg bg-white p-1 border border-slate-200"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-xl mr-4 shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  💳
                </div>
              )}

              <div>
                <h1 className="font-bold text-2xl tracking-tight" style={{ color: brandColor }}>
                  {companyName}
                </h1>
                {address && <p className="text-xs text-slate-700 mt-0.5">{address}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600 mt-1">
                  <span>
                    <strong className="text-slate-800">Email Id:</strong> {email}
                  </span>
                  <span>
                    <strong className="text-slate-800">Phone No:</strong> {phone}
                  </span>
                  {gstin && (
                    <span>
                      <strong className="text-slate-800">GSTIN:</strong> {gstin}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                {isFullyPaid ? 'Fee Receipt (Paid)' : 'Partial Fee Receipt'}
              </span>
              <p className="text-[11px] font-bold text-amber-800">
                {isFullyPaid ? '✓ Full Fee Cleared' : '⏳ Installment Acknowledgment'}
              </p>
            </div>
          </section>

          {/* Sub Heading: Receipt & Student Info */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <section className="flex items-start">
              <h3 className="w-1/3 font-bold text-slate-700 uppercase tracking-wider text-xs">Receipt Details</h3>
              <div className="w-2/3 text-slate-900 font-medium">
                <p className="font-bold text-base text-slate-900 font-mono">{invoiceNo}</p>
                <p className="text-xs text-slate-600 mt-0.5">Date: {invoiceDate}</p>
                <p className="text-xs text-slate-600">Type: Partial / Installment Voucher</p>
              </div>
            </section>

            <section className="flex items-start">
              <h3 className="w-1/3 font-bold text-slate-700 uppercase tracking-wider text-xs">Student Details</h3>
              <div className="w-2/3 text-slate-900 font-medium">
                <p className="font-bold text-base text-slate-900">{studentName}</p>
                {studentAddress && <p className="text-xs text-slate-600 mt-0.5">{studentAddress}</p>}
                {customer?.phone && (
                  <p className="text-xs text-slate-600">Contact: {customer.phone}</p>
                )}
              </div>
            </section>
          </div>
        </header>

        {/* 2. Highlighted 3-Column Installment Status Cards */}
        <section className="px-8 pt-6 md:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1. Total Program Fee</span>
              <p className="text-lg font-black font-mono text-slate-800 mt-0.5">{formatINR(totalCourseFee)}</p>
              <span className="text-[10px] text-slate-400">Total course commitment</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">2. Paid Today / Received</span>
              <p className="text-lg font-black font-mono text-emerald-700 mt-0.5">{formatINR(paidToday)}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Acknowledged on this receipt</span>
            </div>

            <div className={`p-3 rounded-xl border ${isFullyPaid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isFullyPaid ? 'text-slate-500' : 'text-rose-700'}`}>
                3. Remaining Balance Due
              </span>
              <p className={`text-lg font-black font-mono mt-0.5 ${isFullyPaid ? 'text-slate-800' : 'text-rose-700'}`}>
                {formatINR(remainingDue)}
              </p>
              <span className={`text-[10px] font-semibold ${isFullyPaid ? 'text-slate-500' : 'text-rose-600'}`}>
                {isFullyPaid ? 'Zero balance remaining' : 'Pending next installment'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Items / Course Table */}
        <section className="px-8 pt-6 md:px-12 text-sm">
          <div className="pb-3 border-b-2 border-slate-300 flex font-bold text-slate-800 text-xs uppercase tracking-wider">
            <div className="w-5/12">Program / Course</div>
            {showHSN && <div className="w-2/12 text-right">HSN/SAC</div>}
            <div className={showHSN ? 'w-2/12 text-right' : 'w-3/12 text-right'}>Installment Description</div>
            <div className="w-2/12 text-right">Fee Rate</div>
            <div className="w-3/12 text-right">Net Fee Amount</div>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((row, idx) => {
              const itemName = row.item || row.itemName || row.name || 'Course Fee';
              const hsn = row.hsnCode || row.hsn || row.HSNCode || '999293';
              const duration = row.duration || row.description || 'Program Installment';
              const rate = parseFloat(row.rate || row.amount || 0);
              const amount = parseFloat(row.amount || rate);

              return (
                <div key={idx} className="flex py-3 text-slate-800 items-baseline">
                  <div className="w-5/12 pr-4">
                    <p className="font-bold text-slate-900">{itemName}</p>
                    {row.description && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{row.description}</p>
                    )}
                  </div>
                  {showHSN && (
                    <div className="w-2/12 text-right font-mono text-xs text-slate-600">{hsn}</div>
                  )}
                  <div className={showHSN ? 'w-2/12 text-right text-xs text-slate-600' : 'w-3/12 text-right text-xs text-slate-600'}>
                    {duration}
                  </div>
                  <div className="w-2/12 text-right font-mono text-slate-700">{formatINR(rate)}</div>
                  <div className="w-3/12 text-right font-mono font-bold text-slate-900">{formatINR(amount)}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 4. Partial Fee Receipt Footer */}
      <footer className="px-8 py-8 md:px-12 md:py-10 border-t border-slate-200 mt-auto">
        {/* Amount Paid in Words */}
        <div className="text-xs text-slate-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <strong className="text-slate-900">Received Today (in words): </strong>
            <span className="font-semibold text-emerald-800">{amountToWords(paidToday, settings?.currency)}</span>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
            Payment Mode: Bank / UPI / Cash
          </span>
        </div>

        {/* Notes, Terms & UPI QR */}
        <section className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Terms & Undertaking */}
          <div className="flex-1 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Installment Policy & Notes</h3>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
              {invoice.terms ||
                settings.defaultTerms ||
                '1. This receipt acknowledges partial receipt of course fees as per agreed installment plan.\n2. The remaining outstanding balance must be cleared on or before the due date to ensure uninterrupted classes and lab access.\n3. Fees once paid are non-refundable and non-transferable.'}
            </p>

            <div className="pt-6 grid grid-cols-2 gap-4 text-[11px] text-slate-600">
              <div>
                <span>Student / Parent Signature:</span>
                <div className="border-b border-dashed border-slate-400 w-36 mt-4"></div>
              </div>
              <div>
                <span>Cashier / Authorized Seal:</span>
                <div className="border-b border-dashed border-slate-400 w-36 mt-4"></div>
              </div>
            </div>
          </div>

          {/* Pay Remaining Balance via UPI */}
          {!isFullyPaid && showQr && (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex flex-col items-center sm:items-start shrink-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <p className="text-xs font-bold text-slate-900">Pay Remaining Balance via UPI:</p>
              </div>
              {upiPayeeName && (
                <p className="text-xs text-slate-700">
                  <strong>Name:</strong> {upiPayeeName}
                </p>
              )}
              <p className="text-[11px] text-slate-500 font-mono mb-2">
                Amount: <strong className="text-rose-700 font-bold">{formatINR(remainingDue)}</strong>
              </p>

              {/* UPI QR with Black Dashed Border */}
              <div className="border-4 p-1.5 border-black border-dashed rounded-lg bg-white shadow-xs">
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-28 h-28 object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 text-center w-full">
                Scan to pay balance due
              </span>
            </div>
          )}
        </section>
      </footer>
    </main>
  );
};

export default EducationPartialFeeReceipt;
