# AI Context: Todo Reminder

## Purpose
Task management dashboard with scheduled email reminders and recurring digests.

## Database (Google Sheets)
- **Todos**: Columns `["ID", "Title", "Notes", "Due Date", "Due Time", "Priority", "Status", "Remind Before (min)", "Reminder Sent At", "Created At", "Recurrence", "Last Completed At"]`
- **Settings**: Configuration parameters for email notification recipients and trigger schedules.

## File Structure & Entry Points
- GAS Entry: `src/index.js` (Exports task/todo list CRUD and trigger controls)
- GAS Backend:
  - `src/server/todos.js`: Handles spreadsheet database queries and mutations.
  - `src/server/reminders.js`: Manages time-driven cron triggers, digests, and email formatting.
- React Frontend: `src/html/` (React client code using `main.jsx` entry point)
  - `src/html/components/`: Sub-components for forms, todo list filters, and trigger status indicator.
