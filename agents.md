# Gurukul Monorepo Agents

This file provides instructions and context for AI agents (like Gemini CLI) interacting with this monorepo.

## Project Context
This is a collection of Google Apps Script (GAS) based management tools for a Gurukul. The architecture is designed to be high-performance, modern (React/Vite), and unified within a monorepo.

## Core Architectural Patterns
1. **Monorepo Structure:** Use `npm workspaces`. Packages live in `packages/`.
2. **Unified GAS Packages:** Each package combines a GAS backend (`src/server/`) and a React frontend (`src/html/`).
3. **Build System:**
   - **Vite:** Used for both server and client builds.
   - **Single File UI:** The React client must be bundled into a single `index.html` (using `vite-plugin-singlefile`) to be served by GAS `HtmlService`.
   - **IIFE Backend:** The server-side code is bundled into an IIFE `code.js`.

## Development Workflows for Agents
- **Adding Logic:** Server-side logic should be added to `src/server/` and exported from `src/index.js`.
- **Adding UI:** React components should live in `src/html/components/` and be styled via `src/html/styles/`.
- **Database:** Always assume Google Sheets as the primary data store. Use the patterns found in `src/server/inventory.js`.
- **Clasp:** Use `clasp push` for deployment. Always ensure a successful build (`npm run build`) before pushing.

## Strategic Subagents
When delegating tasks via `invoke_agent`, consider these specialized roles:
- **`ui-agent`**: Focused on React components, styling (vanilla CSS/javascript-starter patterns), and UX.
- **`gas-backend-agent`**: Focused on Spreadsheet interactions, GAS quotas, and backend performance.
- **`devops-agent`**: Focused on build configurations (Vite), monorepo management, and deployment pipelines.

## Critical Files to Protect
- `.clasp.json`: Contains deployment IDs.
- `appsscript.json`: Manifest file for GAS.
- `vite.config.*.js`: Critical build configurations.
