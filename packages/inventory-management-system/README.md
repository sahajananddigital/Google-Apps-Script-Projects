# Inventory Management System (Gurukul Sahitya Store)

This is a unified Google Apps Script project for managing the Sahitya Store inventory. It features a modern React-based frontend and a robust GAS backend.

## Structure
- `src/server/`: Google Apps Script logic (Spreadsheet interactions, transactions).
- `src/html/`: React-based frontend components and styling.
- `src/index.js`: Main entry point for the GAS backend.

## Features
- **Stock Management:** Real-time tracking of item levels.
- **Transaction Engine:** Log every IN/OUT movement with automatic stock adjustment.
- **Modern UI:** Built with React, following the `javascript-starter` patterns for components and styles.
- **Unified Deployment:** One command to build and push both UI and logic.

## Commands
- **`npm run build`**: Bundles the React UI into `index.html` and the GAS logic into `code.js`.
- **`npm run deploy`**: Builds the project and uses `clasp push` to deploy to Google.
- **`npm run dev`**: Rebuilds automatically on file changes.

## Configuration
- **`.clasp.json`**: Make sure to update the `scriptId` to point to your Google Apps Script project.
- **`appsscript.json`**: Defines the manifest, permissions, and OAuth scopes.

## Developer Patterns
- **Components:** React components live in `src/html/components/`.
- **Styles:** Global and component styles live in `src/html/styles/`.
- **Backend Calls:** Use `google.script.run` inside React components to communicate with `src/server/` functions.
