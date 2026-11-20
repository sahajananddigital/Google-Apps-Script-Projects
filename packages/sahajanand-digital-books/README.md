# Sahajanand Digital Books (Google Apps Script)

A full-featured accounting, invoicing, expense tracking, and ledger management system built for **Sahajanand Digital**, migrated from Frappe Books (`Sahajanand Digital.books.db`) to a custom **Google Apps Script (GAS) + React 18 + Tailwind CSS** web application within the monorepo.

---

## 🚀 Features & Recent Improvements

### 1. Invoices & Billing
- **Interactive Invoice Creation**: Customer auto-fill, dynamic item rows with auto-filled SAC code `998312`, rates, subtotal/discount/grand total calculation, and sequential `SINV-xxxx` numbering.
- **Status Tracking**: Filter and view invoices by `Submitted (Unpaid)`, `Paid`, and `Cancelled`.
- **Payment Settlement**: Partial and full payments automatically deduct invoice balance and update status to `Paid`.

### 2. Print Templates & Live UPI QR Codes (Single-Page Fit)
- **Indian Tally Style (Tax Invoice / Bill of Supply)**: Faithful 1:1 port of Frappe Books Tally template with outer border, two-column buyer/seller details, continuous vertical lines table, amount in words (`numberToWordsINR`), company bank details box, and dynamic UPI QR code generator (`upi://pay?pa=...`).
- **Modern Layouts**: Clean minimalist layouts supporting Primary Bank and Secondary Bank variants.
- **Strict 1-Page A4 Printing**: Optimized print CSS (`@media print`) isolating only `#invoice-print-area`, eliminating multi-page spills and blank page bugs.

### 3. Business Expenses & Bank Balances (Dashboard Widget)
- **Bank & Cash Balances Widget**: Live reconciliation across **Primary Bank**, **Secondary Bank**, and **Cash In Hand** with account details, UPI handles, and total liquidity.
- **Expense Tracking**: Log operational expenses, software subscriptions, hosting, domain renewals, and utilities.
- **Net Cash Flow & Profit**: Dashboard displays Total Invoiced, Collections, Expenses, and Net Margin in real-time.

### 4. Collapsible Chart of Accounts Tree View
- Hierarchical tree view categorized by standard root types (Assets, Liabilities, Equity, Income, Expenses).
- Parents show on top with collapse/expand toggles (`▸` / `▾`), folder/leaf icons, child counts, and indented branch guides.
- **Expand All / Collapse All** buttons and search filter.
- Direct click on any ledger account to view its **General Ledger Statement** with running balance.

---

## 📊 Database Initialization & Migration Options

The application supports seamless setup and data migration directly from the Web App:

1. **1-Click Clean Database Setup:**
   Click **"Initialize Database"** in the Web App's **Migration** tab to automatically set up all 11 required Google Sheet tables with standard double-entry Chart of Accounts, number series, and default company settings.
2. **Download Generic Sample Templates:**
   Inside the **Migration** tab, you can instantly download:
   - **`Gurukul_Books_Sample_Migration_Template.xlsx`**: Pre-formatted Excel workbook ready for bulk data entry.
   - **Individual CSV Templates**: Pre-configured headers for Invoices, Payments, Expenses, Customers, etc.
3. **Drag-and-Drop Import:**
   Drag and drop any multi-table Excel workbook (`.xlsx`), individual CSVs, or migration JSON directly into the web UI to populate your Google Sheets database.
4. **Frappe Books SQLite Migrator (Optional):**
   If migrating from an existing desktop Frappe Books install, run:
   ```bash
   python3 scripts/frappe_books_migrator.py /path/to/your.books.db
   ```
   This generates an import-ready migration payload to drop directly into the web application.

---

## 📁 Package Structure

```
packages/sahajanand-digital-books/
├── appsscript.json                    # Google Apps Script manifest
├── package.json                       # Workspace dependencies & build scripts
├── vite.client.js                     # Vite config for Single-File React SPA
├── vite.config.js                     # Vite config for GAS IIFE backend
├── dist/
│   ├── code.js                        # GAS backend IIFE
│   └── index.html                     # Single-file React SPA
├── scripts/
│   ├── frappe_books_migrator.py       # Universal Frappe Books SQLite migrator
│   └── generate_sample_templates.py   # Sample template generator
└── src/
    ├── index.js                       # Server entrypoint exposing GAS functions
    ├── server/                        # Backend Google Sheets logic
    │   ├── webapp.js                  # doGet() HTML renderer
    │   ├── db.js                      # Sheet schema & initDatabase()
    │   ├── invoice.js                 # Invoicing CRUD & numbering
    │   ├── payment.js                 # Payment receipt processing
    │   ├── expense.js                 # Business expense recording
    │   ├── accounting.js              # Chart of accounts, JVs, and account ledgers
    │   ├── customer.js                # Customer directory CRUD
    │   ├── item.js                    # Services catalog CRUD
    │   └── settings.js                # Company profile & bank settings
    └── client/                        # React UI (UI reference: gurukul-account-manager)
        ├── main.jsx                   # React root
        ├── App.jsx                    # Shell, navigation, offline sync indicator
        ├── GAS.js                     # RPC caller with dev mocking
        ├── index.css                  # Tailwind styles + strict 1-page @media print
        ├── components/
        │   ├── Dashboard.jsx          # KPI cards, bank balances widget, recent expenses
        │   ├── BankBalanceWidget.jsx  # Live reconciliation widget for Bank & Cash accounts
        │   ├── ExpenseModal.jsx       # Quick expense recording modal
        │   ├── ExpenseManager.jsx     # Expenses list, search, and category filters
        │   ├── InvoiceManager.jsx     # Invoices list, filter, status badges
        │   ├── InvoiceCreateForm.jsx  # Create invoice form with dynamic items
        │   ├── InvoiceViewer.jsx      # Modal wrapper with 1-page print button
        │   ├── ChartOfAccountsTree.jsx# Collapsible hierarchical tree view
        │   ├── AccountingManager.jsx  # Tree view, JVs, and General Ledger statements
        │   ├── PaymentManager.jsx     # Payment receipts against invoices
        │   ├── CustomerManager.jsx    # Customer directory with GSTIN & balances
        │   ├── ItemCatalog.jsx        # Services pricing catalog
        │   └── SettingsManager.jsx    # Bank details, UPI IDs, company settings
        ├── templates/
        │   ├── TallyStyleInvoice.jsx  # Indian Tally-style Tax Invoice / Bill of Supply
        │   └── ModernStyleInvoice.jsx # Clean modern invoice template
        └── utils/
            ├── formatters.js          # INR currency (₹), Indian number-to-words
            ├── upi.js                 # Dynamic UPI pay link and QR generator
            └── offlineSync.js         # Offline transaction queue
```

---

## ⚡ Development & Deployment

```bash
# Start local dev server
npm run books:dev

# Build GAS bundle (dist/code.js + dist/index.html)
npm run books:build

# Deploy to Google Apps Script via clasp
npm run books:deploy
```
