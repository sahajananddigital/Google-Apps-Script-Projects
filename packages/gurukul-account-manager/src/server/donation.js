export function getDonorDetails(phone) {
  const sheetName = "Donors";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Phone", "Name", "Ledger", "Purpose"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    return null;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const phoneIdx = headers.indexOf("Phone");
  const nameIdx = headers.indexOf("Name");
  const ledgerIdx = headers.indexOf("Ledger");
  const purposeIdx = headers.indexOf("Purpose");

  if (phoneIdx === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][phoneIdx]).trim() === String(phone).trim()) {
      return {
        phone: String(data[i][phoneIdx]).trim(),
        name: data[i][nameIdx] || "",
        ledger: data[i][ledgerIdx] || "",
        purpose: purposeIdx !== -1 ? data[i][purposeIdx] || "" : ""
      };
    }
  }

  return null;
}

export function getAllDonors() {
  const sheetName = "Donors";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Phone", "Name", "Ledger", "Purpose"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const phoneIdx = headers.indexOf("Phone");
  const nameIdx = headers.indexOf("Name");
  const ledgerIdx = headers.indexOf("Ledger");
  const purposeIdx = headers.indexOf("Purpose");

  if (phoneIdx === -1) return [];

  const donors = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][phoneIdx]) {
      donors.push({
        phone: String(data[i][phoneIdx]).trim(),
        name: data[i][nameIdx] || "",
        ledger: data[i][ledgerIdx] || "",
        purpose: purposeIdx !== -1 ? data[i][purposeIdx] || "" : ""
      });
    }
  }
  return donors;
}

function upsertDonor(phone, name, ledger, purpose) {
  const sheetName = "Donors";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Phone", "Name", "Ledger", "Purpose"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const phoneIdx = headers.indexOf("Phone");
  const nameIdx = headers.indexOf("Name");
  const ledgerIdx = headers.indexOf("Ledger");
  const purposeIdx = headers.indexOf("Purpose");

  let foundRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][phoneIdx]).trim() === String(phone).trim()) {
      foundRowIndex = i + 1; // 1-indexed row number
      break;
    }
  }

  if (foundRowIndex === -1) {
    sheet.appendRow([String(phone).trim(), name, ledger, purpose]);
  } else {
    if (nameIdx !== -1) sheet.getRange(foundRowIndex, nameIdx + 1).setValue(name);
    if (ledgerIdx !== -1) sheet.getRange(foundRowIndex, ledgerIdx + 1).setValue(ledger);
    if (purposeIdx !== -1) sheet.getRange(foundRowIndex, purposeIdx + 1).setValue(purpose);
  }
}

export function addDonation(data) {
  const sheetName = "Donations";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Date", "Name", "Ledger", "Note", "Phone", "Amount", "SMS_Status", "TxnID"]);
  }

  // Ensure donor details are updated or created in the Donors sheet
  upsertDonor(data.phone, data.name, data.ledger, data.purpose || data.note || "");

  const username = PropertiesService.getScriptProperties().getProperty('username');
  const password = PropertiesService.getScriptProperties().getProperty('password');
  const extraSmsPhone = PropertiesService.getScriptProperties().getProperty('extraSmsPhone') || PropertiesService.getScriptProperties().getProperty('swamiji_phone');
  
  let responseCode = "N/A";
  if (username && password) {
    const headers = {
        "Authorization": "Basic " + Utilities.base64Encode(username + ':' + password),
    };

    const phoneNumbers = [`+91${data.phone}`];
    if (extraSmsPhone) {
      phoneNumbers.push(`+91${extraSmsPhone}`);
    }

    const SMSdata = {
        message: `જય સ્વામિનારાયણ ${data.name}, આપ શ્રી ના તરફથી આજે ${data.date} તારીખે રૂપિયા ${data.amount} નો સહયોગ પ્રાપ્ત થયેલ છે. \nશ્રી સ્વામિનારાયણ ગુરુકુળ અમદાવાદ - નિકોલ`,
        phoneNumbers: phoneNumbers,
    };

    try {
      const response = UrlFetchApp.fetch(
          'https://api.sms-gate.app/3rdparty/v1/message',
          {
              method: 'POST',
              contentType: 'application/json',
              headers: headers,
              payload: JSON.stringify(SMSdata),
              muteHttpExceptions: true
          }
      );
      responseCode = response.getResponseCode();
    } catch (e) {
      responseCode = "Error: " + e.message;
    }
  }

  sheet.appendRow([
    data.date,
    data.name,
    data.ledger,
    data.purpose || data.note || "", 
    data.phone,
    data.amount,
    responseCode,
    data.tempId || ""
  ]);

  return { success: true, lastRow: sheet.getLastRow() };
}
