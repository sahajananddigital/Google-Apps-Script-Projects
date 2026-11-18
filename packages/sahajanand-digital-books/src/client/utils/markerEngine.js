import { formatINR, formatDate, amountToWords } from './formatters.js';

/**
 * Builds a standardized key-value context dictionary from invoice, customer, and settings objects
 */
export const buildInvoiceMarkerContext = (invoice = {}, customer = {}, settings = {}) => {
  const invNo = invoice.name || invoice.InvoiceNo || 'SINV-XXXX';
  const invDate = invoice.date || invoice.Date || new Date().toISOString().split('T')[0];
  const grandTotal = parseFloat(invoice.grandTotal || invoice.GrandTotal || 0);
  const netTotal = parseFloat(invoice.netTotal || invoice.NetTotal || grandTotal);
  const taxTotal = Math.max(0, grandTotal - netTotal);

  const compName = settings.companyName || 'Business Name';
  const custName = customer.name || customer.CustomerName || invoice.party || invoice.CustomerName || 'Valued Customer / Student';

  return {
    // Company markers
    companyName: compName,
    companyFullname: settings.fullname || compName,
    companyAddress: settings.address || '',
    companyPhone: settings.phone || '',
    companyEmail: settings.email || '',
    companyWebsite: settings.website || '',
    companyPan: settings.pan || '',
    companyGstin: settings.gstin || '',
    companyUdyam: settings.udyam || '',

    // Invoice markers
    invoiceNo: invNo,
    invoiceDate: formatDate(invDate),
    rawInvoiceDate: invDate,
    invoiceStatus: invoice.status || invoice.Status || 'Submitted',
    paymentStatus: parseFloat(invoice.outstandingAmount !== undefined ? invoice.outstandingAmount : (invoice.OutstandingAmount || 0)) <= 0 ? 'PAID' : 'DUE',
    terms: invoice.terms || invoice.Terms || settings.defaultTerms || 'Payment due on receipt.',

    // Financial markers
    netTotal: formatINR(netTotal),
    taxTotal: formatINR(taxTotal),
    grandTotal: formatINR(grandTotal),
    totalInWords: amountToWords(grandTotal),
    outstandingAmount: formatINR(parseFloat(invoice.outstandingAmount !== undefined ? invoice.outstandingAmount : (invoice.OutstandingAmount || 0))),

    // Customer / Student markers
    customerName: custName,
    customerEmail: customer.email || customer.Email || '',
    customerPhone: customer.phone || customer.Phone || '',
    customerAddress: [customer.addressLine1 || customer.AddressLine1, customer.city || customer.City, customer.state || customer.State, customer.pincode || customer.Pincode].filter(Boolean).join(', '),
    customerGstin: customer.gstin || customer.GSTIN || 'URP',

    // Bank markers
    primaryBankName: settings.primaryBankName || '',
    primaryBankBranch: settings.primaryBankBranch || '',
    primaryAccountNo: settings.primaryAccountNo || '',
    primaryIfsc: settings.primaryIfsc || '',
    primaryAccountType: settings.primaryAccountType || 'Current',
    primaryUpiId: settings.primaryUpiId || '',

    secondaryBankName: settings.secondaryBankName || '',
    secondaryAccountNo: settings.secondaryAccountNo || '',
    secondaryIfsc: settings.secondaryIfsc || '',

    // Common labels
    year: new Date().getFullYear().toString(),
  };
};

/**
 * Replace {{marker}} placeholders in text with values from context
 */
export const replaceMarkers = (text = '', context = {}) => {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return context[key] !== undefined && context[key] !== null ? String(context[key]) : match;
  });
};

/**
 * All available markers for user reference and 1-click insertion
 */
export const AVAILABLE_MARKERS = [
  { group: 'Company Info', tags: ['companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyGstin', 'companyPan', 'companyUdyam'] },
  { group: 'Invoice & Dates', tags: ['invoiceNo', 'invoiceDate', 'invoiceStatus', 'paymentStatus', 'terms'] },
  { group: 'Amounts', tags: ['grandTotal', 'netTotal', 'taxTotal', 'totalInWords', 'outstandingAmount'] },
  { group: 'Customer / Student', tags: ['customerName', 'customerAddress', 'customerPhone', 'customerGstin'] },
  { group: 'Bank & UPI', tags: ['primaryBankName', 'primaryAccountNo', 'primaryIfsc', 'primaryBankBranch', 'primaryUpiId'] },
];
