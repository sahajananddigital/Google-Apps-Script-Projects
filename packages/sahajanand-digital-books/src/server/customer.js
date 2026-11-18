import { getSheet, SHEETS, getRowsAsObjects } from './db.js';

/**
 * Get all customers
 */
export const getCustomers = () => {
  const customers = getRowsAsObjects(SHEETS.CUSTOMERS);
  return JSON.stringify(customers);
};

/**
 * Save or update a customer
 */
export const saveCustomer = (customerData) => {
  const sheet = getSheet(SHEETS.CUSTOMERS);
  const data = sheet.getDataRange().getValues();
  const name = customerData.name || customerData.CustomerName;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      // Update existing
      sheet.getRange(i + 1, 2).setValue(customerData.email || '');
      sheet.getRange(i + 1, 3).setValue(customerData.phone || '');
      sheet.getRange(i + 1, 4).setValue(customerData.addressLine1 || '');
      sheet.getRange(i + 1, 5).setValue(customerData.addressLine2 || '');
      sheet.getRange(i + 1, 6).setValue(customerData.city || '');
      sheet.getRange(i + 1, 7).setValue(customerData.state || '');
      sheet.getRange(i + 1, 8).setValue(customerData.postalCode || customerData.pincode || '');
      sheet.getRange(i + 1, 9).setValue(customerData.gstin || '');
      sheet.getRange(i + 1, 10).setValue(customerData.gstType || 'Unregistered');
      return { success: true, message: `Customer ${name} updated` };
    }
  }

  // Insert new
  sheet.appendRow([
    name,
    customerData.email || '',
    customerData.phone || '',
    customerData.addressLine1 || '',
    customerData.addressLine2 || '',
    customerData.city || '',
    customerData.state || '',
    customerData.postalCode || customerData.pincode || '',
    customerData.gstin || '',
    customerData.gstType || 'Unregistered',
    customerData.currency || 'INR',
    0, // initial outstanding
  ]);

  return { success: true, message: `Customer ${name} created` };
};
