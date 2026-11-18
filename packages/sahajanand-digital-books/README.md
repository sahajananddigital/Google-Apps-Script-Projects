# Sahajanand Digital Books (Google Apps Script)

A full-featured accounting, invoicing, expense tracking, and ledger management system built for **Sahajanand Digital**, migrated from Frappe Books (`Sahajanand Digital.books.db`) to a custom **Google Apps Script (GAS) + React 18 + Tailwind CSS** web application within the monorepo.

---

## 🚀 Features & Recent Improvements

### 1. Invoices & Billing
- **Interactive Invoice Creation**: Customer auto-fill, dynamic item rows with auto-filled SAC code `998312`, rates, subtotal/discount/grand total calculation, and sequential `SINV-xxxx` numbering.
- **Status Tracking**: Filter and view invoices by `Submitted (Unpaid)`, `Paid`, and `Cancelled`.
- **Payment Settlement**: Partial and full payments automatically deduct invoice balance and update status to `Paid`.

### 2. Print Templates & Live UPI QR Codes (Single-Page Fit)
- **Indian Tally Style (Tax Invoice / Bill of Supply)**: Faithful 1:1 port of Frappe Books Tally template with outer border, two-column buyer/seller details, continuous vertical lines table, amount in words (`numberToWordsINR`), company bank details box, and dynamic UPI QR code generator (`upi://pay?pa=sahajananddigitalnikol@tmb...`).
- **Modern Layouts**: Clean minimalist layouts supporting Tamilnad Mercantile Bank and Jupiter Bank variants.
- **Strict 1-Page A4 Printing**: Optimized print CSS (`@media print`) isolating only `#invoice-print-area`, eliminating multi-page spills and blank page bugs.

### 3. Business Expenses & Bank Balances (Dashboard Widget)
- **Bank & Cash Balances Widget**: Live reconciliation across **Federal Bank** (Jupiter), **Tamilnad Mercantile Bank**, and **Cash In Hand** with account details, UPI handles, and total liquidity.
- **Expense Tracking**: Log operational expenses, server hosting (Hetzner), domain renewals, SaaS (Google Workspace), and utilities.
- **Net Cash Flow & Profit**: Dashboard displays Total Invoiced, Collections, Expenses, and Net Margin in real-time.

### 4. Collapsible Chart of Accounts Tree View
- Hierarchical tree view categorized by standard root types (Assets, Liabilities, Equity, Income, Expenses).
- Parents show on top with collapse/expand toggles (`▸` / `▾`), folder/leaf icons, child counts, and indented branch guides.
- **Expand All / Collapse All** buttons and search filter.
- Direct click on any ledger account to view its **General Ledger Statement** with running balance.

---

## 📊 Google Sheets Migration Options

We provide an Excel workbook with matching tab names and headers:
- 📄 **[Sahajanand_Digital_Migration.xlsx](Sahajanand_Digital_Migration.xlsx)** (Multi-sheet Excel workbook)
- 📁 **[migration_csvs/](migration_csvs/)** (Folder of individual CSVs: `Invoices.csv`, `Payments.csv`, `Expenses.csv`, `ChartOfAccounts.csv`, `Customers.csv`, `Items.csv`, `JournalEntries.csv`, `JournalLedgers.csv`, `CompanySettings.csv`, `NumberSeries.csv`)

### How to Import into Google Sheets:
1. Open your target Google Spreadsheet.
2. Go to **File** -> **Import** -> **Upload**.
3. Select `Sahajanand_Digital_Migration.xlsx` and choose **"Replace spreadsheet"** (or **"Insert new sheets"**).

---

## 📁 Package Structure

```
packages/sahajanand-digital-books/
├── Sahajanand_Digital_Migration.xlsx  # Multi-sheet Excel workbook for Google Sheets import
├── migration_csvs/                    # Individual CSV files for each tab
├── appsscript.json                    # Google Apps Script manifest
├── package.json                       # Workspace dependencies & build scripts
├── vite.client.js                     # Vite config for Single-File React SPA
├── vite.config.js                     # Vite config for GAS IIFE backend
├── dist/
│   ├── code.js                        # GAS backend IIFE (12.21 kB)
│   └── index.html                     # Single-file React SPA (315.47 kB)
├── scripts/
│   └── generate_excel_migration.py    # Python script that generates the .xlsx & CSVs
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
        │   ├── BankBalanceWidget.jsx  # Reconciliation widget for Federal Bank, TMB, Cash
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
