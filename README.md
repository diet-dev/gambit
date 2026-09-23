# Gambit

Настольное шахматное приложение. Цель — игра против движка; сейчас реализована интерактивная доска с проверкой легальности ходов.

## Стек

- Electron + electron-vite
- React + TypeScript
- `chess.js` (правила), `react-chessboard` (доска)
- Vitest + Testing Library

## Структура

- `app/` — единственный пакет, всё приложение
  - `app/src/main` — main-процесс Electron (окно, жизненный цикл)
  - `app/src/preload` — мост в renderer
  - `app/src/renderer/src` — React-приложение и вся игровая логика
- `CONTEXT.md` — словарь домена
- `docs/adr/` — архитектурные решения
- `docs/agents/` — настройка инженерных скиллов (трекер, лейблы, доменные доки)

## Запуск

```bash
cd app
npm install
npm run dev
```

## Проверки

```bash
cd app
npm run lint
npm run typecheck
npm test
```

## Текущее состояние

- Есть: интерактивная доска, проверка легальности через `chess.js`, превращение пешки в ферзя.
- Нет: движок-соперник, выбор фигуры при превращении, история ходов и сохранение партий.
