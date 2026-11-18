import { getSheet, SHEETS, getRowsAsObjects } from './db.js';

/**
 * Get all services and items
 */
export const getItems = () => {
  const items = getRowsAsObjects(SHEETS.ITEMS);
  return JSON.stringify(items);
};

/**
 * Save or update an item
 */
export const saveItem = (itemData) => {
  const sheet = getSheet(SHEETS.ITEMS);
  const data = sheet.getDataRange().getValues();
  const name = itemData.name || itemData.ItemName;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      sheet.getRange(i + 1, 5).setValue(itemData.unit || 'Unit');
      sheet.getRange(i + 1, 6).setValue(parseFloat(itemData.rate || 0));
      sheet.getRange(i + 1, 7).setValue(itemData.description || '');
      sheet.getRange(i + 1, 10).setValue(itemData.hsnCode || itemData.HSN_SAC || '998312');
      return { success: true, message: `Item ${name} updated` };
    }
  }

  sheet.appendRow([
    name,
    itemData.itemCode || '',
    itemData.itemGroup || 'Service',
    itemData.itemType || 'Service',
    itemData.unit || 'Unit',
    parseFloat(itemData.rate || 0),
    itemData.description || '',
    itemData.incomeAccount || 'Service',
    itemData.expenseAccount || 'Cost of Goods Sold',
    itemData.hsnCode || itemData.HSN_SAC || '998312',
  ]);

  return { success: true, message: `Item ${name} created` };
};
