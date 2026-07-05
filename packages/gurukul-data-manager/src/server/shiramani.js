import { getUserByContact } from './users.js';

const SHIRAMANI_SHEET_NAME = "PratahShiramani";
const HEADERS = [
  "Date", "UserID", "Surname", "FirstName", "FatherName", "Phone", "Email", "SerialNo", "ThalNimitt", "Occupation",
  "Devotee1_Surname", "Devotee1_Name", "Devotee1_DOB", "Devotee1_Phone",
  "Devotee2_Surname", "Devotee2_Name", "Devotee2_DOB", "Devotee2_Phone",
  "Devotee3_Surname", "Devotee3_Name", "Devotee3_DOB", "Devotee3_Phone",
  "Devotee4_Surname", "Devotee4_Name", "Devotee4_DOB", "Devotee4_Phone",
  "Devotee5_Surname", "Devotee5_Name", "Devotee5_DOB", "Devotee5_Phone",
  "Quantity", "Items", "Notes"
];

function getOrCreateShiramaniSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHIRAMANI_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHIRAMANI_SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

export function logShiramani(data) {
  const sheet = getOrCreateShiramaniSheet();
  const contact = data.phone || data.email;
  
  // Lookup user centrally
  const user = getUserByContact(contact);
  
  const userId = user ? user.userId : "GUEST";
  const surname = user ? user.surname : (data.surname || "");
  const firstName = user ? user.firstName : (data.firstName || "");
  const fatherName = user ? user.fatherName : (data.fatherName || "");
  const phone = user ? user.phone : (data.phone || "");
  const email = user ? user.email : (data.email || "");

  // Prepare devotee fields safely (4 fields per devotee: Surname, Name, DOB, Phone)
  const devotees = data.devotees || [];
  const devFields = [];
  for (let i = 0; i < 5; i++) {
    const dev = devotees[i] || {};
    devFields.push(dev.surname || "");
    devFields.push(dev.name || "");
    devFields.push(dev.dob || "");
    devFields.push(dev.phone || "");
  }

  const rowData = [
    data.date || new Date().toLocaleDateString('en-IN'),
    userId,
    surname,
    firstName,
    fatherName,
    phone,
    email,
    data.serialNo || "",
    data.thalNimitt || "",
    data.occupation || "",
    ...devFields,
    Number(data.quantity) || 0,
    Array.isArray(data.items) ? data.items.join(", ") : (data.items || ""),
    data.notes || ""
  ];
  
  sheet.appendRow(rowData);
  
  return { success: true, userId, fullName: `${surname} ${firstName}`.trim() };
}

export function getRecentShiramaniLogs() {
  const sheet = getOrCreateShiramaniSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const recent = [];
  const startIdx = Math.max(1, data.length - 50);
  for (let i = data.length - 1; i >= startIdx; i--) {
    const row = data[i];
    
    // Parse devotees back into list of objects (4 fields offset)
    const devotees = [];
    for (let d = 0; d < 5; d++) {
      const offset = 10 + (d * 4);
      if (row[offset] || row[offset + 1]) {
        devotees.push({
          surname: row[offset],
          name: row[offset + 1],
          dob: row[offset + 2],
          phone: row[offset + 3]
        });
      }
    }

    recent.push({
      date: row[0],
      userId: row[1],
      surname: row[2],
      firstName: row[3],
      fatherName: row[4],
      fullName: `${row[2]} ${row[3]}`.trim(),
      phone: row[5],
      email: row[6],
      serialNo: row[7],
      thalNimitt: row[8],
      occupation: row[9],
      devotees,
      quantity: row[30],
      items: row[31],
      notes: row[32]
    });
  }
  return recent;
}
