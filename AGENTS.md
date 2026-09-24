## Project

Gambit is a desktop chess application (Electron + React + TypeScript). All code lives in `app/`; the game logic sits in `app/src/renderer/src`, while the `main`/`preload` processes stay thin. Domain — `CONTEXT.md`, decisions — `docs/adr/`.

Checks run from `app/`. On changes, default to `npm run lint` and `npm run typecheck`. Run tests only on an explicit user request, and then narrowly (`npm run test:file -- <path>`, `npm run test:changed`); reserve a full `npm test` for large changes.

## Agent skills

1. Always communicate with the user in Russian.
2. Always ask questions interactively (via the question tool), not as text in the reply.
3. When resolving an issue, mark the completed items in the issue itself.

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
