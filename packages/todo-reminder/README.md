# Todo Email Reminder

A Google Workspace addon that manages todos in a Google Sheet and sends email reminders when tasks are due.

## Why Google Sheets?

Google Sheets is the optimal store for this addon because:

- **Visible data** — you can view and edit todos directly in the spreadsheet
- **No extra setup** — no external database or API keys
- **Backup & sharing** — native Google Drive versioning and sharing
- **Fits the monorepo** — same pattern as other Gurukul GAS packages

## Features

- Add, edit, complete, and delete todos with due date/time
- Per-todo priority and due date/time
- **Daily combined digest** — one email per day with all pending todos grouped (Overdue, Due Today, Upcoming)
- Configurable daily send time (default 8:00 AM)
- Sidebar UI inside the spreadsheet
- Settings for notification email and default remind-before time

## Setup

1. **Create a Google Sheet** — this becomes your todo database.

2. **Create a bound Apps Script project:**
   - Extensions → Apps Script
   - Copy the `scriptId` into `.clasp.json` (see `.clasp.json.sample`)

3. **Install dependencies and deploy:**
   ```bash
   npm install
   npm run todo:build
   # or from packages/todo-reminder:
   npm run deploy
   ```

4. **In the spreadsheet:**
   - Reload the sheet → **Todo Reminder** menu appears
   - Run **Initialize Database** (creates `Todos` and `Settings` sheets)
   - **Add / Manage Reminders** — opens a popup to add todos with due dates
   - Go to **Settings** tab → set daily digest time → **Install Daily Reminders**
   - Use **Send Digest Now** or **Send Test Email** to preview the combined email

## Sheet Structure

**Todos:** ID, Title, Notes, Due Date, Due Time, Priority, Status, Remind Before (min), Reminder Sent At, Created At, Recurrence, Last Completed At

- **Recurrence:** `once` (one-time) or `daily` (e.g. hour logging — appears every day until done for today)

**Settings:** notification_email, default_remind_before_minutes, daily_reminder_hour, daily_reminder_minute, last_daily_digest_sent, trigger_installed

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Watch-build server bundle |
| `npm run build` | Build UI + server for clasp |
| `npm run deploy` | Build and `clasp push` |

## How reminders work

1. A **daily time trigger** runs `checkAndSendReminders` once per day at your configured time.
2. All **pending** todos are collected into **one combined email**, grouped as:
   - **Daily Reminders** — recurring habits (hour logging, standup, etc.)
   - **Overdue** — past due date
   - **Due Today**
   - **Upcoming** — future due dates
   - **No Due Date**
3. Only one digest is sent per day (tracked via `last_daily_digest_sent` in Settings).
4. Use **Send Digest Now** from the menu or Settings to send immediately.

## Development

The React UI runs as a single-file sidebar (`index.html`). Backend logic is bundled to `code.js` as an IIFE with global function exports for GAS.
