## Project

Gambit — настольное шахматное приложение (Electron + React + TypeScript). Весь код в `app/`; игровая логика — в `app/src/renderer/src`, процессы `main`/`preload` тонкие. Домен — `CONTEXT.md`, решения — `docs/adr/`.

Проверки запускай из `app/`: `npm run lint`, `npm run typecheck`, `npm test`.

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

