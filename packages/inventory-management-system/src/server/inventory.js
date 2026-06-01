/**
 * Inventory Management Logic
 */

const SHEETS = {
  INVENTORY: 'Inventory',
  TRANSACTIONS: 'Transactions',
  SETTINGS: 'Settings',
};

/**
 * Initialize the Spreadsheet with required sheets and headers
 */
export const initDatabase = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Inventory Sheet
  let inventorySheet = ss.getSheetByName(SHEETS.INVENTORY);
  if (!inventorySheet) {
    inventorySheet = ss.insertSheet(SHEETS.INVENTORY);
    inventorySheet.appendRow([
      'ID', 
      'વસ્તુનું નામ', 
      'કેટેગરી', 
      'ગુરુકુલ સ્ટોક', 
      'સ્ટોર સ્ટોક', 
      'ખરીદી કિંમત', 
      'વેચાણ કિંમત', 
      'યુનિટ', 
      'Last Updated'
    ]);
    inventorySheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }

  // Transactions Sheet
  let transactionSheet = ss.getSheetByName(SHEETS.TRANSACTIONS);
  if (!transactionSheet) {
    transactionSheet = ss.insertSheet(SHEETS.TRANSACTIONS);
    transactionSheet.appendRow([
      'ID', 
      'Timestamp', 
      'ItemID', 
      'વસ્તુનું નામ', 
      'Type', 
      'Quantity', 
      'લેનાર વ્યક્તિ', 
      'કુલ રકમ', 
      'User', 
      'Remarks'
    ]);
    transactionSheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  // Settings Sheet
  let settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEETS.SETTINGS);
    settingsSheet.appendRow(['Key', 'Value']);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    settingsSheet.appendRow(['title', 'શ્રી સ્વામિનારાયણ ગુરુકુલ નિકોલ']);
    settingsSheet.appendRow(['subtitle', 'Sahitya Store Inventory Management System']);
    settingsSheet.appendRow(['categories', 'Books, Clothes, Food, General']);
  }
};

/**
 * Helper to get a sheet or initialize the database if it doesn't exist
 */
const getSheet = (name) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(name);
  }
  return sheet;
};

/**
 * Get application settings from the Settings sheet
 */
export const getAppSettings = () => {
  try {
    const sheet = getSheet(SHEETS.SETTINGS);
    const data = sheet.getDataRange().getValues();
    const settings = {};
    
    data.forEach(row => {
      if (row[0]) {
        settings[row[0].toString().trim()] = row[1];
      }
    });

    if (!settings.categories) {
      settings.categories = "Books, Clothes, Food, General";
    }

    settings.categoryList = settings.categories.split(',').map(c => c.trim());
    return settings;
  } catch (e) {
    console.error('Error in getAppSettings:', e);
    return {
      title: 'શ્રી સ્વામિનારાયણ ગુરુકુલ નિકોલ',
      subtitle: 'Sahitya Store Inventory Management System',
      categoryList: ['Books', 'Clothes', 'Food', 'General']
    };
  }
};

/**
 * Get all inventory items
 */
export const getInventory = () => {
  try {
    const sheet = getSheet(SHEETS.INVENTORY);
    const data = sheet.getDataRange().getValues();
    
    if (!data || data.length <= 1) return [];
    
    // Normalized keys for internal use
    const headers = [
      'id', 'name', 'category', 'gurukul_stock', 'store_stock', 
      'buy_price', 'sell_price', 'unit', 'last_updated'
    ];
    
    return data
      .slice(1) // Skip headers
      .filter((row) => row[0] && row[0].toString().trim() !== '') 
      .map((row) => {
        const item = {};
        headers.forEach((header, index) => {
          let val = row[index];
          if (val instanceof Date) {
            val = val.toLocaleString();
          }
          item[header] = val;
        });
        return item;
      });
  } catch (e) {
    console.error('Error in getInventory:', e);
    return [];
  }
};

/**
 * Add a new item to inventory
 */
