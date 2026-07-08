import { getSettingFromSheet } from './settings.js';

export function getFreePassTypes() {
  const typesStr = getSettingFromSheet('FREE_PASS_TYPES', 'hostel,student,teacher,staff');
  return typesStr.split(',').map(t => t.trim()).filter(Boolean);
}

export function addFreePass(data) {
  const sheetName = "FreePass";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Date", "Time", "Type", "Quantity", "PassType", "TxnID"]);
  } else {
    // Check if the "TotalAmount" column exists and rename it to "PassType"
    const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    const amtIdx = headers.findIndex(h => String(h).trim().toLowerCase() === "totalamount");
    if (amtIdx !== -1) {
      sheet.getRange(1, amtIdx + 1).setValue("PassType");
    }
  }

  sheet.appendRow([
    data.date,
    data.time,
    data.freePassTime,
    data.quantity,
    data.passType || "", // Store selected pass type instead of 0
    data.tempId || ""
  ]);

  return { success: true, lastRow: sheet.getLastRow()};
}
