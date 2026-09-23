# Бот-соперник (Stockfish) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать ребёнку соперника-бота: он играет белыми против фиксированного лёгкого Stockfish за чёрных, включаемого переключателем.

**Architecture:** WASM-сборка Stockfish вендорится в `public/` рендерера и запускается как Web Worker. Тонкий адаптер поверх UCI отдаёт `bestmove`, который проходит ту же проверку правилами `chess.js`, что и ход ребёнка. Хук `useEngineOpponent` координирует ход бота; движок — сессионный синглтон (не уничтожается при размонтировании, чтобы не ломаться на StrictMode-двойном эффекте).

**Tech Stack:** Electron 39, React 19, TypeScript 5.9, Vite/electron-vite, vitest + @testing-library/react, chess.js 1.4, Stockfish 19 (WASM lite-single), UCI.

**Spec:** `docs/superpowers/specs/2026-09-23-chess-engine-design.md`

## Global Constraints

- Все команды выполнять из каталога `app/`.
- Проверки перед завершением задачи: `npm test`, `npm run lint`, `npm run typecheck`.
- Новых runtime-зависимостей npm не добавлять: движок вендорится файлами.
- Коммиты — conventional, сообщения на русском.
- Общение с пользователем — на русском.
- Движок: только чёрные; уровень фиксирован (Skill Level 1); переключатель по умолчанию выключен.
- Файлы движка лежат в `app/src/renderer/public/stockfish/`; URL воркера — относительный: `stockfish/stockfish-19-lite-single.js`.

---

### Task 1: Вендоринг ресурсов Stockfish

**Files:**
- Create: `app/src/renderer/public/stockfish/stockfish-19-lite-single.js`
- Create: `app/src/renderer/public/stockfish/stockfish-19-lite-single.wasm`
- Create: `app/src/renderer/public/stockfish/Copying.txt`
- Create: `app/src/renderer/public/stockfish/README.md`
- Test: `app/src/renderer/src/engine/assets.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: файлы `stockfish/stockfish-19-lite-single.js` и `.wasm` (URL воркера задаётся в Task 4).

- [ ] **Step 1: Скачать ресурсы из npm-артефакта (пин `stockfish@19.0.0`)**

```bash
mkdir -p app/src/renderer/public/stockfish
curl -sL "https://unpkg.com/stockfish@19.0.0/bin/stockfish-19-lite-single.js" -o app/src/renderer/public/stockfish/stockfish-19-lite-single.js
curl -sL "https://unpkg.com/stockfish@19.0.0/bin/stockfish-19-lite-single.wasm" -o app/src/renderer/public/stockfish/stockfish-19-lite-single.wasm
curl -sL "https://unpkg.com/stockfish@19.0.0/Copying.txt" -o app/src/renderer/public/stockfish/Copying.txt
ls -la app/src/renderer/public/stockfish
```

Ожидаемо: `.wasm` ~1.8 МБ, `.js` — десятки КБ, `Copying.txt` — текст GPLv3.

- [ ] **Step 2: Посчитать sha256 wasm**

```bash
sha256sum app/src/renderer/public/stockfish/stockfish-19-lite-single.wasm
```

Скопировать полученный hex — он пойдёт в README и в тест.

- [ ] **Step 3: Создать README с провенансом**

Создать `app/src/renderer/public/stockfish/README.md`, подставив фактический `<SHA256>` из Step 2:

```markdown
# Stockfish WASM (vendored)

