import { getSheet, SHEETS, getRowsAsObjects } from './db.js';

/**
 * Get all company settings as key-value object
 */
export const getAppSettings = () => {
  const settingsRows = getRowsAsObjects(SHEETS.SETTINGS);
  const settings = {};
  settingsRows.forEach((row) => {
    if (row.Key) {
      settings[row.Key] = row.Value;
    }
  });

  return JSON.stringify(settings);
};

/**
 * Save company settings
 */
export const saveAppSettings = (newSettings) => {
  const sheet = getSheet(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const existingKeys = {};

  for (let i = 1; i < data.length; i++) {
    existingKeys[data[i][0]] = i + 1; // row number
  }

  Object.entries(newSettings).forEach(([key, val]) => {
    if (existingKeys[key]) {
      sheet.getRange(existingKeys[key], 2).setValue(val);
    } else {
      sheet.appendRow([key, val]);
    }
  });

  return { success: true, message: 'Settings saved successfully' };
};

/**
 * Get available invoice print templates
 */
export const getPrintTemplates = () => {
  return JSON.stringify([
    {
      id: 'EducationFeeReceipt',
      name: 'Educational Institute Fee Receipt',
      description: 'Official fee receipt with institute logo, student details, course fee table, and UPI QR code.',
    },
    {
      id: 'EducationPartialFeeReceipt',
      name: 'Partial / Installment Fee Receipt',
      description: '3-tier breakdown: Total Course Fee, Paid Today, and Remaining Balance Due with UPI balance link.',
    },
    {
      id: 'IndianStyleTally',
      name: 'Indian Tally Style (Tax Invoice / Bill of Supply)',
      description: 'Classic outer border, 2-column header, vertical table lines, bank details, and dynamic UPI QR code.',
    },
    {
      id: 'ModernProfessional',
      name: 'Modern Professional (Primary Bank & UPI QR)',
      description: 'Clean header, dark blue totals banner, full primary bank details and UPI payment QR.',
    },
    {
      id: 'ModernMinimalist',
      name: 'Modern Minimalist (Secondary Bank & UPI QR)',
      description: 'Clean minimalist layout with secondary bank account and UPI ID.',
    },
  ]);
};
