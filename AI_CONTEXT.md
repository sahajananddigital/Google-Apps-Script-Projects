# Gurukul Monorepo AI Context

## Overview
Monorepo of Google Apps Script (GAS) packages using Vite to bundle unified packages (GAS backend + React frontend). React frontend is compiled into a single self-contained `index.html` (via `vite-plugin-singlefile`) served by GAS `HtmlService`.

## Monorepo Structure
```
/
├── packages/
│   ├── gurukul-account-manager/       # Accounts, passes (food/free/gate), donations, vouchers (React in client/)
│   ├── gurukul-data-manager/          # User profiles & Shiramani logs (React in client/)
│   ├── harismruti-path-tracker/       # Path tracking logs (React in html/)
│   ├── inventory-management-system/   # Stock tracking & store transactions (React in html/)
│   └── todo-reminder/                 # Tasks & scheduled email reminders (React in html/)
```

## Key Architectures
1. **Spreadsheet DB:** All packages use active Google Spreadsheet sheets as the data store.
2. **Dynamic Settings:** Read/write parameters to a "Settings" sheet (keys like `FOOD_PASS_PRICE` or `FREE_PASS_TYPES`) instead of hardcoding.
3. **Execution Pattern:**
   - Client calls server using `callGAS(functionName, ...args)`.
   - Server entry point is always `src/index.js`, exporting functions to be available via `google.script.run`.
   - Modifying/mutating requests are queued locally for offline support first.

## Scripts & Operations
From the workspace root directory:
- **Build Accounts Manager:** `npm run accounts:build` (deploys: `npm run accounts:deploy`)
- **Build Data Manager:** `npm run datamanager:build` (deploys: `npm run datamanager:deploy`)
- **Build Path Tracker:** `npm run tracker:build` (deploys: `npm run tracker:deploy`)
- **Build Inventory:** `npm run inventory:build` (deploys: `npm run inventory:deploy`)
- **Build Todo Reminder:** `npm run todo:build` (deploys: `npm run todo:deploy`)

## Guidelines for AI
- Keep token usage low: refer to this context file first.
- Keep comments intact, follow existing styling tokens (Tailwind classes / custom CSS).
- Always build before deploying (`npm run <pkg>:build` then `npx clasp push` in the package dir).
