import { getSheet, SHEETS, getRowsAsObjects, getNextSeriesNumber } from './db.js';
import { syncCustomerOutstanding } from './customer.js';

/**
 * Get all payment records
 */
export const getPayments = () => {
  const payments = getRowsAsObjects(SHEETS.PAYMENTS);
  return JSON.stringify(payments.reverse());
};

/**
 * Record a payment receipt against an invoice or customer.
 * Supports single account deposits or split payments across multiple accounts for one invoice.
 */
export const addPayment = (paymentData) => {
  const paySheet = getSheet(SHEETS.PAYMENTS);
  const date = paymentData.date || new Date().toISOString().substring(0, 10);
  const customerName = paymentData.customerName || '';
  const invoiceNo = paymentData.invoiceNo || '';
  const createdAt = new Date().toISOString();

  // Support multi-account splits or single account deposit
  const splits = Array.isArray(paymentData.splits) && paymentData.splits.length > 0
    ? paymentData.splits
    : [
        {
          account: paymentData.account || 'Primary Bank',
          amount: parseFloat(paymentData.amount || 0),
          paymentMethod: paymentData.paymentMethod || 'Transfer',
          referenceTxnId: paymentData.referenceTxnId || '',
        },
      ];

  const createdPayments = [];
  let totalAmount = 0;

  splits.forEach((split) => {
    const splitAmt = parseFloat(split.amount || 0);
    if (splitAmt <= 0) return;

    const paymentNo = split.paymentNo || getNextSeriesNumber('Payment');
    paySheet.appendRow([
      paymentNo,
      date,
      customerName,
      invoiceNo,
      splitAmt,
      split.paymentMethod || paymentData.paymentMethod || 'Transfer',
      split.account || paymentData.account || 'Primary Bank',
      split.referenceTxnId || paymentData.referenceTxnId || '',
      createdAt,
    ]);
    createdPayments.push({ paymentNo, amount: splitAmt, account: split.account });
    totalAmount += splitAmt;
  });

  // If tied to an invoice, deduct total amount from invoice outstanding and update status
  if (invoiceNo && totalAmount > 0) {
    const invSheet = getSheet(SHEETS.INVOICES);
    const invData = invSheet.getDataRange().getValues();

    for (let i = 1; i < invData.length; i++) {
      if (invData[i][0] === invoiceNo) {
        const currentOutstanding = parseFloat(invData[i][7] || 0);
        const newOutstanding = Math.max(0, currentOutstanding - totalAmount);
        invSheet.getRange(i + 1, 8).setValue(newOutstanding);

        if (newOutstanding === 0) {
          invSheet.getRange(i + 1, 9).setValue('Paid');
        }
        break;
      }
    }
  }

  // Deduct/sync customer outstanding balance
  if (customerName && totalAmount > 0) {
    syncCustomerOutstanding();
  }

  return {
    success: true,
    paymentNos: createdPayments.map((p) => p.paymentNo),
    paymentNo: createdPayments[0]?.paymentNo || '',
    totalAmount,
  };
};
