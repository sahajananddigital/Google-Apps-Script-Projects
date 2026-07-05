# Gurukul Data Manager 🚀

This is a Google Apps Script (GAS) and React/Vite-based monorepo package designed for **centralized user profile and form data collection**. It copies its structure and design patterns from `gurukul-account-manager` but implements a unified user data registry to enable single-point profile registration.

## Key Features

1. **Central User Profile Registry**: Users register their master profile details (Name, Phone, Email, Role, Department, DOB, Emergency Contact, etc.) only **once**.
2. **Dynamic Identity Lookup**: Across all forms, typing a verified phone number or email instantly fetches profile data.
3. **Inline Registration**: If a user is not found, the profile registry forms expand dynamically inline, letting new users register and submit attendance/seva logs in a single click.
4. **Offline First Syncing**: Powered by localStorage queues and atomic synchronization locks. Submissions queue locally if offline and auto-sync when connection is restored.
5. **Administrative Form Creator**: Direct integration of a Gujarati Google Form builder for "પ્રાતઃ શિરામણી" (Morning Breakfast form) with:
   - Date, serial number, and user profile fields.
   - Up to 5 devotees registration sections.
   - Quantity inputs with number validation.
   - Breakfast item checkboxes.
6. **Unified Monorepo Architecture**:
   - Bundles the React UI into a single self-contained `index.html` via Vite's `vite-plugin-singlefile`.
   - Bundles server-side JavaScript into an IIFE `code.js` to run in Google Apps Script's V8 engine.

---

## Directory Structure

- `src/server/`: Google Apps Script backend source.
  - [webapp.js](file:///packages/gurukul-data-manager/src/server/webapp.js): Initial entry point serving `index.html`.
  - [users.js](file:///packages/packages/gurukul-data-manager/src/server/users.js): Centralized user data database operations (Sheets upserts and lookups).
  - [attendance.js](file:///packages/gurukul-data-manager/src/server/attendance.js): Check-in/attendance logger.
  - [service.js](file:///packages/gurukul-data-manager/src/server/service.js): Volunteer Seva hours logger.
  - [feedback.js](file:///packages/gurukul-data-manager/src/server/feedback.js): Request and suggestion logger.
  - [forms.js](file:///packages/gurukul-data-manager/src/server/forms.js): Automated Google Form builder (Gujarati Breakfast Form).
- `src/client/`: React/Tailwind frontend.
  - [App.jsx](file:///packages/gurukul-data-manager/src/client/App.jsx): Tabs and layout structure.
  - `components/`: Custom UI sections.
    - [Dashboard.jsx](file:///packages/gurukul-data-manager/src/client/components/Dashboard.jsx): Registry graphs, stats, activity feeds, and admin tools.
    - [UserRegistry.jsx](file:///packages/gurukul-data-manager/src/client/components/UserRegistry.jsx): Centralized directory listing and profile editor.
    - [FormsContainer.jsx](file:///packages/gurukul-data-manager/src/client/components/FormsContainer.jsx): Combined forms with identity-based inline registration.
  - `utils/`: Offline sync managers.
- `functions/`: Standard custom sheet functions.
  - [double.js](file:///packages/gurukul-data-manager/functions/double.js): Custom sheet doubling function.

---

## Getting Started

### 1. Install & Build
Run these commands from the root directory of the monorepo:

```bash
# Install dependencies
npm install

# Build client and server bundles
npm run datamanager:build
```

The output compiles into `dist/`.

### 2. Configure Clasp & Deploy
1. Create a spreadsheet on Google Sheets.
2. In the `packages/gurukul-data-manager` directory, run:
   ```bash
   clasp login
   clasp clone <YOUR_SCRIPT_ID_HERE> --rootDir ./dist
   ```
   *(Or modify the `.clasp.json` file inside the directory with your `scriptId`).*
3. Deploy the code to GAS:
   ```bash
   npm run datamanager:deploy
   ```

---

## Database Schema (Google Sheets)

Upon the first execution or entry submission, the backend automatically sets up these sheets:

1. **`Users` Sheet**:
   - `UserID`, `CreatedDate`, `LastUpdated`, `FullName`, `Phone`, `Email`, `Gender`, `DateOfBirth`, `Address`, `UserType`, `Department`, `EmergencyContactName`, `EmergencyContactPhone`, `Notes`
2. **`Attendance` Sheet**:
   - `Date`, `Time`, `UserID`, `FullName`, `Phone`, `Email`, `Purpose`, `Notes`
3. **`ServiceLogs` Sheet**:
   - `Date`, `UserID`, `FullName`, `Phone`, `Email`, `Activity`, `Hours`, `Supervisor`, `Notes`
4. **`Feedback` Sheet**:
   - `Date`, `UserID`, `FullName`, `Phone`, `Email`, `Category`, `Description`, `Priority`, `Status`
