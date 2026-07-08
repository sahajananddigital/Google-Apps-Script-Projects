# AI Context: Harismruti Path Tracker

## Purpose
A tracker app for recording the completion of spiritual paths/readings (e.g., "Monday Path") via client submission.

## Database (Google Sheets)
- **Active Sheet**: Records entries with columns:
  `["Timestamp", "Name", "Date of Completion", "Path Title (Chintamani)"]`

## File Structure & Entry Points
- GAS Entry: `src/index.js` (Exports standard doGet/doPost webapp handlers)
- GAS Backend: `src/server/webapp.js` (Processes HTML rendering and incoming POST logs)
- React Frontend: `src/html/` (React codebase)
