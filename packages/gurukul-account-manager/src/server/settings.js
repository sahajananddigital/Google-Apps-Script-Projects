export function getSettingFromSheet(key, defaultValue) {
  try {
    const sheetName = "Settings";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Auto-create Settings sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Key", "Value", "Description"]);
      sheet.getRange(1, 1, 1, 3).setFontWeight("bold");
    }
    
    const data = sheet.getDataRange().getValues();
    // Search for existing key
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === key) {
        const val = data[i][1];
        return val !== undefined && val !== "" ? val : defaultValue;
      }
    }
    
    // Key not found, append it with default description
    let description = "";
    if (key === "FOOD_PASS_PRICE") {
      description = "Rate for a single food pass";
    }
    sheet.appendRow([key, defaultValue.toString(), description]);
    return defaultValue;
  } catch (e) {
    console.error("Error reading setting from sheet:", e);
    return defaultValue;
  }
}
