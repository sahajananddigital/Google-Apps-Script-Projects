export function addFoodPass(data) {
  const sheetName = "FoodPass";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Date", "Time", "Type", "Quantity", "TotalAmount", "TxnID"]);
  }

  sheet.appendRow([
    data.date,
    data.time,
    data.foodPassTime,
    data.quantity,
    data.totalAmount,
    data.tempId || ""
  ]);

  return { success: true, lastRow: sheet.getLastRow()};
}

export function getFoodPassPrice() {
  const price = PropertiesService.getScriptProperties().getProperty('FOOD_PASS_PRICE');
  return price ? parseInt(price, 10) : 100;
}

