import { formatINR, formatDate, numberToWordsINR } from '../utils/formatters';
import { getUpiQrCodeUrl } from '../utils/upi';
import { replaceMarkers, buildInvoiceMarkerContext } from '../utils/markerEngine';
import { toSafeArray } from '../utils/safeArray';

const TallyStyleInvoice = ({ invoice, customer, settings = {} }) => {
  if (!invoice) return null;

  const invoiceNo = invoice.name || invoice.InvoiceNo || 'SINV-XXXX';
  const invoiceDate = formatDate(invoice.date || invoice.Date);
  const partyName = invoice.party || invoice.CustomerName || 'Cash / Unregistered';
  const grandTotal = parseFloat(invoice.grandTotal || invoice.GrandTotal || 0);
  const netTotal = parseFloat(invoice.netTotal || invoice.NetTotal || grandTotal);
  const discountAmount = parseFloat(invoice.discountAmount || invoice.DiscountAmount || 0);
  const rawItems = toSafeArray(invoice.items);
  const items = rawItems.length > 0 ? rawItems : [
    {
      item: invoice.remarks || invoice.party || invoice.CustomerName || 'Services Rendered / Professional Fees',
      description: invoice.description || invoice.Description || '',
      hsnCode: invoice.hsnCode || invoice.HSN_SAC || '998312',
      qty: 1,
      quantity: 1,
      rate: grandTotal,
      amount: grandTotal,
    }
  ];

  const context = buildInvoiceMarkerContext(invoice, customer, settings);

  const companyName = settings.companyName || 'Your Business Name';
  const udyam = settings.udyam || '';
  const pan = settings.pan || '';
  const email = settings.email || '';
  const phone = settings.phone || '';
  const address = settings.address || 'Business Address';

  const rawDeclaration = settings.gstDeclaration || settings.declaration || 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.';
  const declaration = replaceMarkers(rawDeclaration, context);

  const rawTerms = invoice.terms || invoice.Terms || settings.defaultTerms || '';
  const resolvedTerms = replaceMarkers(rawTerms, context);

  const rawLeftSideNote = settings.leftSideNote || '';
  const resolvedLeftSideNote = replaceMarkers(rawLeftSideNote, context);

  const invoiceTitle = settings.invoiceTitle || 'Tax Invoice / Bill of Supply';

  // Dynamic Bank Details from Settings
  const bankName = settings.primaryBankName || 'Primary Bank';
  const branchName = settings.primaryBankBranch || 'Main Branch';
  const accountNo = settings.primaryAccountNo || 'XXXXXXXXXXXX';
  const ifsc = settings.primaryIfsc || 'BANK0000000';
  const upiId = settings.primaryUpiId || '';

  const showQr = settings.showQrCode !== false && Boolean(upiId);
  const showBank = settings.showBankDetails !== false;
  const showSign = settings.showSignatory !== false;

  const upiQrUrl = showQr
    ? getUpiQrCodeUrl(
        {
          pa: upiId,
          pn: companyName,
          tn: `Bill ${invoiceNo}`,
          am: grandTotal,
        },
        95
      )
    : null;

  return (
    <div id="invoice-print-area" className="bg-white p-3 text-black font-sans text-xs selection:bg-none print-page-fit max-w-[800px] mx-auto">
      {/* Outer Tally Border */}
      <div className="border-2 border-black flex flex-col">
        {/* Top Header */}
        <div className="text-center font-bold text-sm border-b-2 border-black uppercase py-1 tracking-wider bg-slate-50">
          {invoiceTitle}
        </div>

        {/* Company & Buyer Details Grid */}
        <div className="flex border-b-2 border-black">
          {/* Left Column: Company & Buyer */}
          <div className="w-1/2 flex flex-col border-r-2 border-black">
            {/* Company Info */}
            <div className="p-2.5 border-b border-black flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-extrabold text-xs uppercase text-slate-900">{companyName}</p>
                  <p className="text-[10px] text-slate-700 leading-tight mt-0.5">{address}</p>
                  <div className="mt-1 space-y-0.5 text-[10px] text-slate-800">
                    {(udyam || pan) && (
                      <p>
                        {udyam && <span><strong>Reg:</strong> {udyam} </span>}
                        {pan && <span>| <strong>PAN:</strong> {pan}</span>}
                      </p>
                    )}
                    {(email || phone) && (
                      <p>
                        {email && <span><strong>Email:</strong> {email} </span>}
                        {phone && <span>| <strong>Phone:</strong> {phone}</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="p-2.5 flex-1 bg-white">
              <p className="text-[9px] text-slate-500 uppercase font-semibold">Buyer (Bill to)</p>
              <p className="font-bold text-xs text-slate-900 uppercase">{partyName}</p>
              {customer && (
                <div className="text-[10px] text-slate-700 mt-0.5 space-y-0.5 leading-tight">
                  {customer.addressLine1 && <p>{customer.addressLine1}</p>}
                  {(customer.city || customer.state || customer.postalCode) && (
                    <p>{[customer.city, customer.state, customer.postalCode].filter(Boolean).join(', ')}</p>
                  )}
                  {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
                  {customer.gstin && <p><strong>Tax ID / GSTIN:</strong> {customer.gstin}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Invoice Meta */}
          <div className="w-1/2 flex flex-col">
            <div className="flex border-b border-black">
              <div className="w-1/2 p-2 border-r border-black">
                <p className="text-[9px] text-slate-500 font-semibold uppercase">Invoice No.</p>
                <p className="font-bold text-xs text-slate-900">{invoiceNo}</p>
              </div>
              <div className="w-1/2 p-2">
                <p className="text-[9px] text-slate-500 font-semibold uppercase">Dated</p>
                <p className="font-bold text-xs text-slate-900">{invoiceDate}</p>
              </div>
            </div>

            <div className="flex border-b border-black">
              <div className="w-1/2 p-2 border-r border-black">
                <p className="text-[9px] text-slate-500 font-semibold uppercase">Payment Mode</p>
                <p className="font-medium text-[11px] text-slate-800">Online / Bank Transfer</p>
              </div>
              <div className="w-1/2 p-2">
                <p className="text-[9px] text-slate-500 font-semibold uppercase">Status</p>
                <p className="font-bold text-[11px] text-slate-900">{invoice.status || 'Submitted'}</p>
              </div>
            </div>

            {resolvedTerms && (
              <div className="p-2 flex-1">
                <p className="text-[9px] text-slate-500 font-semibold uppercase">Terms of Delivery / Payment</p>
                <p className="text-[10px] text-slate-800 leading-tight whitespace-pre-line mt-0.5">{resolvedTerms}</p>
              </div>
            )}
          </div>
        </div>

        {/* Item Table */}
        <div className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-slate-50 text-[10px] uppercase font-bold text-slate-800">
                <th className="p-1.5 px-2 border-r border-black w-8 text-center">SI</th>
                <th className="p-1.5 px-2 border-r border-black">Description of Goods / Services</th>
                <th className="p-1.5 px-2 border-r border-black w-20 text-center">HSN/SAC</th>
                <th className="p-1.5 px-2 border-r border-black w-14 text-right">Qty</th>
                <th className="p-1.5 px-2 border-r border-black w-20 text-right">Rate</th>
                <th className="p-1.5 px-2 w-24 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {items.map((it, idx) => (
                <tr key={idx} className="align-top text-[11px]">
                  <td className="p-1.5 px-2 border-r border-black text-center text-slate-600 font-mono">{idx + 1}</td>
                  <td className="p-1.5 px-2 border-r border-black">
                    <p className="font-bold text-slate-900">{it.item || it.ItemName}</p>
                    {it.description && <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{it.description}</p>}
                  </td>
                  <td className="p-1.5 px-2 border-r border-black text-center font-mono text-[10px] text-slate-700">
                    {it.hsnCode || it.HSN_SAC || '998312'}
                  </td>
                  <td className="p-1.5 px-2 border-r border-black text-right font-mono">
                    {it.quantity || it.Quantity || 1}
                  </td>
                  <td className="p-1.5 px-2 border-r border-black text-right font-mono">
                    {formatINR(it.rate || it.Rate || it.amount)}
                  </td>
                  <td className="p-1.5 px-2 text-right font-mono font-medium">
                    {formatINR(it.amount || it.Amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Words Row */}
        <div className="flex border-b-2 border-black">
          <div className="w-3/4 border-r-2 border-black p-2.5 flex flex-col justify-end">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">Amount Chargeable (in words)</p>
            <p className="font-bold text-[11px] text-slate-900 mt-0.5">{numberToWordsINR(grandTotal)}</p>
          </div>

          <div className="w-1/4 flex flex-col text-[11px]">
            <div className="flex justify-between p-1 px-2.5">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-mono font-medium">{formatINR(netTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between p-1 px-2.5 text-red-600">
                <span>Discount</span>
                <span className="font-mono">- {formatINR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold mt-auto p-1.5 px-2.5 border-t border-black bg-slate-50 text-xs">
              <span>Total</span>
              <span className="font-mono">{formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Optional Left-Side Notice / Remarks */}
        {resolvedLeftSideNote && (
          <div className="border-b-2 border-black p-2 bg-slate-50/50 text-[10px] text-slate-800 leading-tight">
            <strong className="uppercase tracking-wider text-[9px] text-slate-600">Note: </strong>
            <span className="font-medium whitespace-pre-line">{resolvedLeftSideNote}</span>
          </div>
        )}

        {/* Footer: Bank Info, Dynamic QR & Signatory */}
        <div className="flex bg-white">
          {/* Left Side: Bank Details & QR */}
          <div className="w-2/3 border-r-2 border-black p-2.5 flex flex-col justify-between">
            {showBank && (
              <div className="flex justify-between items-start gap-2">
                <div className="text-[10px] space-y-0.5">
                  <h4 className="font-bold uppercase tracking-wider underline mb-1">Company's Bank Details</h4>
                  <table className="text-[10px] leading-tight">
                    <tbody>
                      <tr><td className="pr-2 text-slate-600 font-medium">Bank Name:</td><td className="font-bold">{bankName}</td></tr>
                      {branchName && <tr><td className="pr-2 text-slate-600 font-medium">Branch:</td><td className="font-bold">{branchName}</td></tr>}
                      <tr><td className="pr-2 text-slate-600 font-medium">A/c No:</td><td className="font-bold font-mono">{accountNo}</td></tr>
                      <tr><td className="pr-2 text-slate-600 font-medium">IFS Code:</td><td className="font-bold font-mono">{ifsc}</td></tr>
                      {pan && <tr><td className="pr-2 text-slate-600 font-medium">PAN:</td><td className="font-bold font-mono">{pan}</td></tr>}
                      {upiId && <tr><td className="pr-2 text-slate-600 font-medium">UPI ID:</td><td className="font-bold text-blue-700 font-mono">{upiId}</td></tr>}
                    </tbody>
                  </table>
                </div>

                {showQr && upiQrUrl && (
                  <div className="text-center shrink-0">
                    <p className="text-[9px] font-bold text-slate-700 mb-0.5">Pay via UPI</p>
                    <div className="border border-black p-0.5 inline-block bg-white shadow-xs">
                      <img src={upiQrUrl} alt="UPI QR" className="w-16 h-16" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 text-[9px] text-slate-700 leading-tight border-t border-slate-200 pt-1.5">
              <span className="font-bold underline">Declaration:</span>
              <p className="mt-0.5">{declaration}</p>
            </div>
          </div>

          {/* Right Side: Signatory */}
          <div className="w-1/3 p-2.5 flex flex-col justify-between">
            <div className="text-right text-[10px]">
              <p>for <strong className="uppercase text-slate-900">{companyName}</strong></p>
            </div>
            {showSign && (
              <div className="text-right text-[10px] font-bold mt-10 pt-1.5 border-t border-slate-300">
                <p>Authorised Signatory</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] mt-1.5 text-slate-500 uppercase tracking-widest">
        This is a Computer Generated Document
      </p>
    </div>
  );
};

export default TallyStyleInvoice;