export const addItem = (item) => {
  const sheet = getSheet(SHEETS.INVENTORY);
  const id = Utilities.getUuid();
  const now = new Date();
  
  // [ID, Name, Cat, Gurukul, Store, Buy, Sell, Unit, Date]
  sheet.appendRow([
    id,
    item.name,
    item.category,
    item.gurukul_stock || 0,
    item.store_stock || 0,
    item.buy_price || 0,
    item.sell_price || 0,
    item.unit || 'pcs',
    now
  ]);
  
  SpreadsheetApp.flush();
  return id;
};

/**
 * Update an existing item
 */
export const updateItem = (item) => {
  const sheet = getSheet(SHEETS.INVENTORY);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === item.id) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) throw new Error('Item not found');

  sheet.getRange(rowIndex, 2).setValue(item.name);
  sheet.getRange(rowIndex, 3).setValue(item.category);
  sheet.getRange(rowIndex, 4).setValue(item.gurukul_stock || 0);
  sheet.getRange(rowIndex, 5).setValue(item.store_stock || 0);
  sheet.getRange(rowIndex, 6).setValue(item.buy_price || 0);
  sheet.getRange(rowIndex, 7).setValue(item.sell_price || 0);
  sheet.getRange(rowIndex, 8).setValue(item.unit || 'pcs');
  sheet.getRange(rowIndex, 9).setValue(new Date());

  SpreadsheetApp.flush();
  return true;
};

/**
 * Record a transaction and update stock
 */
export const recordTransaction = (transaction) => {
  const invSheet = getSheet(SHEETS.INVENTORY);
  const transSheet = getSheet(SHEETS.TRANSACTIONS);
  
  const invData = invSheet.getDataRange().getValues();
  let itemRowIndex = -1;
  let itemName = '';
  
  for (let i = 1; i < invData.length; i++) {
    if (invData[i][0] === transaction.itemId) {
      itemRowIndex = i + 1;
      itemName = invData[i][1];
      break;
    }
  }
  
  if (itemRowIndex === -1) throw new Error('Item not found');
  
  // Decide which stock to update (defaulting to gurukul_stock for now, or based on type)
  const currentStock = Number(invData[itemRowIndex - 1][3]); // Column 4: Gurukul Stock
  const quantity = Number(transaction.quantity);
  const sellPrice = Number(invData[itemRowIndex - 1][6]); // Column 7: Sell Price
  
  const change = transaction.type === 'IN' ? quantity : -quantity;
  const newStock = currentStock + change;
  
  if (newStock < 0) throw new Error('Insufficient stock in Gurukul');
  
  // Update inventory [Gurukul Stock]
  invSheet.getRange(itemRowIndex, 4).setValue(newStock);
  invSheet.getRange(itemRowIndex, 9).setValue(new Date());
  
  // Record transaction [ID, Timestamp, ItemID, ItemName, Type, Qty, Receiver, Total, User, Remarks]
  transSheet.appendRow([
    Utilities.getUuid(),
    new Date(),
    transaction.itemId,
    itemName,
    transaction.type,
    quantity,
    transaction.receiver || '',
    quantity * sellPrice,
    Session.getActiveUser().getEmail(),
    transaction.remarks || ''
  ]);
  
  SpreadsheetApp.flush();
  return true;
};

/**
 * Get all transactions for today
 */
export const getTodaysTransactions = () => {
  try {
    const sheet = getSheet(SHEETS.TRANSACTIONS);
    const data = sheet.getDataRange().getValues();
    
    if (!data || data.length <= 1) return [];
    
    const headers = ['id', 'timestamp', 'itemid', 'item_name', 'type', 'quantity', 'receiver', 'total', 'user', 'remarks'];
    const now = new Date();
    const todayStr = now.toDateString();
    
    return data
      .slice(1)
      .filter((row) => {
        const timestamp = new Date(row[1]);
        return timestamp.toDateString() === todayStr;
      })
      .map((row) => {
        const trans = {};
        headers.forEach((header, index) => {
          let val = row[index];
          if (val instanceof Date) {
            val = val.toLocaleString();
          }
          trans[header] = val;
        });
        return trans;
      })
      .reverse(); 
  } catch (e) {
    console.error('Error in getTodaysTransactions:', e);
    return [];
  }
};
