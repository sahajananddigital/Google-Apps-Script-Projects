# AI Context: Inventory Management System

## Purpose
Manages stock tracking, inventory items, and transaction logs for the Gurukul Sahitya Store.

## Database (Google Sheets)
- **Inventory**: Columns `["ID", "વસ્તુનું નામ" (Name), "કેટેગરી" (Category), "ગુરુકુલ સ્ટોક" (Gurukul Stock), "સ્ટોર સ્ટોક" (Store Stock), "ખરીદી કિંમત" (Purchase Price), "વેચાણ કિંમત" (Sales Price), "યુનિટ" (Unit), "Last Updated"]`
- **Transactions**: Columns `["ID", "Timestamp", "ItemID", "વસ્તુનું નામ" (Item Name), "Type", "Quantity", "લેનાર વ્યક્તિ" (Receiver), "કુલ રકમ" (Total Amount), "User", "Remarks"]`
- **Settings**: Columns `["Key", "Value"]` (default title is `શ્રી સ્વામિનારાયણ ગુરુકુલ નિકોલ`)

## File Structure & Entry Points
- GAS Entry: `src/index.js` (Exports database, inventory, transaction and settings functions)
- GAS Backend: `src/server/inventory.js` (Implements spreadsheet CRUD logic)
- React Frontend: `src/html/` (React client code using `main.jsx` entry point)
  - `src/html/components/`: Sub-components for forms, transaction logging, item lists, and search queries.
