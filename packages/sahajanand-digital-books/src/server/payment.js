import { getSheet, SHEETS, getRowsAsObjects, getNextSeriesNumber } from './db.js';

/**
 * Get all payment records
 */
export const getPayments = () => {
  const payments = getRowsAsObjects(SHEETS.PAYMENTS);
  return JSON.stringify(payments.reverse());
};

/**
 * Record a payment receipt against an invoice or customer
 */
export const addPayment = (paymentData) => {
  const paySheet = getSheet(SHEETS.PAYMENTS);
  const paymentNo = paymentData.paymentNo || getNextSeriesNumber('Payment');
  const date = paymentData.date || new Date().toISOString().substring(0, 10);
  const customerName = paymentData.customerName || '';
  const invoiceNo = paymentData.invoiceNo || '';
  const amount = parseFloat(paymentData.amount || 0);
  const paymentMethod = paymentData.paymentMethod || 'Transfer';
  const account = paymentData.account || 'Federal Bank';
  const referenceTxnId = paymentData.referenceTxnId || '';
  const createdAt = new Date().toISOString();

  // Append payment row
  paySheet.appendRow([
    paymentNo,
    date,
    customerName,
    invoiceNo,
    amount,
    paymentMethod,
    account,
    referenceTxnId,
    createdAt,
  ]);

  // If tied to an invoice, deduct invoice outstanding and update status
  if (invoiceNo) {
    const invSheet = getSheet(SHEETS.INVOICES);
    const invData = invSheet.getDataRange().getValues();

    for (let i = 1; i < invData.length; i++) {
      if (invData[i][0] === invoiceNo) {
        const currentOutstanding = parseFloat(invData[i][7] || 0);
        const newOutstanding = Math.max(0, currentOutstanding - amount);
        invSheet.getRange(i + 1, 8).setValue(newOutstanding);

        if (newOutstanding === 0) {
          invSheet.getRange(i + 1, 9).setValue('Paid');
        }
        break;
      }
    }
  }

  // Deduct customer outstanding balance
  if (customerName) {
    const custSheet = getSheet(SHEETS.CUSTOMERS);
    const custData = custSheet.getDataRange().getValues();
    for (let i = 1; i < custData.length; i++) {
      if (custData[i][0] === customerName) {
        const current = parseFloat(custData[i][11] || 0);
        custSheet.getRange(i + 1, 12).setValue(Math.max(0, current - amount));
        break;
      }
    }
  }

  return { success: true, paymentNo };
};
