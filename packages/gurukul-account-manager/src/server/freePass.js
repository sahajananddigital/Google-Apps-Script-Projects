export function addFreePass(data) {
  const sheetName = "FreePass";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Date", "Time", "Type", "Quantity", "TotalAmount", "TxnID"]);
  }

  sheet.appendRow([
    data.date,
    data.time,
    data.freePassTime,
    data.quantity,
    0, // TotalAmount is 0 for free pass
    data.tempId || ""
  ]);

  return { success: true, lastRow: sheet.getLastRow()};
}
