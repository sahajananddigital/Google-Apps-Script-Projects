# Gurukul Monorepo

Welcome to the Gurukul Monorepo, a unified ecosystem for managing Gurukul operations using modern web technologies on the Google Apps Script platform.

## Project Structure

This monorepo uses **npm workspaces** to manage multiple independent but related projects.

```
/
├── packages/
│   └── inventory-management-system/  # Unified GAS Backend + React Frontend
├── README.md                        # Root documentation
├── agents.md                        # AI Agent instructions
└── package.json                     # Monorepo configuration
```

## Getting Started

### Prerequisites
- **Node.js:** v16 or higher
- **npm:** v7 or higher
- **clasp:** `npm install -g @google/clasp` (for deployment)

### Installation
Install dependencies for all projects from the root:
```bash
npm install
```

## Current Projects

### 1. Inventory Management System
A comprehensive tool for maintaining the stock of the Gurukul Sahitya Store.
- **Backend:** Google Apps Script (Server-side logic & Spreadsheet DB)
- **Frontend:** React (Modern, component-based UI)
- **Features:** Stock tracking, transaction logging, item management.

#### Commands
- **Build:** `npm run build` (Builds both client and server)
- **Deploy:** `npm run deploy` (Pushes to Google Apps Script)
- **Dev:** `npm run dev` (Watches for changes)

## Architecture
- **Unified Packages:** Each tool is a self-contained Google Apps Script package containing both its UI and backend logic.
- **Vite Build System:** We use Vite to bundle modern React code into single-file HTML outputs and transpile ES6+ JavaScript for the GAS V8 runtime.
- **Database:** Data is stored in Google Sheets, acting as a lightweight, accessible database.

## Adding New Projects
1. Create a new directory in `packages/`.
2. Initialize it with a `package.json` and the standard GAS/React structure.
3. Add the project to the root `package.json` workspaces.
4. Update the root `README.md` and `agents.md`.
