const USER_SHEET_NAME = "Users";
const HEADERS = [
  "UserID", "CreatedDate", "LastUpdated", "Surname", "FirstName", "FatherName", "Phone", 
  "Email", "Gender", "DateOfBirth", "Address", "UserType", 
  "Department", "EmergencyContactName", "EmergencyContactPhone", "Notes"
];

function getOrCreateUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(USER_SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

export function getUserByContact(contact) {
  if (!contact) return null;
  const sheet = getOrCreateUsersSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  const headers = data[0];
  const phoneIdx = headers.indexOf("Phone");
  const emailIdx = headers.indexOf("Email");

  const searchVal = String(contact).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const phoneVal = phoneIdx !== -1 ? String(row[phoneIdx]).trim().toLowerCase() : "";
    const emailVal = emailIdx !== -1 ? String(row[emailIdx]).trim().toLowerCase() : "";

    if (
      (phoneVal && (phoneVal === searchVal || phoneVal.replace(/[^0-9]/g, "") === searchVal.replace(/[^0-9]/g, ""))) ||
      (emailVal && emailVal === searchVal)
    ) {
      const user = {};
      HEADERS.forEach((header, idx) => {
        user[header.charAt(0).toLowerCase() + header.slice(1)] = row[idx] !== undefined ? row[idx] : "";
      });
      return user;
    }
  }
  return null;
}

export function getAllUsers() {
  const sheet = getOrCreateUsersSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const users = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const user = {};
    HEADERS.forEach((header, idx) => {
      user[header.charAt(0).toLowerCase() + header.slice(1)] = row[idx] !== undefined ? row[idx] : "";
    });
    users.push(user);
  }
  return users;
}

export function upsertUserProfile(userProfile) {
  const sheet = getOrCreateUsersSheet();
  const data = sheet.getDataRange().getValues();
  
  const phone = userProfile.phone ? String(userProfile.phone).trim() : "";
  const email = userProfile.email ? String(userProfile.email).trim() : "";

  if (!phone && !email) {
    throw new Error("Phone or Email is required to register a user profile");
  }

  const headers = data[0];
  const phoneIdx = headers.indexOf("Phone");
  const emailIdx = headers.indexOf("Email");

  let foundRowIdx = -1;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const phoneVal = phoneIdx !== -1 ? String(row[phoneIdx]).trim().toLowerCase() : "";
    const emailVal = emailIdx !== -1 ? String(row[emailIdx]).trim().toLowerCase() : "";

    const searchPhone = phone.toLowerCase();
    const searchEmail = email.toLowerCase();

    if (
      (searchPhone && (phoneVal === searchPhone || phoneVal.replace(/[^0-9]/g, "") === searchPhone.replace(/[^0-9]/g, ""))) ||
      (searchEmail && emailVal === searchEmail)
    ) {
      foundRowIdx = i + 1;
      break;
    }
  }

  const now = new Date();
  
  if (foundRowIdx === -1) {
    let nextNum = 10001;
    if (data.length > 1) {
      const lastRowId = String(data[data.length - 1][0]);
      const match = lastRowId.match(/GDM-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const newUserId = `GDM-${nextNum}`;
    userProfile.userId = newUserId;
    userProfile.createdDate = now;
    userProfile.lastUpdated = now;

    const rowData = HEADERS.map(header => {
      const fieldKey = header.charAt(0).toLowerCase() + header.slice(1);
      return userProfile[fieldKey] !== undefined ? userProfile[fieldKey] : "";
    });

    sheet.appendRow(rowData);
    return userProfile;
  } else {
    const existingRow = data[foundRowIdx - 1];
    userProfile.userId = existingRow[0];
    userProfile.createdDate = existingRow[1];
    userProfile.lastUpdated = now;

    HEADERS.forEach((header, colIdx) => {
      if (header === "UserID" || header === "CreatedDate") return;
      const fieldKey = header.charAt(0).toLowerCase() + header.slice(1);
      const value = userProfile[fieldKey] !== undefined ? userProfile[fieldKey] : "";
      sheet.getRange(foundRowIdx, colIdx + 1).setValue(value);
    });

    return userProfile;
  }
}
