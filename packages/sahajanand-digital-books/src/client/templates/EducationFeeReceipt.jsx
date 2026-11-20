import { formatINR, formatDate, numberToWordsINR, amountToWords } from '../utils/formatters';
import { toSafeArray } from '../utils/safeArray';

/**
 * Educational Institute Fee Receipt Template
 * Recreated with exact styling from Vue print template:
 * - Gray banner header with institute details & logo
 * - Sub heading with Receipt metadata & Paid By student details
 * - Program / Course fees table with HSN, Duration, Fees & Total Fees
 * - Accent total summary bar & UPI QR Code with dashed border
 */
const EducationFeeReceipt = ({ invoice, customer, settings = {} }) => {
  if (!invoice) return null;

  const invoiceNo = invoice.name || invoice.InvoiceNo || 'REC-XXXX';
  const invoiceDate = formatDate(invoice.date || invoice.Date);
  const studentName = invoice.party || invoice.CustomerName || customer?.name || 'Student';
  const grandTotal = parseFloat(invoice.grandTotal || invoice.GrandTotal || 0);
  const netTotal = parseFloat(invoice.netTotal || invoice.NetTotal || grandTotal);
  const discountAmount = parseFloat(invoice.discountAmount || invoice.DiscountAmount || 0);

  const rawItems = toSafeArray(invoice.items);
  const items = rawItems.length > 0 ? rawItems : [
    {
      item: invoice.remarks || invoice.party || invoice.CustomerName || 'Annual Program / Course Tuition Fees',
      description: invoice.description || invoice.Description || '',
      hsnCode: invoice.hsnCode || invoice.HSN_SAC || '999293',
      quantity: 1,
      duration: '1 Term / Year',
      rate: grandTotal,
      amount: grandTotal,
    }
  ];

  const companyName = settings.companyName || 'Educational Institute';
  const address = settings.address || customer?.addressLine1 || '';
  const email = settings.email || '';
  const phone = settings.phone || '';
  const gstin = settings.gstin || '';
  const logoUrl = settings.logoUrl || '';
  const brandColor = settings.brandColor || '#112B42';

  // UPI configuration
  const upiPayeeName = settings.upiPayeeName || settings.fullname || settings.companyName || '';
  const upiId = settings.primaryUpiId || '';
  const showQr = settings.showQrCode !== false && Boolean(upiId);
  const grandTotalClean = grandTotal.toString().replace(/[^\d.]/g, '');
  const upiQrUrl = showQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&tn=For Fees ${invoiceNo}&cu=INR&am=${grandTotalClean}`
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
      className="bg-white text-slate-900 w-full min-h-[1050px] flex flex-col justify-between font-sans selection:bg-blue-100"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* 1. Header Section */}
      <div>
        <header className="bg-slate-100/90 px-8 py-8 md:px-12 md:py-10 border-b border-slate-200">
          {/* Institute / Company Details */}
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
                  🎓
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

            <div className="text-left sm:text-right">
              <span
                className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-xs"
                style={{ backgroundColor: brandColor }}
              >
                Fee Receipt
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Official Student Copy</p>
            </div>
          </section>

          {/* Sub Heading Section: Doc Details & Party Details */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Receipt Details */}
            <section className="flex items-start">
              <h3 className="w-1/3 font-bold text-slate-700 uppercase tracking-wider text-xs">Receipt</h3>
              <div className="w-2/3 text-slate-900 font-medium">
                <p className="font-bold text-base text-slate-900 font-mono">{invoiceNo}</p>
                <p className="text-xs text-slate-600 mt-0.5">Date: {invoiceDate}</p>
              </div>
            </section>

            {/* Student / Paid By Details */}
            <section className="flex items-start">
              <h3 className="w-1/3 font-bold text-slate-700 uppercase tracking-wider text-xs">Paid By</h3>
              <div className="w-2/3 text-slate-900 font-medium">
                <p className="font-bold text-base text-slate-900">{studentName}</p>
                {studentAddress && <p className="text-xs text-slate-600 mt-0.5">{studentAddress}</p>}
                {customer?.phone && (
                  <p className="text-xs text-slate-600">Contact: {customer.phone}</p>
                )}
                {customer?.gstin && (
                  <p className="text-xs text-slate-600 font-mono">GSTIN: {customer.gstin}</p>
                )}
              </div>
            </section>
          </div>
        </header>

        {/* 2. Items Table Section */}
        <section className="px-8 pt-8 md:px-12 text-sm">
          {/* Table Header */}
          <div className="pb-3 border-b-2 border-slate-300 flex font-bold text-slate-800 text-xs uppercase tracking-wider">
            <div className="w-5/12">Program / Course</div>
            {showHSN && <div className="w-2/12 text-right">HSN/SAC</div>}
            <div className={showHSN ? 'w-2/12 text-right' : 'w-3/12 text-right'}>Duration / Terms</div>
            <div className="w-2/12 text-right">Fees</div>
            <div className="w-3/12 text-right">Total Fees</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {items.map((row, idx) => {
              const itemName = row.item || row.itemName || row.name || 'Program Fees';
              const hsn = row.hsnCode || row.hsn || row.HSNCode || '999293';
              const duration = row.duration || (row.quantity ? `${row.quantity} ${row.unit || 'Unit'}` : '1 Course');
              const rate = parseFloat(row.rate || row.amount || 0);
              const amount = parseFloat(row.amount || rate * (parseFloat(row.quantity) || 1));

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

      {/* 3. Invoice Footer Section */}
      <footer className="px-8 py-8 md:px-12 md:py-10 border-t border-slate-200 mt-auto">
        {/* Totaled Amounts Bar */}
        <section className="flex flex-wrap justify-end items-center bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 gap-4 sm:gap-8">
          {/* Subtotal */}
          <div className="text-right py-3 px-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Subtotal</h3>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{formatINR(netTotal)}</p>
          </div>

          {/* Discount if present */}
          {discountAmount > 0 && (
            <div className="text-right py-3 px-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Discount</h3>
              <p className="text-base font-bold font-mono text-emerald-600 mt-0.5">- {formatINR(discountAmount)}</p>
            </div>
          )}

          {/* Grand Total */}
          <div
            className="py-4 px-6 text-right text-white min-w-[200px]"
            style={{ backgroundColor: brandColor }}
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-100">Grand Total</h3>
            <p className="text-2xl font-black font-mono mt-0.5">{formatINR(grandTotal)}</p>
          </div>
        </section>

        {/* Amount in Words */}
        <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <span>
            <strong className="text-slate-800">Amount in Words:</strong> {amountToWords(grandTotal, settings?.currency)}
          </span>
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
            Status: {invoice.status || 'Received'}
          </span>
        </div>

        {/* Notes & Pay with UPI QR */}
        <section className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Notes & Instructions */}
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Notes & Fee Policy</h3>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
              {invoice.terms ||
                settings.defaultTerms ||
                '1. Fees once paid are non-refundable and non-transferable under any circumstances.\n2. Please retain this receipt for student ID and examination clearance.\n3. Mention the receipt number for any queries or certificate issuance.'}
            </p>

            <div className="pt-4 flex items-center gap-2 text-[11px] text-slate-500">
              <span>Authorized Signature:</span>
              <div className="border-b border-dashed border-slate-400 w-44 inline-block"></div>
            </div>
          </div>

          {/* Pay with UPI QR */}
          {showQr && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center sm:items-start shrink-0">
              <p className="text-sm font-bold text-slate-900">Pay with UPI QR:</p>
              {upiPayeeName && (
                <p className="text-xs text-slate-700 mt-0.5">
                  <strong>Name:</strong> {upiPayeeName}
                </p>
              )}
              <p className="text-[11px] text-slate-500 font-mono mb-2">VPA: {upiId}</p>

              {/* UPI QR with Black Dashed Border */}
              <div className="border-4 p-1.5 border-black border-dashed rounded-lg bg-white shadow-xs">
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-28 h-28 object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 text-center w-full">
                Scan via GPay / PhonePe / Paytm
              </span>
            </div>
          )}
        </section>
      </footer>
    </main>
  );
};

export default EducationFeeReceipt;
