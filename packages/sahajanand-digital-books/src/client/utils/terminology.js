/**
 * Dynamically resolves UI terminology based on organizationType setting
 * Supports: 'business' | 'institute'
 */
export const getTerminology = (organizationType = 'business') => {
  const isInstitute = organizationType === 'institute';

  return {
    isInstitute,
    // Invoice terms
    invoice: isInstitute ? 'Fee Receipt' : 'Invoice',
    invoices: isInstitute ? 'Fee Receipts' : 'Invoices',
    invoiceNumber: isInstitute ? 'Receipt No.' : 'Invoice No.',
    invoiceTitle: isInstitute ? 'Fee Receipt / Receipt Voucher' : 'Tax Invoice / Bill of Supply',
    newInvoice: isInstitute ? '+ Issue Fee Receipt' : '+ Create Invoice',
    invoiceSubtitle: isInstitute
      ? 'Manage student fee receipts, donations, and billing records'
      : 'Manage sales invoices, GST compliance, and customer billing',

    // Customer terms
    customer: isInstitute ? 'Student / Donor' : 'Customer',
    customers: isInstitute ? 'Students / Donors' : 'Customers',
    customerDirectory: isInstitute ? 'Student & Donor Directory' : 'Customer Directory',
    customerSubtitle: isInstitute
      ? 'Track student profiles, roll numbers, donor records, and ledger balances'
      : 'Manage commercial client profiles, billing addresses, and tax identifiers',
    newCustomer: isInstitute ? '+ Add Student / Donor' : '+ Add Customer',

    // Item / Service terms
    item: isInstitute ? 'Fee Head' : 'Service / Item',
    items: isInstitute ? 'Fee Heads & Services' : 'Services & Products',
    catalogTitle: isInstitute ? 'Fee Heads & Activity Catalog' : 'Services & Item Catalog',
    catalogSubtitle: isInstitute
      ? 'Tuition fees, hostel charges, mess fees, examination fees, and welfare funds'
      : 'Service catalog, hourly consulting rates, software licenses, and recurring retainers',
    newItem: isInstitute ? '+ Add Fee Head' : '+ Add Service',

    // Income terms
    incomeHeading: isInstitute ? 'Fee Collections & Donations' : 'Sales & Operating Revenue',
    recentInvoicesHeading: isInstitute ? 'Recent Fee Receipts' : 'Recent Sales Invoices',
  };
};
