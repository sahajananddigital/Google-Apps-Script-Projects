import { getSheet, SHEETS, getRowsAsObjects, getNextSeriesNumber } from './db.js';

/**
 * Get all invoices with nested items
 */
export const getInvoices = () => {
  const invoices = getRowsAsObjects(SHEETS.INVOICES);
  const items = getRowsAsObjects(SHEETS.INVOICE_ITEMS);

  const itemsByInvoice = {};
  items.forEach((item) => {
    const invNo = String(item.InvoiceNo || item.invoiceNo || '').trim();
    if (invNo) {
      if (!itemsByInvoice[invNo]) {
        itemsByInvoice[invNo] = [];
      }
      const rawQty = item.Quantity !== undefined ? item.Quantity : item.quantity;
      const qty = (rawQty !== '' && !isNaN(parseFloat(rawQty))) ? parseFloat(rawQty) : 1;
      const rawRate = item.Rate !== undefined ? item.Rate : (item.rate !== undefined ? item.rate : 0);
      const rate = parseFloat(rawRate) || 0;
      const rawAmt = item.Amount !== undefined ? item.Amount : (item.amount !== undefined ? item.amount : (rate * qty));
      const amount = parseFloat(rawAmt) || (rate * qty);

      itemsByInvoice[invNo].push({
        ...item,
        item: item.item || item.ItemName || '',
        itemName: item.itemName || item.ItemName || '',
        ItemName: item.ItemName || item.item || item.itemName || '',
        description: item.description || item.Description || '',
        Description: item.Description || item.description || '',
        hsnCode: String(item.hsnCode || item.HSN_SAC || '999293'),
        HSN_SAC: String(item.HSN_SAC || item.hsnCode || '999293'),
        quantity: qty,
        Quantity: qty,
        rate: rate,
        Rate: rate,
        amount: amount,
        Amount: amount,
      });
    }
  });

  const fullInvoices = invoices.map((inv) => {
    const invNo = String(inv.InvoiceNo || inv.name || inv.invoiceNo || '').trim();
    const gTotal = parseFloat(inv.GrandTotal !== undefined ? inv.GrandTotal : (inv.grandTotal !== undefined ? inv.grandTotal : 0)) || 0;
    const nTotal = parseFloat(inv.NetTotal !== undefined ? inv.NetTotal : (inv.netTotal !== undefined ? inv.netTotal : gTotal)) || 0;
    const dAmount = parseFloat(inv.DiscountAmount !== undefined ? inv.DiscountAmount : (inv.discountAmount !== undefined ? inv.discountAmount : 0)) || 0;
    const oAmount = parseFloat(inv.OutstandingAmount !== undefined ? inv.OutstandingAmount : (inv.outstandingAmount !== undefined ? inv.outstandingAmount : gTotal)) || 0;

    return {
      ...inv,
      name: inv.name || inv.InvoiceNo || '',
      invoiceNo: inv.invoiceNo || inv.InvoiceNo || '',
      InvoiceNo: inv.InvoiceNo || inv.name || inv.invoiceNo || '',
      date: inv.date || inv.Date || '',
      Date: inv.Date || inv.date || '',
      party: inv.party || inv.CustomerName || '',
      customerName: inv.customerName || inv.CustomerName || '',
      CustomerName: inv.CustomerName || inv.customerName || inv.party || '',
      netTotal: nTotal,
      NetTotal: nTotal,
      discountAmount: dAmount,
      DiscountAmount: dAmount,
      grandTotal: gTotal,
      GrandTotal: gTotal,
      outstandingAmount: oAmount,
      OutstandingAmount: oAmount,
      status: inv.status || inv.Status || 'Submitted',
      Status: inv.Status || inv.status || 'Submitted',
      terms: inv.terms || inv.Terms || '',
      Terms: inv.Terms || inv.terms || '',
      items: itemsByInvoice[invNo] || [],
    };
  });

  // Reverse to show newest invoices first
  return JSON.stringify(fullInvoices.reverse());
};

/**
 * Create a new Sales Invoice
 */
export const createInvoice = (invoiceData) => {
  const invSheet = getSheet(SHEETS.INVOICES);
  const itmSheet = getSheet(SHEETS.INVOICE_ITEMS);

  const invoiceNo = invoiceData.invoiceNo || getNextSeriesNumber('SalesInvoice');
  const date = invoiceData.date || new Date().toISOString().substring(0, 10);
  const customerName = invoiceData.customerName || '';
  const netTotal = parseFloat(invoiceData.netTotal || 0);
  const discountAmount = parseFloat(invoiceData.discountAmount || 0);
  const grandTotal = parseFloat(invoiceData.grandTotal || (netTotal - discountAmount));
  const status = invoiceData.status || 'Submitted';
  const terms = invoiceData.terms || '';
  const createdAt = new Date().toISOString();

  // Outstanding amount equals grandTotal unless partial/full payment already registered
  const outstandingAmount = grandTotal;

  // Append Invoice
  invSheet.appendRow([
    invoiceNo,
    date,
    customerName,
    invoiceData.account || 'Debtors',
    netTotal,
    discountAmount,
    grandTotal,
    outstandingAmount,
    status,
    terms,
    createdAt,
  ]);

  // Append line items
  if (Array.isArray(invoiceData.items)) {
    invoiceData.items.forEach((item, idx) => {
      const itemId = `ITEM-${Date.now()}-${idx + 1}`;
      itmSheet.appendRow([
        itemId,
        invoiceNo,
        item.item || item.ItemName || '',
        item.description || item.Description || '',
        item.hsnCode || item.HSN_SAC || '998312',
        parseFloat(item.quantity || item.Quantity || 1),
        parseFloat(item.rate || item.Rate || 0),
        parseFloat(item.amount || item.Amount || 0),
      ]);
    });
  }

  // Update customer balance if customer exists
  updateCustomerOutstanding(customerName, grandTotal);

  return { success: true, invoiceNo };
};

/**
 * Update an invoice status (e.g. Paid, Cancelled, Submitted)
 */
export const updateInvoiceStatus = (invoiceNo, newStatus) => {
  const sheet = getSheet(SHEETS.INVOICES);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === invoiceNo) {
      sheet.getRange(i + 1, 9).setValue(newStatus);
      if (newStatus === 'Paid') {
        sheet.getRange(i + 1, 8).setValue(0); // Clear outstanding
      }
      return { success: true, message: `Invoice ${invoiceNo} updated to ${newStatus}` };
    }
  }

  return { success: false, message: `Invoice ${invoiceNo} not found` };
};

/**
 * Internal helper to update customer outstanding balance
 */
const updateCustomerOutstanding = (customerName, amountDelta) => {
  if (!customerName) return;
  const custSheet = getSheet(SHEETS.CUSTOMERS);
  const data = custSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === customerName) {
      const current = parseFloat(data[i][11] || 0);
      custSheet.getRange(i + 1, 12).setValue(current + amountDelta);
      break;
    }
  }
};
