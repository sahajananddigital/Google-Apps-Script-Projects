import { getSheet, SHEETS, getRowsAsObjects, getNextSeriesNumber } from './db.js';

/**
 * Get all invoices with nested items
 */
export const getInvoices = () => {
  const invoices = getRowsAsObjects(SHEETS.INVOICES);
  const items = getRowsAsObjects(SHEETS.INVOICE_ITEMS);

  const itemsByInvoice = {};
  items.forEach((item) => {
    if (!itemsByInvoice[item.InvoiceNo]) {
      itemsByInvoice[item.InvoiceNo] = [];
    }
    itemsByInvoice[item.InvoiceNo].push(item);
  });

  const fullInvoices = invoices.map((inv) => ({
    ...inv,
    items: itemsByInvoice[inv.InvoiceNo] || [],
  }));

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
