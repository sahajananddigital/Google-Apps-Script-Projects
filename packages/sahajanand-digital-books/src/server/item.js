import { getSheet, SHEETS, getRowsAsObjects } from './db.js';

/**
 * Get all services and items
 */
export const getItems = () => {
  const items = getRowsAsObjects(SHEETS.ITEMS);
  return JSON.stringify(items);
};

/**
 * Save, update, or clone an item/service
 */
export const saveItem = (itemData) => {
  const sheet = getSheet(SHEETS.ITEMS);
  const data = sheet.getDataRange().getValues();
  const name = String(itemData.name || itemData.ItemName || '').trim();
  const originalName = String(itemData.originalName || '').trim();

  if (!name) {
    return { success: false, message: 'Item name is required' };
  }

  // Check for existing item to update
  for (let i = 1; i < data.length; i++) {
    const rowName = String(data[i][0]).trim();
    if ((originalName && rowName === originalName) || (!itemData.isClone && rowName === name)) {
      sheet.getRange(i + 1, 1).setValue(name);
      sheet.getRange(i + 1, 2).setValue(itemData.itemCode || data[i][1] || '');
      sheet.getRange(i + 1, 3).setValue(itemData.itemGroup || data[i][2] || 'Service');
      sheet.getRange(i + 1, 4).setValue(itemData.itemType || data[i][3] || 'Service');
      sheet.getRange(i + 1, 5).setValue(itemData.unit || 'Unit');
      sheet.getRange(i + 1, 6).setValue(parseFloat(itemData.rate || 0));
      sheet.getRange(i + 1, 7).setValue(itemData.description || '');
      sheet.getRange(i + 1, 8).setValue(itemData.incomeAccount || data[i][7] || 'Service');
      sheet.getRange(i + 1, 9).setValue(itemData.expenseAccount || data[i][8] || 'Cost of Goods Sold');
      sheet.getRange(i + 1, 10).setValue(itemData.hsnCode || itemData.HSN_SAC || '998312');
      return { success: true, message: `Item "${name}" updated successfully`, isUpdate: true };
    }
  }

  // Insert as new row (for create or clone)
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

  return { success: true, message: `Item "${name}" created successfully`, isUpdate: false };
};

/**
 * Delete an item
 */
export const deleteItem = (itemName) => {
  const sheet = getSheet(SHEETS.ITEMS);
  const data = sheet.getDataRange().getValues();
  const target = String(itemName || '').trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === target) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `Item "${target}" deleted successfully` };
    }
  }
  return { success: false, message: `Item "${target}" not found` };
};
