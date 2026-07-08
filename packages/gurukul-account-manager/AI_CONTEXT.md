# AI Context: Gurukul Account Manager

## Purpose
Manages Gurukul accounts, passes (food pass, free pass, gate pass), donations, and vouchers.

## Database (Google Sheets)
- **FoodPass**: Columns `["Date", "Time", "Type", "Quantity", "TotalAmount", "TxnID"]`
- **FreePass**: Columns `["Date", "Time", "Type", "Quantity", "PassType", "TxnID"]`
- **GatePass**: Columns `["Date", "Time", "Name", "Department", "OutTime", "InTime", "Purpose", "TxnID"]`
- **Donations**: Columns `["Date", "Name", "Amount", "Note", "TxnID"]`
- **Vouchers**: Columns `["Date", "VoucherNo", "PaidTo", "Amount", "Particulars", "Remarks", "TxnID"]`
- **Settings**: Configuration keys like `FOOD_PASS_PRICE` (number) and `FREE_PASS_TYPES` (comma-separated).

## File Structure & Entry Points
- GAS Entry: `src/index.js` (Exports all functions exposed to client)
- GAS Backend:
  - `src/server/foodPass.js`: Handles paid food passes.
  - `src/server/freePass.js`: Handles free passes (dynamic types: Hostel, Student, Teacher, Staff).
  - `src/server/gatePass.js`: Handles gate passes.
  - `src/server/donation.js`: Handles donations & donor details.
  - `src/server/voucher.js`: Handles cash vouchers.
  - `src/server/report.js`: Compiles the daily summary report.
  - `src/server/settings.js`: Utilities for Settings sheet.
- React Frontend: `src/client/` (Uses `main.jsx` entry and `App.jsx` layout)
  - `src/client/components/`: Form and list components (`FoodPassForm`, `FreePassForm`, etc.)
  - `src/client/GAS.js`: Google Apps Script API client wrapper.