- Движок: Stockfish 19, сборка `stockfish-19-lite-single` (однопоточная, без SharedArrayBuffer).
- Источник: npm-пакет `stockfish@19.0.0`, https://www.npmjs.com/package/stockfish
  (репозиторий https://github.com/nmrugg/stockfish.js). Внутри — официальный
  Stockfish (https://github.com/official-stockfish/Stockfish).
- Файлы: `stockfish-19-lite-single.js`, `stockfish-19-lite-single.wasm`.
- sha256 (`stockfish-19-lite-single.wasm`): `<SHA256>`
- Лицензия: GPL-3.0 (см. `Copying.txt`).
```

- [ ] **Step 4: Написать падающий тест целостности**

Создать `app/src/renderer/src/engine/assets.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const WASM_PATH = new URL('../../public/stockfish/stockfish-19-lite-single.wasm', import.meta.url)
const README_PATH = new URL('../../public/stockfish/README.md', import.meta.url)

describe('vendored stockfish assets', () => {
  it('ships a wasm binary with the correct magic header', () => {
    const wasm = readFileSync(WASM_PATH)

    expect(wasm.subarray(0, 4).toString('latin1')).toBe('\0asm')
    expect(wasm.length).toBeGreaterThan(1_000_000)
  })

  it('records the wasm sha256 in the README', () => {
    const wasm = readFileSync(WASM_PATH)
    const readme = readFileSync(README_PATH, 'utf8')
    const recorded = /sha256[^:]*:\s*`?([0-9a-f]{64})`?/i.exec(readme)?.[1]
    const actual = createHash('sha256').update(wasm).digest('hex')

    expect(recorded).toBe(actual)
  })
})
```

Добавить импорт `createHash`:

```ts
import { createHash } from 'node:crypto'
```

- [ ] **Step 5: Запустить тест**

Run: `npx vitest run src/renderer/src/engine/assets.test.ts`
Ожидаемо: FAIL, потому что README ещё содержит плейсхолдер `<SHA256>` либо хэш не совпал.

- [ ] **Step 6: Подставить фактический sha256 в README**

Убедиться, что в README стоит реальный hex из Step 2 (64 символа).

- [ ] **Step 7: Запустить тест и проверки**

Run: `npx vitest run src/renderer/src/engine/assets.test.ts`
Ожидаемо: PASS (2 теста).

Run: `npm run lint && npm run typecheck`
Ожидаемо: без ошибок.

- [ ] **Step 8: Commit**

```bash
git add app/src/renderer/public/stockfish app/src/renderer/src/engine/assets.test.ts
git commit -m "chore: завендорить WASM-сборку Stockfish"
```

---

### Task 2: Разбор UCI-хода

**Files:**
- Create: `app/src/renderer/src/engine/uciMove.ts`
- Test: `app/src/renderer/src/engine/uciMove.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: `parseUciMove(uci: string): UciMove | null`, где `UciMove = { from: string; to: string; promotion?: string }`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/renderer/src/engine/uciMove.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseUciMove } from './uciMove'

describe('parseUciMove', () => {
  it('parses a simple move', () => {
    expect(parseUciMove('e2e4')).toEqual({ from: 'e2', to: 'e4' })
  })

  it('parses a promotion move', () => {
    expect(parseUciMove('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' })
  })

  it('parses castling as a king move', () => {
    expect(parseUciMove('e1g1')).toEqual({ from: 'e1', to: 'g1' })
  })

  it('returns null for malformed input', () => {
    expect(parseUciMove('(none)')).toBeNull()
    expect(parseUciMove('e2')).toBeNull()
    expect(parseUciMove('z9z8')).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить тест**

Run: `npx vitest run src/renderer/src/engine/uciMove.test.ts`
Ожидаемо: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать**

Создать `app/src/renderer/src/engine/uciMove.ts`:

```ts
export type UciMove = {
  from: string
  to: string
  promotion?: string
}

const UCI_MOVE = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/

export function parseUciMove(uci: string): UciMove | null {
  const match = UCI_MOVE.exec(uci)

  if (!match) {
    return null
  }

  const [, from, to, promotion] = match

  return promotion ? { from, to, promotion } : { from, to }
}
```

- [ ] **Step 4: Запустить тест**

Run: `npx vitest run src/renderer/src/engine/uciMove.test.ts`
Ожидаемо: PASS (4 теста).

- [ ] **Step 5: Commit**

```bash
git add app/src/renderer/src/engine/uciMove.ts app/src/renderer/src/engine/uciMove.test.ts
git commit -m "feat: разбор UCI-хода"
```

---

### Task 3: Интерфейс транспорта и адаптер Stockfish

**Files:**
- Create: `app/src/renderer/src/engine/uciTransport.ts`
- Create: `app/src/renderer/src/engine/stockfish.ts`
- Test: `app/src/renderer/src/engine/stockfish.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `UciTransport = { post(message: string): void; onMessage(handler: (line: string) => void): void; terminate(): void }`
  - `Engine = { setSkillLevel(level: number): Promise<void>; findBestMove(fen: string): Promise<string>; dispose(): void }`
  - `createStockfishEngine(transport: UciTransport): Engine`

- [ ] **Step 1: Создать интерфейс транспорта**

Создать `app/src/renderer/src/engine/uciTransport.ts`:

```ts
export type UciTransport = {
  post(message: string): void
  onMessage(handler: (line: string) => void): void
  terminate(): void
}
```

- [ ] **Step 2: Написать падающий тест адаптера**

Создать `app/src/renderer/src/engine/stockfish.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createStockfishEngine } from './stockfish'
import { type UciTransport } from './uciTransport'

function createFakeTransport() {
  const sent: string[] = []
  const handlers: ((line: string) => void)[] = []
  const terminate = vi.fn()

  const transport: UciTransport = {
    post: (message) => sent.push(message),
    onMessage: (handler) => handlers.push(handler),
    terminate
  }

  return {
    transport,
    sent,
    terminate,
    emit: (line: string): void => handlers.forEach((handler) => handler(line))
  }
}

describe('createStockfishEngine', () => {
  it('performs the UCI handshake on creation', () => {
    const fake = createFakeTransport()

    createStockfishEngine(fake.transport)

    expect(fake.sent).toContain('uci')
  })

  it('sets the skill level after the handshake', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    await engine.setSkillLevel(1)

    expect(fake.sent).toContain('setoption name Skill Level value 1')
  })

  it('returns the move from the bestmove line', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    const move = engine.findBestMove('8/8/8/8/8/8/8/K6k w - - 0 1')
    await Promise.resolve()
    fake.emit('bestmove e2e4 ponder e7e5')

    await expect(move).resolves.toBe('e2e4')
  })

  it('throws when the engine has no move', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    const move = engine.findBestMove('8/8/8/8/8/8/8/K6k w - - 0 1')
    fake.emit('bestmove (none)')

    await expect(move).rejects.toThrow()
  })

  it('terminates the transport on dispose', () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    engine.dispose()

    expect(fake.terminate).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Запустить тест**

Run: `npx vitest run src/renderer/src/engine/stockfish.test.ts`
Ожидаемо: FAIL — `./stockfish` не найден.

- [ ] **Step 4: Реализовать адаптер**

Создать `app/src/renderer/src/engine/stockfish.ts`:

```ts
import { type UciTransport } from './uciTransport'

export type Engine = {
  setSkillLevel(level: number): Promise<void>
  findBestMove(fen: string): Promise<string>
  dispose(): void
}

export function createStockfishEngine(transport: UciTransport): Engine {
  const listeners = new Set<(line: string) => void>()

  transport.onMessage((line) => {
    for (const listener of [...listeners]) {
      listener(line)
    }
  })

  function waitFor(predicate: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => {
      const listener = (line: string): void => {
        if (predicate(line)) {
          listeners.delete(listener)
          resolve(line)
        }
      }
      listeners.add(listener)
    })
  }

  const ready = (async (): Promise<void> => {
    const uciok = waitFor((line) => line === 'uciok')
    transport.post('uci')
    await uciok
  })()

  return {
    async setSkillLevel(level: number): Promise<void> {
      await ready
      transport.post(`setoption name Skill Level value ${level}`)
    },

    async findBestMove(fen: string): Promise<string> {
      const bestmove = waitFor((line) => line.startsWith('bestmove'))
      await ready
      transport.post(`position fen ${fen}`)
      transport.post('go movetime 500')
      const line = await bestmove
      const move = line.split(' ')[1]

      if (!move || move === '(none)') {
        throw new Error('Stockfish did not return a move')
      }

      return move
    },

    dispose(): void {
      transport.terminate()
    }
  }
}
```

- [ ] **Step 5: Запустить тест**

Run: `npx vitest run src/renderer/src/engine/stockfish.test.ts`
Ожидаемо: PASS (5 тестов).

- [ ] **Step 6: Commit**

```bash
git add app/src/renderer/src/engine/uciTransport.ts app/src/renderer/src/engine/stockfish.ts app/src/renderer/src/engine/stockfish.test.ts
git commit -m "feat: адаптер Stockfish поверх UCI"
```

---

### Task 4: Worker-транспорт и сессионный движок

**Files:**
- Create: `app/src/renderer/src/engine/workerTransport.ts`
- Create: `app/src/renderer/src/engine/defaultEngine.ts`
- Test: `app/src/renderer/src/engine/workerTransport.test.ts`

**Interfaces:**
- Consumes: `UciTransport` (Task 3), `createStockfishEngine`, `Engine` (Task 3).
- Produces:
  - `createWorkerTransport(url: string): UciTransport`
  - `getDefaultEngine(): Engine` (URL `stockfish/stockfish-19-lite-single.js`, Skill Level 1).

- [ ] **Step 1: Написать падающий тест worker-транспорта**

Создать `app/src/renderer/src/engine/workerTransport.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWorkerTransport } from './workerTransport'

describe('createWorkerTransport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('wraps a Web Worker as a UCI transport', () => {
    const postMessage = vi.fn()
    const terminate = vi.fn()
    let instance: { onmessage: ((event: MessageEvent) => void) | null } | null = null

    class FakeWorker {
      onmessage: ((event: MessageEvent) => void) | null = null
      postMessage = postMessage
      terminate = terminate

      constructor() {
        instance = this
      }
    }

    vi.stubGlobal('Worker', FakeWorker)

    const transport = createWorkerTransport('stockfish/engine.js')
    const received: string[] = []
    transport.onMessage((line) => received.push(line))
    transport.post('uci')
    instance!.onmessage!({ data: 'uciok' } as MessageEvent)
    transport.terminate()

    expect(postMessage).toHaveBeenCalledWith('uci')
    expect(received).toEqual(['uciok'])
    expect(terminate).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Запустить тест**

Run: `npx vitest run src/renderer/src/engine/workerTransport.test.ts`
Ожидаемо: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать worker-транспорт**

Создать `app/src/renderer/src/engine/workerTransport.ts`:

```ts
import { type UciTransport } from './uciTransport'

export function createWorkerTransport(url: string): UciTransport {
  const worker = new Worker(url)

  return {
    post: (message) => worker.postMessage(message),
    onMessage: (handler) => {
      worker.onmessage = (event) => handler(String(event.data))
    },
    terminate: () => worker.terminate()
  }
}
```

- [ ] **Step 4: Запустить тест**

Run: `npx vitest run src/renderer/src/engine/workerTransport.test.ts`
Ожидаемо: PASS (1 тест).

- [ ] **Step 5: Реализовать сессионный движок**

Создать `app/src/renderer/src/engine/defaultEngine.ts`:

```ts
import { createStockfishEngine, type Engine } from './stockfish'
import { createWorkerTransport } from './workerTransport'

const ENGINE_URL = 'stockfish/stockfish-19-lite-single.js'
const SKILL_LEVEL = 1

let engine: Engine | null = null

export function getDefaultEngine(): Engine {
  if (!engine) {
    engine = createStockfishEngine(createWorkerTransport(ENGINE_URL))
    void engine.setSkillLevel(SKILL_LEVEL)
  }

  return engine
}
```

- [ ] **Step 6: Проверки**

Run: `npm run lint && npm run typecheck`
Ожидаемо: без ошибок.

- [ ] **Step 7: Commit**

```bash
git add app/src/renderer/src/engine/workerTransport.ts app/src/renderer/src/engine/workerTransport.test.ts app/src/renderer/src/engine/defaultEngine.ts
git commit -m "feat: worker-транспорт и сессионный движок"
```

---

### Task 5: `playMove` в `useChessGame`

**Files:**
- Modify: `app/src/renderer/src/hooks/useChessGame.ts`
- Test: `app/src/renderer/src/hooks/useChessGame.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: `playMove(args: { from: string; to: string; promotion?: string }): boolean` в возвращаемом объекте `useChessGame`.

- [ ] **Step 1: Написать падающий тест**

Добавить в `app/src/renderer/src/hooks/useChessGame.test.ts` перед закрывающим `})` describe:

```ts
  it('plays a move programmatically', () => {
    const { result } = renderHook(() => useChessGame())

    let accepted = false
    act(() => {
      accepted = result.current.playMove({ from: 'e2', to: 'e4' })
    })

    expect(accepted).toBe(true)
    expect(result.current.position).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    )
  })

  it('plays a promotion move programmatically', () => {
    const { result } = renderHook(() => useChessGame('8/P7/8/8/8/8/8/k6K w - - 0 1'))

    act(() => {
      result.current.playMove({ from: 'a7', to: 'a8', promotion: 'q' })
    })

    expect(result.current.position).toBe('Q7/8/8/8/8/8/8/k6K b - - 0 1')
  })

  it('rejects an illegal programmatic move', () => {
    const { result } = renderHook(() => useChessGame())

    let accepted = true
    act(() => {
      accepted = result.current.playMove({ from: 'e2', to: 'e5' })
    })

    expect(accepted).toBe(false)
  })
```

- [ ] **Step 2: Запустить тест**

Run: `npx vitest run src/renderer/src/hooks/useChessGame.test.ts`
Ожидаемо: FAIL — `playMove is not a function`.

- [ ] **Step 3: Реализовать**

В `app/src/renderer/src/hooks/useChessGame.ts`:

Добавить в тип `UseChessGame`:

```ts
  playMove: (args: { from: string; to: string; promotion?: string }) => boolean
```

Изменить `applyMove`, чтобы принимал превращение:

```ts
  const applyMove = useCallback(
    (sourceSquare: string, targetSquare: string, promotion = 'q'): boolean => {
      try {
        game.move({ from: sourceSquare, to: targetSquare, promotion })
      } catch {
        return false
      }

      setPosition(game.fen())
      setCheckedSquare(kingSquareInCheck(game))
      setStatus(statusOf(game))
      clearSelection()
      return true
    },
    [game, clearSelection]
  )
```

Добавить `playMove` после `onPieceDrop`:

```ts
  const playMove = useCallback(
    ({ from, to, promotion }: { from: string; to: string; promotion?: string }): boolean =>
      applyMove(from, to, promotion),
    [applyMove]
  )
```

Добавить `playMove` в возвращаемый объект:

```ts
    status,
    onPieceDrop,
    onSquareClick,
    playMove
```

- [ ] **Step 4: Запустить тест**

Run: `npx vitest run src/renderer/src/hooks/useChessGame.test.ts`
Ожидаемо: PASS (все тесты хука).

- [ ] **Step 5: Commit**

```bash
git add app/src/renderer/src/hooks/useChessGame.ts app/src/renderer/src/hooks/useChessGame.test.ts
git commit -m "feat: программный ход playMove в useChessGame"
```

---

### Task 6: Хук `useEngineOpponent`

**Files:**
- Create: `app/src/renderer/src/hooks/useEngineOpponent.ts`
- Test: `app/src/renderer/src/hooks/useEngineOpponent.test.ts`

**Interfaces:**
- Consumes: `Engine` (Task 3), `getDefaultEngine` (Task 4), `parseUciMove` (Task 2).
- Produces: `useEngineOpponent(options): { isThinking: boolean }` с
  `options = { enabled: boolean; fen: string; turn: 'w' | 'b' | null; isGameOver: boolean; playMove: (args: { from: string; to: string; promotion?: string }) => boolean; getEngine?: () => Engine }`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/renderer/src/hooks/useEngineOpponent.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEngineOpponent } from './useEngineOpponent'
import { type Engine } from '../engine/stockfish'

const FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'

function createFakeEngine() {
  let resolveMove: (uci: string) => void = () => undefined
  const engine: Engine = {
    setSkillLevel: vi.fn().mockResolvedValue(undefined),
    findBestMove: vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveMove = resolve
        })
    ),
    dispose: vi.fn()
  }

  return { engine, resolveMove: (uci: string) => resolveMove(uci) }
}

