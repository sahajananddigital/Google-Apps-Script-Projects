import { toSafeArray } from './safeArray.js';

/**
 * Normalizes an invoice line item to guarantee all casing conventions
 * (PascalCase from Google Sheets / Frappe Books, camelCase from UI state, and lowercase)
 * are populated and accessible safely.
 */
export const normalizeInvoiceItem = (row, invoice = {}) => {
  if (!row) return null;

  const grandTotal = parseFloat(
    invoice.grandTotal !== undefined
      ? invoice.grandTotal
      : invoice.GrandTotal !== undefined
      ? invoice.GrandTotal
      : 0
  ) || 0;

  const itemName =
    row.ItemName ||
    row.itemName ||
    row.item ||
    row.name ||
    invoice.remarks ||
    invoice.Remarks ||
    invoice.party ||
    invoice.CustomerName ||
    invoice.customerName ||
    'Program / Course Tuition';

  const description = row.Description || row.description || '';
  const hsn = String(row.HSN_SAC || row.hsnCode || row.hsn || row.HSNCode || '999293');

  const rawQty =
    row.Quantity !== undefined
      ? row.Quantity
      : row.quantity !== undefined
      ? row.quantity
      : 1;
  const qty = rawQty !== '' && !isNaN(parseFloat(rawQty)) ? parseFloat(rawQty) : 1;

  const rawUnit = row.Unit || row.unit;
  const unit = rawUnit || (qty > 1 ? 'Courses' : 'Course');

  const rawRate =
    row.Rate !== undefined
      ? row.Rate
      : row.rate !== undefined
      ? row.rate
      : row.Amount !== undefined
      ? row.Amount
      : row.amount !== undefined
      ? row.amount
      : grandTotal;
  const rate = parseFloat(rawRate) || 0;

  const rawAmount =
    row.Amount !== undefined
      ? row.Amount
      : row.amount !== undefined
      ? row.amount
      : rate * qty;
  const amount = parseFloat(rawAmount) || rate * qty;

  const duration =
    row.Duration ||
    row.duration ||
    (row.Description || row.description
      ? row.Description || row.description
      : rawUnit
      ? `${qty} ${rawUnit}`
      : qty > 1
      ? `${qty} Courses`
      : '1 Course');

  return {
    item: itemName,
    itemName,
    ItemName: itemName,
    description,
    Description: description,
    hsnCode: hsn,
    hsn,
    HSN_SAC: hsn,
    HSNCode: hsn,
    quantity: qty,
    Quantity: qty,
    unit,
    Unit: unit,
    duration,
    Duration: duration,
    rate,
    Rate: rate,
    amount,
    Amount: amount,
  };
};

/**
 * Normalizes an array of items for an invoice.
 * If the item array is empty, creates a single default line item using invoice totals and remarks.
 */
export const normalizeInvoiceItems = (items, invoice = {}) => {
  const safeItems = toSafeArray(items);
  if (safeItems.length === 0) {
    const grandTotal = parseFloat(
      invoice.grandTotal !== undefined
        ? invoice.grandTotal
        : invoice.GrandTotal !== undefined
        ? invoice.GrandTotal
        : 0
    ) || 0;

    return [
      normalizeInvoiceItem(
        {
          ItemName:
            invoice.remarks ||
            invoice.Remarks ||
            invoice.party ||
            invoice.CustomerName ||
            invoice.customerName ||
            'Annual Program / Course Tuition Fees',
          Description: invoice.description || invoice.Description || '',
          HSN_SAC: invoice.hsnCode || invoice.HSN_SAC || '999293',
          Quantity: 1,
          Unit: 'Course',
          Duration: '1 Term / Year',
          Rate: grandTotal,
          Amount: grandTotal,
        },
        invoice
      ),
    ];
  }

  return safeItems.map((it) => normalizeInvoiceItem(it, invoice)).filter(Boolean);
};
