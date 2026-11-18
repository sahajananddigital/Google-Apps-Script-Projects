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
      id: 'IndianStyleTally',
      name: 'Indian Tally Style (Tax Invoice / Bill of Supply)',
      description: 'Classic outer border, 2-column header, vertical table lines, bank details, and dynamic UPI QR code.',
    },
    {
      id: 'TamilnadMercantileBank',
      name: 'Modern Tamilnad Mercantile Bank',
      description: 'Clean header, dark blue totals banner, full bank details and UPI payment QR.',
    },
    {
      id: 'JupiterBank',
      name: 'Modern Jupiter Bank (Federal Bank)',
      description: 'Clean minimalist layout with Jupiter Neo Banking account and UPI ID.',
    },
  ]);
};
