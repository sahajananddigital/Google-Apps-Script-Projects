import { formatINR, formatDate, numberToWordsINR } from '../utils/formatters';
import { getUpiQrCodeUrl } from '../utils/upi';
import { replaceMarkers, buildInvoiceMarkerContext } from '../utils/markerEngine';
import { toSafeArray } from '../utils/safeArray';

const ModernStyleInvoice = ({ invoice, customer, settings = {}, templateVariant = 'tmb' }) => {
  if (!invoice) return null;

  const invoiceNo = invoice.name || invoice.InvoiceNo || 'SINV-XXXX';
  const invoiceDate = formatDate(invoice.date || invoice.Date);
  const partyName = invoice.party || invoice.CustomerName || 'Cash';
  const grandTotal = parseFloat(invoice.grandTotal || invoice.GrandTotal || 0);
  const netTotal = parseFloat(invoice.netTotal || invoice.NetTotal || grandTotal);
  const discountAmount = parseFloat(invoice.discountAmount || invoice.DiscountAmount || 0);
  const rawItems = toSafeArray(invoice.items);
  const items = rawItems.length > 0 ? rawItems : [
    {
      item: invoice.remarks || invoice.party || invoice.CustomerName || 'Services Rendered / Professional Fees',
      description: invoice.description || invoice.Description || '',
      hsnCode: invoice.hsnCode || invoice.HSN_SAC || '998312',
      quantity: 1,
      rate: grandTotal,
      amount: grandTotal,
    }
  ];

  const context = buildInvoiceMarkerContext(invoice, customer, settings);

  const companyName = settings.companyName || 'Your Business Name';
  const address = settings.address || 'Business Address';
  const udyam = settings.udyam || '';
  const pan = settings.pan || '';
  const email = settings.email || '';
  const phone = settings.phone || '';
  const brandColor = settings.brandColor || '#112B42';

  const rawDeclaration = settings.gstDeclaration || settings.declaration || 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.';
  const declaration = replaceMarkers(rawDeclaration, context);

  const rawLeftSideNote = settings.leftSideNote || '';
  const resolvedLeftSideNote = replaceMarkers(rawLeftSideNote, context);

  const invoiceTitle = settings.invoiceTitle || 'Tax Invoice';

  // Bank selection based on variant
  const isSecondary = templateVariant === 'jupiter';
  const bankDetails = isSecondary
    ? {
        bankName: settings.secondaryBankName || settings.primaryBankName || 'Secondary Bank',
        branch: settings.secondaryBankBranch || 'Branch',
        accType: settings.secondaryAccountType || 'Savings',
        accNo: settings.secondaryAccountNo || 'XXXXXXXXXXXX',
        ifsc: settings.secondaryIfsc || 'BANK0000000',
        upiId: settings.secondaryUpiId || '',
      }
    : {
        bankName: settings.primaryBankName || 'Primary Bank',
        branch: settings.primaryBankBranch || 'Branch',
        accType: settings.primaryAccountType || 'Current',
        accNo: settings.primaryAccountNo || 'XXXXXXXXXXXX',
        ifsc: settings.primaryIfsc || 'BANK0000000',
        upiId: settings.primaryUpiId || '',
      };

  const showQr = settings.showQrCode !== false && Boolean(bankDetails.upiId);
  const showBank = settings.showBankDetails !== false;
  const showSign = settings.showSignatory !== false;

  const qrUrl = showQr
    ? getUpiQrCodeUrl(
        {
          pa: bankDetails.upiId,
          pn: companyName,
          tn: `Bill ${invoiceNo}`,
          am: grandTotal,
        },
        100
      )
    : null;

  return (
    <div id="invoice-print-area" className="bg-white p-6 max-w-[800px] mx-auto text-slate-800 text-xs font-sans print-page-fit">
      {/* Header Banner */}
      <header className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight" style={{ color: brandColor }}>
              {companyName}
            </h1>
            <p className="text-[10px] text-slate-600 max-w-md">{address}</p>
            {(udyam || pan) && (
              <p className="text-[10px] text-slate-700">
                {udyam && <span><strong>Reg:</strong> {udyam} </span>}
                {pan && <span>| <strong>PAN:</strong> {pan}</span>}
              </p>
            )}
            {(email || phone) && (
              <p className="text-[10px] text-slate-700">
                {email && <span><strong>Email:</strong> {email} </span>}
                {phone && <span>| <strong>Phone:</strong> {phone}</span>}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-0.5">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider text-white"
              style={{ backgroundColor: brandColor }}
            >
              {invoiceTitle}
            </span>
            <p className="text-base font-bold text-slate-900">{invoiceNo}</p>
            <p className="text-[11px] text-slate-500 font-medium">Date: {invoiceDate}</p>
          </div>
        </div>
      </header>

      {/* Bill To & Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-5 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Bill To:</span>
          <p className="font-bold text-sm text-slate-900">{partyName}</p>
          {customer && (
            <div className="text-[11px] text-slate-600 mt-1 leading-snug">
              {customer.addressLine1 && <p>{customer.addressLine1}</p>}
              {(customer.city || customer.state) && <p>{[customer.city, customer.state].filter(Boolean).join(', ')}</p>}
              {customer.gstin && <p className="font-mono text-[10px]">GSTIN: {customer.gstin}</p>}
            </div>
          )}
        </div>

        <div className="text-right space-y-1">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Payment Status</span>
            <p className={`font-bold ${parseFloat(invoice.outstandingAmount || 0) <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {parseFloat(invoice.outstandingAmount || 0) <= 0 ? 'PAID' : 'DUE / UNPAID'}
            </p>
          </div>
          {invoice.terms && (
            <p className="text-[10px] text-slate-500 italic max-w-xs ml-auto leading-tight">
              {replaceMarkers(invoice.terms, context)}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
            <tr>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-2 text-center">HSN/SAC</th>
              <th className="py-2.5 px-2 text-center">Qty</th>
              <th className="py-2.5 px-2 text-right">Rate</th>
              <th className="py-2.5 px-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row, i) => (
              <tr key={i}>
                <td className="py-2 px-3">
                  <p className="font-semibold text-slate-900">{row.item || row.ItemName}</p>
                  {(row.description || row.Description) && (
                    <p className="text-slate-500 text-[10px] whitespace-pre-line">{row.description || row.Description}</p>
                  )}
                </td>
                <td className="py-2 px-2 text-center font-mono text-slate-600">{row.hsnCode || row.HSN_SAC || '998312'}</td>
                <td className="py-2 px-2 text-center font-semibold">{row.quantity || row.Quantity || 1}</td>
                <td className="py-2 px-2 text-right font-mono">{formatINR(row.rate || row.Rate || 0)}</td>
                <td className="py-2 px-2 text-right font-bold font-mono text-slate-900">{formatINR(row.amount || row.Amount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
        <div className="flex-1 text-[11px] text-slate-600">
          <p className="font-semibold text-slate-800">Amount in Words:</p>
          <p className="italic text-slate-700">{numberToWordsINR(grandTotal)}</p>
        </div>

        <div className="w-64 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-medium">{formatINR(netTotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span className="font-mono">- {formatINR(discountAmount)}</span>
            </div>
          )}
          <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
            <span>Grand Total</span>
            <span className="font-mono" style={{ color: brandColor }}>{formatINR(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Left-Side Custom Remarks if provided */}
      {resolvedLeftSideNote && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700">
          <strong className="text-slate-900 uppercase">Special Note: </strong>
          <span className="whitespace-pre-line">{resolvedLeftSideNote}</span>
        </div>
      )}

      {/* Payment Information & Dynamic QR Code */}
      {showBank && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[11px]">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">Payment Details</h3>
            <p><strong>Bank:</strong> {bankDetails.bankName} {bankDetails.branch ? `(${bankDetails.branch})` : ''}</p>
            <p><strong>A/c:</strong> <span className="font-mono font-bold">{bankDetails.accNo}</span> ({bankDetails.accType})</p>
            <p><strong>IFSC:</strong> <span className="font-mono font-bold">{bankDetails.ifsc}</span></p>
            {bankDetails.upiId && <p><strong>UPI ID:</strong> <span className="font-mono font-bold text-blue-600">{bankDetails.upiId}</span></p>}
          </div>

          {showQr && qrUrl && (
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
              <img src={qrUrl} alt="UPI QR" className="w-16 h-16 object-contain" />
              <div className="text-[10px]">
                <p className="font-bold text-slate-900">Scan & Pay via UPI</p>
                <p className="text-slate-500">Google Pay, PhonePe, Paytm</p>
                <p className="font-mono font-bold text-blue-600 mt-0.5">{formatINR(grandTotal)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Declaration & Signatory */}
      <footer className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 text-[10px] text-slate-500">
        <p className="max-w-md"><strong>Declaration:</strong> {declaration}</p>
        {showSign && (
          <div className="text-right shrink-0">
            <p className="font-semibold text-slate-800">For {companyName}</p>
            <div className="h-8"></div>
            <p className="border-t border-slate-200 pt-1 font-bold text-slate-700">Authorised Signatory</p>
          </div>
        )}
      </footer>
    </div>
  );
};

export default ModernStyleInvoice;