function setup(overrides: Partial<Parameters<typeof useEngineOpponent>[0]> = {}) {
  const { engine, resolveMove } = createFakeEngine()
  const playMove = vi.fn().mockReturnValue(true)
  const view = renderHook(() =>
    useEngineOpponent({
      enabled: true,
      fen: FEN,
      turn: 'b',
      isGameOver: false,
      playMove,
      getEngine: () => engine,
      ...overrides
    })
  )

  return { ...view, engine, resolveMove, playMove }
}

describe('useEngineOpponent', () => {
  it('asks the engine for a move and plays it on the black turn', async () => {
    const { result, engine, resolveMove, playMove } = setup()

    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalledWith(FEN))
    expect(result.current.isThinking).toBe(true)

    act(() => {
      resolveMove('e7e5')
    })

    await waitFor(() => expect(playMove).toHaveBeenCalledWith({ from: 'e7', to: 'e5' }))
    await waitFor(() => expect(result.current.isThinking).toBe(false))
  })

  it('parses a promotion move', async () => {
    const { engine, resolveMove, playMove } = setup({ turn: 'b' })

    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalled())
    act(() => {
      resolveMove('a2a1q')
    })

    await waitFor(() =>
      expect(playMove).toHaveBeenCalledWith({ from: 'a2', to: 'a1', promotion: 'q' })
    )
  })

  it('does nothing when disabled', () => {
    const { engine } = setup({ enabled: false })

    expect(engine.findBestMove).not.toHaveBeenCalled()
  })

  it('does nothing on the white turn', () => {
    const { engine } = setup({ turn: 'w' })

    expect(engine.findBestMove).not.toHaveBeenCalled()
  })

  it('does nothing when the game is over', () => {
    const { engine } = setup({ isGameOver: true })

    expect(engine.findBestMove).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Запустить тест**

Run: `npx vitest run src/renderer/src/hooks/useEngineOpponent.test.ts`
Ожидаемо: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать хук**

Создать `app/src/renderer/src/hooks/useEngineOpponent.ts`:

```ts
import { useEffect, useRef, useState } from 'react'
import { getDefaultEngine } from '../engine/defaultEngine'
import { parseUciMove } from '../engine/uciMove'
import { type Engine } from '../engine/stockfish'

type PlayMove = (args: { from: string; to: string; promotion?: string }) => boolean

type UseEngineOpponentOptions = {
  enabled: boolean
  fen: string
  turn: 'w' | 'b' | null
  isGameOver: boolean
  playMove: PlayMove
  getEngine?: () => Engine
}

export function useEngineOpponent({
  enabled,
  fen,
  turn,
  isGameOver,
  playMove,
  getEngine = getDefaultEngine
}: UseEngineOpponentOptions): { isThinking: boolean } {
  const [isThinking, setIsThinking] = useState(false)
  const requestedFenRef = useRef<string | null>(null)
  const latestFenRef = useRef(fen)
  const enabledRef = useRef(enabled)
  latestFenRef.current = fen
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled || isGameOver || turn !== 'b' || requestedFenRef.current === fen) {
      return
    }

    requestedFenRef.current = fen
    setIsThinking(true)

    getEngine()
      .findBestMove(fen)
      .then((uci) => {
        if (!enabledRef.current || latestFenRef.current !== fen) {
          return
        }

        const move = parseUciMove(uci)

        if (move) {
          playMove(move)
        }
      })
      .catch(() => undefined)
      .finally(() => setIsThinking(false))
  }, [enabled, isGameOver, turn, fen, playMove, getEngine])

  return { isThinking }
}
```

- [ ] **Step 4: Запустить тест**

Run: `npx vitest run src/renderer/src/hooks/useEngineOpponent.test.ts`
Ожидаемо: PASS (5 тестов).

- [ ] **Step 5: Commit**

```bash
git add app/src/renderer/src/hooks/useEngineOpponent.ts app/src/renderer/src/hooks/useEngineOpponent.test.ts
git commit -m "feat: хук соперника-бота useEngineOpponent"
```

---

### Task 7: UI — переключатель, статус, CSP

**Files:**
- Modify: `app/src/renderer/src/components/ChessGame.tsx`
- Modify: `app/src/renderer/src/components/ChessGame.test.tsx`
- Modify: `app/src/renderer/src/assets/main.css`
- Modify: `app/src/renderer/index.html`

**Interfaces:**
- Consumes: `playMove` (Task 5), `useEngineOpponent` (Task 6).
- Produces: UI-переключатель `.bot-toggle`, статус «Бот думает…».

- [ ] **Step 1: Написать падающий тест**

Добавить в `app/src/renderer/src/components/ChessGame.test.tsx` перед закрывающим `})`:

```ts
  it('shows a bot toggle that is off by default', () => {
    const { container } = render(<ChessGame />)

    const toggle = container.querySelector('input[type="checkbox"]')

    expect(toggle).toBeInTheDocument()
    expect(toggle).not.toBeChecked()
    expect(container).toHaveTextContent('Играть с ботом')
  })
```

- [ ] **Step 2: Запустить тест**

Run: `npx vitest run src/renderer/src/components/ChessGame.test.tsx`
Ожидаемо: FAIL — чекбокса нет.

- [ ] **Step 3: Реализовать UI**

Заменить содержимое `app/src/renderer/src/components/ChessGame.tsx` на:

```tsx
import { useState, type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import { useChessGame, type GameStatus } from '../hooks/useChessGame'
import { useEngineOpponent } from '../hooks/useEngineOpponent'

function statusText(status: GameStatus): string {
  switch (status.kind) {
    case 'turn':
      return status.turn === 'w' ? 'Ход белых' : 'Ход чёрных'
    case 'check':
      return status.turn === 'w' ? 'Шах белым!' : 'Шах чёрным!'
    case 'checkmate':
      return status.winner === 'w' ? 'Мат! Победа белых' : 'Мат! Победа чёрных'
    case 'stalemate':
      return 'Пат — ничья'
    case 'draw':
      switch (status.reason) {
        case 'insufficient-material':
          return 'Ничья: недостаточно материала'
        case 'threefold-repetition':
          return 'Ничья: троекратное повторение'
        case 'fifty-moves':
          return 'Ничья: правило 50 ходов'
      }
  }
}

const SELECTED_SQUARE_STYLE: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 0, 0.4)'
}

const CHECKED_KING_STYLE: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, transparent 35%, rgba(255, 0, 0, 0.75) 65%, rgba(255, 0, 0, 0.75) 100%)'
}

function moveStyle(isCapture: boolean): CSSProperties {
  return {
    backgroundImage: isCapture
      ? 'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.2) 56%)'
      : 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 22%, transparent 23%)'
  }
}

type ChessGameProps = {
  initialPosition?: string
}

function ChessGame({ initialPosition }: ChessGameProps): React.JSX.Element {
  const {
    position,
    selectedSquare,
    possibleMoves,
    checkedSquare,
    status,
    onPieceDrop,
    onSquareClick,
    playMove
  } = useChessGame(initialPosition)
  const [botEnabled, setBotEnabled] = useState(false)

  const turn = status.kind === 'turn' || status.kind === 'check' ? status.turn : null
  const { isThinking } = useEngineOpponent({
    enabled: botEnabled,
    fen: position,
    turn,
    isGameOver: turn === null,
    playMove
  })

  const squareStyles: Record<string, CSSProperties> = {}
  if (selectedSquare) {
    squareStyles[selectedSquare] = SELECTED_SQUARE_STYLE
  }
  for (const move of possibleMoves) {
    squareStyles[move.square] = moveStyle(move.isCapture)
  }
  if (checkedSquare) {
    squareStyles[checkedSquare] = CHECKED_KING_STYLE
  }

  return (
    <div className="chess-game">
      <div className="board">
        <Chessboard options={{ position, onPieceDrop, onSquareClick, squareStyles }} />
      </div>
      <div className="controls">
        <label className="bot-toggle">
          <input
            type="checkbox"
            checked={botEnabled}
            onChange={(event) => setBotEnabled(event.target.checked)}
          />
          Играть с ботом
        </label>
      </div>
      <div className="status-bar">{isThinking ? 'Бот думает…' : statusText(status)}</div>
    </div>
  )
}

export default ChessGame
```

- [ ] **Step 4: Добавить стили**

В `app/src/renderer/src/assets/main.css` перед правилом `.status-bar` добавить:

```css
.controls {
  display: flex;
  justify-content: center;
  padding-bottom: 8px;
}

.bot-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ev-c-text-1);
  font-size: 14px;
  cursor: pointer;
}
```

- [ ] **Step 5: Разрешить WebAssembly в CSP**

В `app/src/renderer/index.html` заменить строку CSP на:

```html
      content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
```

- [ ] **Step 6: Запустить тесты и проверки**

Run: `npm test`
Ожидаемо: PASS (все тесты, включая новый про переключатель).

Run: `npm run lint && npm run typecheck`
Ожидаемо: без ошибок.

- [ ] **Step 7: Commit**

```bash
git add app/src/renderer/src/components/ChessGame.tsx app/src/renderer/src/components/ChessGame.test.tsx app/src/renderer/src/assets/main.css app/src/renderer/index.html
git commit -m "feat: переключатель бота и статус в интерфейсе"
```

---

### Task 8: Проверка с настоящим движком в браузере

**Files:**
- Modify (при необходимости): `app/src/renderer/src/engine/defaultEngine.ts`

**Interfaces:**
- Consumes: всё предыдущее.
- Produces: подтверждение, что реальный Stockfish отвечает ходом.

- [ ] **Step 1: Запустить renderer в браузере**

```bash
nohup npx vite src/renderer --port 5199 --strictPort > /tmp/opencode/vite.log 2>&1 &
sleep 3
tail -3 /tmp/opencode/vite.log
```

Ожидаемо: сервер слушает `http://localhost:5199/`.

- [ ] **Step 2: Проверить в браузере (playwright или вручную)**

Открыть `http://localhost:5199/`, включить «Играть с ботом», сделать ход белыми (например, e2→e4). Убедиться:
- статус кратко показывает «Бот думает…»;
- затем бот делает ответный ход чёрными;
- в консоли нет ошибок загрузки Worker/wasm.

Ожидаемо: бот ответил. Если Worker/wasm не грузится — проверить CSP (`'wasm-unsafe-eval'`), относительный URL и путь файлов; при необходимости поправить `ENGINE_URL` в `defaultEngine.ts`.

- [ ] **Step 3: Остановить сервер и убрать артефакты**

```bash
pkill -9 -f "[v]ite src/renderer"
rm -rf .playwright-mcp
ss -ltnp 2>/dev/null | grep 5199 || echo "port free"
```

- [ ] **Step 4: Финальные проверки**

Run: `npm test && npm run lint && npm run typecheck`
Ожидаемо: всё зелёное.

- [ ] **Step 5: Commit (если были правки)**

```bash
git add -A
git commit -m "fix: скорректировать загрузку движка" || echo "нечего коммитить"
```

---

## Self-Review

**Spec coverage:**
- Вендоринг + sha256 + GPLv3 → Task 1. ✓
- Адаптер UCI (`setSkillLevel`/`findBestMove`/`dispose`) → Task 3. ✓
- Worker-транспорт → Task 4. ✓
- `playMove` → Task 5. ✓
- `useEngineOpponent` (включён + ход чёрных + игра не окончена) → Task 6. ✓
- Переключатель + статус «Бот думает…» → Task 7. ✓
- CSP `'wasm-unsafe-eval'` → Task 7 Step 5. ✓
- Разбор UCI → Task 2. ✓
- Проверка с реальным движком + риск `file://` → Task 8. ✓
- Отклонение от спеки: движок — сессионный синглтон без `dispose` при размонтировании (Task 4/6). Причина: StrictMode-двойной эффект в dev иначе уничтожал бы движок до ответа. `dispose` в адаптере остаётся и покрыт тестом.

**Placeholder scan:** в плане есть `<SHA256>` только как значение, вычисляемое в Task 1 Step 2–3 (не код-плейсхолдер). Прочих TBD/TODO нет.

**Type consistency:** `Engine` (Task 3) используется в Task 4/6 без изменений; `playMove` (Task 5) совпадает по сигнатуре с `PlayMove` (Task 6) и вызовом в Task 7; `UciMove` (Task 2) → `parseUciMove` (Task 6). Имена совпадают.
