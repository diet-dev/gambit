# Управление доской с телефона — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Приложение поднимает локальный веб-сервер и отдаёт страницу с доской, которая зеркалит позицию приложения и позволяет делать ходы с телефона.

**Architecture:** Состояние игры остаётся в renderer (`useChessGame`). `main` держит HTTP+WS сервер и IPC-мост: позиция идёт renderer→main→клиенты, ход клиента идёт main→renderer и применяется через `chess.js`. Удалённая страница — второй renderer-entry (React + `react-chessboard` + `chess.js`) с локальным зеркалом.

**Tech Stack:** Electron, React 19, TypeScript, `chess.js`, `react-chessboard`, `ws`, `qrcode`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-remote-board-design.md`

## Global Constraints

- Порт по умолчанию `3210`, при занятости — следующий свободный в диапазоне `3210–3219`.
- Слушать `0.0.0.0`; аутентификации нет (осознанный выбор).
- Превращение — только в ферзя (`promotion: 'q'`).
- Правила шахмат — только `chess.js`; в `main` правил нет (ADR 0001, ADR 0002).
- Тесты `main` — в окружении `node`; тесты renderer — `jsdom` с текущим `setup.ts`.
- Команды запускать из `app/`: `npm test`, `npm run lint`, `npm run typecheck`.
- Сообщения коммитов — русские, в стиле репозитория (`feat:`, `fix:`, `test:`, `chore:`).
- В компонентах не добавлять комментарии в код.

---

## Структура файлов

- `app/src/shared/remote.ts` — общие типы `RemoteMove`, `ServerInfo`, `RemoteApi`.
- `app/src/main/staticServer.ts` — HTTP-сервер статики + dev-прокси.
- `app/src/main/remoteServer.ts` — HTTP + WebSocket, рассылка позиции, приём ходов.
- `app/src/main/lan.ts` — выбор LAN-адреса.
- `app/src/main/remoteIpc.ts` — регистрация IPC-обработчиков.
- `app/src/main/index.ts` — запуск сервера, QR, порядок инициализации.
- `app/src/preload/index.ts`, `app/src/preload/index.d.ts` — `window.api.remote`.
- `app/src/renderer/src/hooks/useRemoteBridge.ts` — мост renderer↔main.
- `app/src/renderer/src/components/ChessGame.tsx` — подключает мост.
- `app/src/renderer/src/components/Dialog.tsx` — общий диалог (оверлей, крестик, Esc).
- `app/src/renderer/src/components/SituationCommentDialog.tsx` — переводится на `Dialog`.
- `app/src/renderer/src/components/RemoteQrButton.tsx` — иконка QR и модалка.
- `app/src/renderer/src/App.tsx` — размещает кнопку.
- `app/src/renderer/src/remote/useRemoteSocket.ts` — WS-логика удалённой доски.
- `app/src/renderer/src/remote/RemoteBoard.tsx` — компонент доски.
- `app/src/renderer/remote.html`, `app/src/renderer/src/remote/main.tsx` — entry страницы.
- `app/src/renderer/src/assets/main.css` — стили.
- `app/electron.vite.config.ts`, `app/vitest.config.ts`, `app/tsconfig.*.json` — конфиги.

---

### Task 1: HTTP-сервер статики (main, node)

**Files:**
- Create: `app/src/main/staticServer.ts`
- Test: `app/src/main/staticServer.test.ts`
- Modify: `app/vitest.config.ts`
- Modify: `app/package.json` (deps)

**Interfaces:**
- Consumes: ничего.
- Produces: `startStaticServer(options: { staticDir: string; devServerUrl?: string; preferredPort?: number }): Promise<StaticServer>`, где `StaticServer = { port: number; server: import('http').Server; close: () => Promise<void> }`.

- [ ] **Step 1: Установить зависимости**

Run:
```bash
cd app && npm install ws && npm install -D @types/ws
```

- [ ] **Step 2: Перевести vitest на проекты**

Заменить содержимое `app/vitest.config.ts`:
```ts
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: {
          alias: {
            '@renderer': resolve('src/renderer/src')
          }
        },
        test: {
          name: 'renderer',
          environment: 'jsdom',
          setupFiles: ['./src/renderer/src/test/setup.ts'],
          include: ['src/renderer/src/**/*.{test,spec}.{ts,tsx}']
        }
      },
      {
        test: {
          name: 'main',
          environment: 'node',
          include: ['src/main/**/*.test.ts']
        }
      }
    ]
  }
})
```

- [ ] **Step 3: Написать падающий тест**

Создать `app/src/main/staticServer.test.ts`:
```ts
import { mkdtemp, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { createServer } from 'http'
import { afterEach, describe, expect, it } from 'vitest'
import { startStaticServer, type StaticServer } from './staticServer'

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const response = await fetch(url)
  return { status: response.status, body: await response.text() }
}

describe('startStaticServer', () => {
  let running: StaticServer | null = null

  afterEach(async () => {
    await running?.close()
    running = null
  })

  it('serves remote.html at the root', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gambit-static-'))
    await writeFile(join(dir, 'remote.html'), '<!doctype html><title>remote</title>')

    running = await startStaticServer({ staticDir: dir, preferredPort: 0 })
    const { status, body } = await fetchText(`http://127.0.0.1:${running.port}/`)

    expect(status).toBe(200)
    expect(body).toContain('remote')
  })

  it('blocks path traversal', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gambit-static-'))
    const secret = join(dir, '..', 'gambit-secret.txt')
    await writeFile(secret, 'secret')
    running = await startStaticServer({ staticDir: dir, preferredPort: 0 })

    const { status, body } = await fetchText(`http://127.0.0.1:${running.port}/..%2fgambit-secret.txt`)

    expect(status).toBe(404)
    expect(body).not.toContain('secret')
  })

  it('proxies to the dev server when configured', async () => {
    const devServer = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end('<title>dev-remote</title>')
    })
    await new Promise<void>((resolve) => devServer.listen(0, '127.0.0.1', resolve))
    const devPort = (devServer.address() as { port: number }).port

    running = await startStaticServer({
      staticDir: '/nonexistent',
      devServerUrl: `http://127.0.0.1:${devPort}`,
      preferredPort: 0
    })
    const { status, body } = await fetchText(`http://127.0.0.1:${running.port}/`)

    expect(status).toBe(200)
    expect(body).toContain('dev-remote')

    await new Promise<void>((resolve) => devServer.close(() => resolve()))
  })
})
```

- [ ] **Step 4: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/main/staticServer.test.ts`
Expected: FAIL — модуль `./staticServer` не найден.

- [ ] **Step 5: Реализовать `staticServer.ts`**

Создать `app/src/main/staticServer.ts`:
```ts
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http'
import { readFile } from 'fs/promises'
import { extname, join, normalize } from 'path'
import type { AddressInfo } from 'net'

export type StaticServer = {
  port: number
  server: Server
  close: () => Promise<void>
}

export type StaticServerOptions = {
  staticDir: string
  devServerUrl?: string
  preferredPort?: number
}

const DEFAULT_PORT = 3210
const PORT_ATTEMPTS = 10

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8'
}

function listenOn(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    function onError(error: Error): void {
      server.off('listening', onListening)
      reject(error)
    }
    function onListening(): void {
      server.off('error', onError)
      resolve((server.address() as AddressInfo).port)
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, '0.0.0.0')
  })
}

async function serveStaticFile(
  staticDir: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const urlPath = decodeURIComponent((request.url ?? '/').split('?')[0])
  const relative = urlPath === '/' ? 'remote.html' : urlPath.replace(/^\/+/, '')
  const filePath = normalize(join(staticDir, relative))

  if (filePath !== staticDir && !filePath.startsWith(staticDir + '/')) {
    response.writeHead(404)
    response.end()
    return
  }

  try {
    const content = await readFile(filePath)
    response.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream'
    })
    response.end(content)
  } catch {
    response.writeHead(404)
    response.end()
  }
}

async function proxyToDevServer(
  devServerUrl: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const target = `${devServerUrl}${request.url === '/' ? '/remote.html' : request.url}`
  const proxied = await fetch(target)
  response.writeHead(proxied.status, {
    'content-type': proxied.headers.get('content-type') ?? 'application/octet-stream'
  })
  response.end(Buffer.from(await proxied.arrayBuffer()))
}

export async function startStaticServer(options: StaticServerOptions): Promise<StaticServer> {
  const server = createServer((request, response) => {
    const handle = options.devServerUrl
      ? proxyToDevServer(options.devServerUrl, request, response)
      : serveStaticFile(options.staticDir, request, response)
    handle.catch(() => {
      response.writeHead(500)
      response.end()
    })
  })

  const preferred = options.preferredPort ?? DEFAULT_PORT
  const ports = preferred === 0 ? [0] : Array.from({ length: PORT_ATTEMPTS }, (_, i) => preferred + i)

  let port = -1
  for (const candidate of ports) {
    try {
      port = await listenOn(server, candidate)
      break
    } catch {
      continue
    }
  }

  if (port === -1) {
    throw new Error('Не удалось найти свободный порт для веб-сервера')
  }

  return {
    port,
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections()
        server.close((error) => (error ? reject(error) : resolve()))
      })
  }
}
```

- [ ] **Step 6: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/main/staticServer.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 7: Полный прогон и коммит**

Run: `cd app && npm test -- --run && npm run lint && npm run typecheck`
Expected: все зелёные.
```bash
git add app/src/main/staticServer.ts app/src/main/staticServer.test.ts app/vitest.config.ts app/package.json app/package-lock.json
git commit -m "feat: HTTP-сервер статики для удалённой доски"
```

---

### Task 2: WebSocket-слой (main, node)

**Files:**
- Create: `app/src/main/remoteServer.ts`
- Test: `app/src/main/remoteServer.test.ts`

**Interfaces:**
- Consumes: `startStaticServer` из Task 1.
- Produces: `createRemoteServer(options: { staticDir: string; devServerUrl?: string; preferredPort?: number; onMove: (move: RemoteMove) => void }): Promise<RemoteServer>`, где `RemoteServer = { port: number; setPosition: (fen: string) => void; close: () => Promise<void> }`; тип `RemoteMove` из `../shared/remote`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/main/remoteServer.test.ts`:
```ts
import { mkdtemp, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { WebSocket } from 'ws'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRemoteServer, type RemoteServer } from './remoteServer'
import type { RemoteMove } from '../shared/remote'

function nextMessage(socket: WebSocket): Promise<{ type: string; fen?: string }> {
  return new Promise((resolve) => {
    socket.once('message', (data) => resolve(JSON.parse(data.toString())))
  })
}

describe('createRemoteServer', () => {
  let running: RemoteServer | null = null

  afterEach(async () => {
    await running?.close()
    running = null
  })

  async function start(onMove: (move: RemoteMove) => void = () => {}): Promise<RemoteServer> {
    const dir = await mkdtemp(join(tmpdir(), 'gambit-remote-'))
    await writeFile(join(dir, 'remote.html'), '<!doctype html><title>remote</title>')
    running = await createRemoteServer({ staticDir: dir, preferredPort: 0, onMove })
    return running
  }

  it('sends the last position to a new client', async () => {
    const server = await start()
    server.setPosition('8/8/8/8/8/8/8/K6k w - - 0 1')

    const socket = new WebSocket(`ws://127.0.0.1:${server.port}/ws`)
    const message = await nextMessage(socket)

    expect(message).toEqual({ type: 'position', fen: '8/8/8/8/8/8/8/K6k w - - 0 1' })
    socket.close()
  })

  it('broadcasts every position change', async () => {
    const server = await start()
    const socket = new WebSocket(`ws://127.0.0.1:${server.port}/ws`)
    await nextMessage(socket)

    const received = nextMessage(socket)
    server.setPosition('8/8/8/8/8/8/8/K6k b - - 0 1')

    expect(await received).toEqual({ type: 'position', fen: '8/8/8/8/8/8/8/K6k b - - 0 1' })
    socket.close()
  })

  it('forwards client moves to onMove', async () => {
    const onMove = vi.fn()
    const server = await start(onMove)
    const socket = new WebSocket(`ws://127.0.0.1:${server.port}/ws`)
    await nextMessage(socket)

    socket.send(JSON.stringify({ type: 'move', from: 'e2', to: 'e4', promotion: 'q' }))
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(onMove).toHaveBeenCalledWith({ from: 'e2', to: 'e4', promotion: 'q' })
    socket.close()
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/main/remoteServer.test.ts`
Expected: FAIL — модуль `./remoteServer` не найден.

- [ ] **Step 3: Реализовать `remoteServer.ts`**

Создать `app/src/main/remoteServer.ts`:
```ts
import { WebSocketServer, WebSocket } from 'ws'
import { startStaticServer } from './staticServer'
import type { RemoteMove } from '../shared/remote'

export type RemoteServer = {
  port: number
  setPosition: (fen: string) => void
  close: () => Promise<void>
}

export type RemoteServerOptions = {
  staticDir: string
  devServerUrl?: string
  preferredPort?: number
  onMove: (move: RemoteMove) => void
}

export async function createRemoteServer(options: RemoteServerOptions): Promise<RemoteServer> {
  const staticServer = await startStaticServer({
    staticDir: options.staticDir,
    devServerUrl: options.devServerUrl,
    preferredPort: options.preferredPort
  })

  const wss = new WebSocketServer({ server: staticServer.server, path: '/ws' })
  let lastPosition = ''

  function broadcast(fen: string): void {
    const message = JSON.stringify({ type: 'position', fen })
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    }
  }

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'position', fen: lastPosition }))
    socket.on('message', (data) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(data.toString())
      } catch {
        return
      }
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        (parsed as { type?: string }).type === 'move'
      ) {
        const move = parsed as { from?: unknown; to?: unknown; promotion?: unknown }
        if (typeof move.from === 'string' && typeof move.to === 'string') {
          options.onMove({
            from: move.from,
            to: move.to,
            promotion: typeof move.promotion === 'string' ? move.promotion : undefined
          })
        }
      }
    })
  })

  return {
    port: staticServer.port,
    setPosition: (fen) => {
      lastPosition = fen
      broadcast(fen)
    },
    close: () =>
      new Promise<void>((resolve) => {
        for (const client of wss.clients) {
          client.terminate()
        }
        wss.close(() => {
          staticServer.close().then(resolve)
        })
      })
  }
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/main/remoteServer.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: Коммит**

Run: `cd app && npm test -- --run && npm run lint && npm run typecheck`
```bash
git add app/src/main/remoteServer.ts app/src/main/remoteServer.test.ts
git commit -m "feat: WebSocket-рассылка позиции и приём ходов"
```

---

### Task 3: Общие типы, LAN-адрес, tsconfig

**Files:**
- Create: `app/src/shared/remote.ts`
- Create: `app/src/main/lan.ts`
- Test: `app/src/main/lan.test.ts`
- Modify: `app/tsconfig.node.json`, `app/tsconfig.web.json`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `RemoteMove = { from: string; to: string; promotion?: string }`
  - `ServerInfo = { url: string; port: number; qrDataUrl: string }`
  - `RemoteApi = { publishPosition: (fen: string) => void; onRemoteMove: (callback: (move: RemoteMove) => void) => () => void; getServerInfo: () => Promise<ServerInfo | null> }`
  - `getLanAddress(interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>): string`

- [ ] **Step 1: Добавить `src/shared` в tsconfig**

В `app/tsconfig.node.json` массив `include` привести к виду:
```json
"include": ["electron.vite.config.*", "src/main/**/*", "src/preload/**/*", "src/shared/**/*"]
```
В `app/tsconfig.web.json` массив `include` привести к виду:
```json
"include": [
  "src/renderer/src/env.d.ts",
  "src/renderer/src/**/*",
  "src/renderer/src/**/*.tsx",
  "src/preload/*.d.ts",
  "src/shared/**/*"
]
```

- [ ] **Step 2: Создать общие типы**

Создать `app/src/shared/remote.ts`:
```ts
export type RemoteMove = {
  from: string
  to: string
  promotion?: string
}

export type ServerInfo = {
  url: string
  port: number
  qrDataUrl: string
}

export type RemoteApi = {
  publishPosition: (fen: string) => void
  onRemoteMove: (callback: (move: RemoteMove) => void) => () => void
  getServerInfo: () => Promise<ServerInfo | null>
}
```

- [ ] **Step 3: Написать падающий тест `lan`**

Создать `app/src/main/lan.test.ts`:
```ts
import type { NetworkInterfaceInfo } from 'os'
import { describe, expect, it } from 'vitest'
import { getLanAddress } from './lan'

function ipv4(address: string, internal: boolean): NetworkInterfaceInfo {
  return {
    address,
    netmask: '255.255.255.0',
    family: 'IPv4',
    mac: '00:00:00:00:00:00',
    internal,
    cidr: `${address}/24`
  }
}

describe('getLanAddress', () => {
  it('returns the first non-internal IPv4 address', () => {
    const result = getLanAddress({
      lo: [ipv4('127.0.0.1', true)],
      eth0: [ipv4('192.168.1.42', false)]
    })

    expect(result).toBe('192.168.1.42')
  })

  it('falls back to localhost', () => {
    const result = getLanAddress({ lo: [ipv4('127.0.0.1', true)] })

    expect(result).toBe('localhost')
  })
})
```

- [ ] **Step 4: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/main/lan.test.ts`
Expected: FAIL — модуль `./lan` не найден.

- [ ] **Step 5: Реализовать `lan.ts`**

Создать `app/src/main/lan.ts`:
```ts
import type { NetworkInterfaceInfo } from 'os'

export function getLanAddress(interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>): string {
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address
      }
    }
  }
  return 'localhost'
}
```

- [ ] **Step 6: Запустить тесты и typecheck**

Run: `cd app && npm test -- --run src/main/lan.test.ts && npm run typecheck`
Expected: PASS (2 теста), typecheck зелёный.

- [ ] **Step 7: Коммит**

```bash
git add app/src/shared/remote.ts app/src/main/lan.ts app/src/main/lan.test.ts app/tsconfig.node.json app/tsconfig.web.json
git commit -m "feat: общие типы удалённого управления и выбор LAN-адреса"
```

---

### Task 4: Мост в preload

**Files:**
- Modify: `app/src/preload/index.ts`
- Modify: `app/src/preload/index.d.ts`

**Interfaces:**
- Consumes: `RemoteApi`, `RemoteMove`, `ServerInfo` из `../shared/remote`.
- Produces: `window.api.remote: RemoteApi`.

- [ ] **Step 1: Реализовать API в preload**

Заменить содержимое `app/src/preload/index.ts`:
```ts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { RemoteApi, RemoteMove, ServerInfo } from '../shared/remote'

const remote: RemoteApi = {
  publishPosition: (fen) => ipcRenderer.send('remote:position', fen),
  onRemoteMove: (callback) => {
    const listener = (_event: IpcRendererEvent, move: RemoteMove): void => callback(move)
    ipcRenderer.on('remote:move', listener)
    return () => ipcRenderer.removeListener('remote:move', listener)
  },
  getServerInfo: () => ipcRenderer.invoke('remote:server-info') as Promise<ServerInfo | null>
}

const api = { remote }

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
```

- [ ] **Step 2: Типизировать `window.api`**

Заменить содержимое `app/src/preload/index.d.ts`:
```ts
import { ElectronAPI } from '@electron-toolkit/preload'
import type { RemoteApi } from '../shared/remote'

declare global {
  interface Window {
    electron: ElectronAPI
    api: { remote: RemoteApi }
  }
}
```

- [ ] **Step 3: Проверить типы**

Run: `cd app && npm run typecheck && npm run lint`
Expected: зелёные.

- [ ] **Step 4: Коммит**

```bash
git add app/src/preload/index.ts app/src/preload/index.d.ts
git commit -m "feat: preload-мост удалённого управления"
```

---

### Task 5: Хук `useRemoteBridge` и подключение в `ChessGame`

**Files:**
- Create: `app/src/renderer/src/hooks/useRemoteBridge.ts`
- Test: `app/src/renderer/src/hooks/useRemoteBridge.test.ts`
- Modify: `app/src/renderer/src/components/ChessGame.tsx`

**Interfaces:**
- Consumes: `window.api.remote` из Task 4; `RemoteMove`.
- Produces: `useRemoteBridge(options: { position: string; playMove: (move: RemoteMove) => boolean }): void`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/renderer/src/hooks/useRemoteBridge.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRemoteBridge } from './useRemoteBridge'
import type { RemoteApi, RemoteMove } from '../../../shared/remote'

function installApi(overrides: Partial<RemoteApi> = {}): RemoteApi {
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => null),
    ...overrides
  }
  window.api = { remote }
  return remote
}

describe('useRemoteBridge', () => {
  it('publishes the position on mount and on change', () => {
    const remote = installApi()
    const playMove = vi.fn(() => true)

    const { rerender } = renderHook(
      ({ position }) => useRemoteBridge({ position, playMove }),
      { initialProps: { position: 'fen-a' } }
    )
    rerender({ position: 'fen-b' })

    expect(remote.publishPosition).toHaveBeenNthCalledWith(1, 'fen-a')
    expect(remote.publishPosition).toHaveBeenNthCalledWith(2, 'fen-b')
  })

  it('applies remote moves through playMove', () => {
    let handler: ((move: RemoteMove) => void) | null = null
    installApi({
      onRemoteMove: (callback) => {
        handler = callback
        return () => {}
      }
    })
    const playMove = vi.fn(() => true)

    renderHook(() => useRemoteBridge({ position: 'fen-a', playMove }))
    handler!({ from: 'e2', to: 'e4' })

    expect(playMove).toHaveBeenCalledWith({ from: 'e2', to: 'e4' })
  })

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn()
    installApi({ onRemoteMove: vi.fn(() => unsubscribe) })
    const playMove = vi.fn(() => true)

    const { unmount } = renderHook(() => useRemoteBridge({ position: 'fen-a', playMove }))
    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/renderer/src/hooks/useRemoteBridge.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать хук**

Создать `app/src/renderer/src/hooks/useRemoteBridge.ts`:
```ts
import { useEffect } from 'react'
import type { RemoteMove } from '../../../shared/remote'

type UseRemoteBridgeOptions = {
  position: string
  playMove: (move: RemoteMove) => boolean
}

export function useRemoteBridge({ position, playMove }: UseRemoteBridgeOptions): void {
  useEffect(() => {
    window.api?.remote?.publishPosition(position)
  }, [position])

  useEffect(() => {
    const api = window.api?.remote
    if (!api) {
      return
    }
    return api.onRemoteMove((move) => {
      playMove(move)
    })
  }, [playMove])
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/renderer/src/hooks/useRemoteBridge.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: Подключить хук в `ChessGame`**

В `app/src/renderer/src/components/ChessGame.tsx` добавить импорт:
```tsx
import { useRemoteBridge } from '../hooks/useRemoteBridge'
```
После вычисления `turn` и вызова `useEngineOpponent` (перед `const squareStyles`) добавить:
```tsx
useRemoteBridge({ position, playMove })
```

- [ ] **Step 6: Прогнать тесты и коммит**

Run: `cd app && npm test -- --run && npm run lint && npm run typecheck`
Expected: все зелёные.
```bash
git add app/src/renderer/src/hooks/useRemoteBridge.ts app/src/renderer/src/hooks/useRemoteBridge.test.ts app/src/renderer/src/components/ChessGame.tsx
git commit -m "feat: мост позиции и удалённых ходов в ChessGame"
```

---

### Task 6: Общий `Dialog` и перевод на него `SituationCommentDialog`

**Files:**
- Create: `app/src/renderer/src/components/Dialog.tsx`
- Test: `app/src/renderer/src/components/Dialog.test.tsx`
- Modify: `app/src/renderer/src/components/SituationCommentDialog.tsx`

**Interfaces:**
- Consumes: `lucide-react` `X`.
- Produces: `Dialog(props: { titleId: string; onClose: () => void; children: React.ReactNode }): React.JSX.Element`; оверлей `.dialog-overlay`, панель `.comment-dialog`, крестик `.comment-dialog-close` с `aria-label="Закрыть"`, закрытие по `Esc`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/renderer/src/components/Dialog.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import Dialog from './Dialog'

describe('Dialog', () => {
  it('renders children in a modal dialog', () => {
    const { getByRole, getByText } = render(
      <Dialog titleId="test-title" onClose={() => {}}>
        <h2 id="test-title">Заголовок</h2>
        <p>Содержимое</p>
      </Dialog>
    )

    expect(getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(getByText('Содержимое')).toBeInTheDocument()
  })

  it('closes on the close button and on Escape', () => {
    const onClose = vi.fn()
    const { getByRole } = render(
      <Dialog titleId="test-title" onClose={onClose}>
        <h2 id="test-title">Заголовок</h2>
      </Dialog>
    )

    fireEvent.click(getByRole('button', { name: 'Закрыть' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/renderer/src/components/Dialog.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать `Dialog.tsx`**

Создать `app/src/renderer/src/components/Dialog.tsx`:
```tsx
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

type DialogProps = {
  titleId: string
  onClose: () => void
  children: React.ReactNode
}

function Dialog({ titleId, onClose, children }: DialogProps): React.JSX.Element {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="dialog-overlay">
      <div className="comment-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button
          ref={closeButtonRef}
          type="button"
          className="comment-dialog-close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={32} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  )
}

export default Dialog
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/renderer/src/components/Dialog.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Перевести `SituationCommentDialog` на `Dialog`**

Заменить содержимое `app/src/renderer/src/components/SituationCommentDialog.tsx`:
```tsx
import { type Situation } from '../situations'
import Dialog from './Dialog'

type SituationCommentDialogProps = {
  situation: Situation
  onClose: () => void
}

function SituationCommentDialog({
  situation,
  onClose
}: SituationCommentDialogProps): React.JSX.Element {
  return (
    <Dialog titleId="comment-dialog-title" onClose={onClose}>
      <h2 id="comment-dialog-title" className="comment-dialog-title">
        {situation.title}
      </h2>
      <p className="comment-dialog-text">{situation.comment}</p>
    </Dialog>
  )
}

export default SituationCommentDialog
```

- [ ] **Step 6: Убедиться, что старые тесты диалога проходят**

Run: `cd app && npm test -- --run src/renderer/src/components/SituationCommentDialog.test.tsx`
Expected: PASS (3 теста, без изменений в тесте).

- [ ] **Step 7: Коммит**

Run: `cd app && npm test -- --run && npm run lint && npm run typecheck`
```bash
git add app/src/renderer/src/components/Dialog.tsx app/src/renderer/src/components/Dialog.test.tsx app/src/renderer/src/components/SituationCommentDialog.tsx
git commit -m "refactor: общий компонент Dialog"
```

---

### Task 7: Кнопка QR и модалка с адресом

**Files:**
- Create: `app/src/renderer/src/components/RemoteQrButton.tsx`
- Test: `app/src/renderer/src/components/RemoteQrButton.test.tsx`
- Modify: `app/src/renderer/src/App.tsx`
- Modify: `app/src/renderer/src/assets/main.css`

**Interfaces:**
- Consumes: `Dialog` из Task 6; `window.api.remote.getServerInfo()` и `ServerInfo` из Task 3/4.
- Produces: компонент `RemoteQrButton` без пропсов; кнопка `.remote-qr-button` с `aria-label="Показать QR-код для телефона"`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/renderer/src/components/RemoteQrButton.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import RemoteQrButton from './RemoteQrButton'
import type { RemoteApi, ServerInfo } from '../../../shared/remote'

const info: ServerInfo = {
  url: 'http://192.168.1.42:3210/',
  port: 3210,
  qrDataUrl: 'data:image/png;base64,AAAA'
}

function installApi(serverInfo: ServerInfo | null): RemoteApi {
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => serverInfo)
  }
  window.api = { remote }
  return remote
}

describe('RemoteQrButton', () => {
  it('is disabled until the address is available', async () => {
    installApi(null)
    const { getByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeDisabled())
  })

  it('opens a dialog with the QR code and address', async () => {
    installApi(info)
    const { getByRole, findByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))

    const dialog = await findByRole('dialog')
    expect(dialog).toHaveTextContent('http://192.168.1.42:3210/')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(info.qrDataUrl)
  })

  it('closes on Escape', async () => {
    installApi(info)
    const { getByRole, findByRole, queryByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))
    await findByRole('dialog')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/renderer/src/components/RemoteQrButton.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать `RemoteQrButton.tsx`**

Создать `app/src/renderer/src/components/RemoteQrButton.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { QrCode } from 'lucide-react'
import type { ServerInfo } from '../../../shared/remote'
import Dialog from './Dialog'

function RemoteQrButton(): React.JSX.Element {
  const [info, setInfo] = useState<ServerInfo | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    window.api?.remote?.getServerInfo().then((value) => {
      if (active) {
        setInfo(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <button
        type="button"
        className="remote-qr-button"
        aria-label="Показать QR-код для телефона"
        disabled={!info}
        onClick={() => setOpen(true)}
      >
        <QrCode size={22} aria-hidden="true" />
      </button>
      {open && info && (
        <Dialog titleId="remote-qr-title" onClose={() => setOpen(false)}>
          <h2 id="remote-qr-title" className="comment-dialog-title">
            Управление с телефона
          </h2>
          <img
            className="remote-qr-image"
            src={info.qrDataUrl}
            alt={`QR-код для адреса ${info.url}`}
          />
          <p className="remote-qr-url">{info.url}</p>
        </Dialog>
      )}
    </>
  )
}

export default RemoteQrButton
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/renderer/src/components/RemoteQrButton.test.tsx`
Expected: PASS (3 теста).

- [ ] **Step 5: Разместить кнопку в `App.tsx`**

В `app/src/renderer/src/App.tsx` добавить импорт:
```tsx
import RemoteQrButton from './components/RemoteQrButton'
```
В правой панели, после `<ChessGame ... />`, добавить:
```tsx
<RemoteQrButton />
```
Итоговый блок правой панели:
```tsx
<Panel id="right" className="panel" minSize="30%">
  <div className="right-panel">
    <ChessGame key={`${selected.id}:${instance}`} initialPosition={selected.fen} />
    <RemoteQrButton />
  </div>
</Panel>
```

- [ ] **Step 6: Добавить стили**

В `app/src/renderer/src/assets/main.css` в правило `.right-panel` добавить `position: relative;`. Ниже `.status-bar-checkmate` добавить:
```css
.remote-qr-button {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: none;
  border-radius: 50%;
  background: var(--ev-c-gray-3);
  color: var(--ev-c-text-1);
  cursor: pointer;
}

.remote-qr-button:hover:not(:disabled) {
  background: var(--ev-c-gray-2);
}

.remote-qr-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.remote-qr-image {
  display: block;
  width: 280px;
  height: 280px;
  margin: 0 auto 16px;
  background: #ffffff;
  border-radius: 8px;
}

.remote-qr-url {
  font-size: 22px;
  text-align: center;
  word-break: break-all;
}
```

- [ ] **Step 7: Прогнать тесты и коммит**

Run: `cd app && npm test -- --run && npm run lint && npm run typecheck`
Expected: все зелёные.
```bash
git add app/src/renderer/src/components/RemoteQrButton.tsx app/src/renderer/src/components/RemoteQrButton.test.tsx app/src/renderer/src/App.tsx app/src/renderer/src/assets/main.css
git commit -m "feat: кнопка QR с адресом веб-доски"
```

---

### Task 8: Хук `useRemoteSocket` удалённой доски

**Files:**
- Create: `app/src/renderer/src/remote/useRemoteSocket.ts`
- Test: `app/src/renderer/src/remote/useRemoteSocket.test.ts`

**Interfaces:**
- Consumes: `chess.js`.
- Produces: `useRemoteSocket(): { position: string; onPieceDrop: (args: { sourceSquare: string; targetSquare: string | null }) => boolean }`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/renderer/src/remote/useRemoteSocket.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useRemoteSocket } from './useRemoteSocket'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  sent: string[] = []
  closed = false

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.closed = true
  }
}

function lastSocket(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
}

describe('useRemoteSocket', () => {
  afterEach(() => {
    FakeWebSocket.instances = []
    vi.unstubAllGlobals()
  })

  it('starts from the initial position and follows server updates', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { result } = renderHook(() => useRemoteSocket())

    act(() => {
      lastSocket().onmessage?.({ data: JSON.stringify({ type: 'position', fen: '8/8/8/8/8/8/8/K6k b - - 0 1' }) })
    })

    expect(result.current.position).toBe('8/8/8/8/8/8/8/K6k b - - 0 1')
  })

  it('applies a legal drop locally and sends it to the server', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { result } = renderHook(() => useRemoteSocket())

    act(() => {
      lastSocket().onmessage?.({ data: JSON.stringify({ type: 'position', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }) })
    })

    let accepted = false
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' })
    })

    expect(accepted).toBe(true)
    expect(lastSocket().sent[0]).toBe(JSON.stringify({ type: 'move', from: 'e2', to: 'e4', promotion: 'q' }))
  })

  it('rejects an illegal drop', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { result } = renderHook(() => useRemoteSocket())

    let accepted = true
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e5' })
    })

    expect(accepted).toBe(false)
    expect(lastSocket().sent).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/renderer/src/remote/useRemoteSocket.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать хук**

Создать `app/src/renderer/src/remote/useRemoteSocket.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'

type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

type UseRemoteSocket = {
  position: string
  onPieceDrop: (args: PieceDropArgs) => boolean
}

function remoteSocketUrl(): string {
  const params = new URLSearchParams(window.location.search)
  const port = params.get('wsPort') ?? window.location.port
  return `ws://${window.location.hostname}:${port}/ws`
}

export function useRemoteSocket(): UseRemoteSocket {
  const gameRef = useRef(new Chess())
  const socketRef = useRef<WebSocket | null>(null)
  const [position, setPosition] = useState(gameRef.current.fen())

  useEffect(() => {
    let socket: WebSocket | null = null
    let closed = false
    let attempt = 0
    let timer: number | undefined

    function connect(): void {
      socket = new WebSocket(remoteSocketUrl())
      socketRef.current = socket
      socket.onopen = () => {
        attempt = 0
      }
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as { type: string; fen?: string }
        if (message.type === 'position' && message.fen) {
          gameRef.current = new Chess(message.fen)
          setPosition(message.fen)
        }
      }
      socket.onclose = () => {
        if (closed) {
          return
        }
        attempt += 1
        timer = window.setTimeout(connect, Math.min(1000 * attempt, 5000))
      }
    }

    connect()

    return () => {
      closed = true
      if (timer) {
        window.clearTimeout(timer)
      }
      socket?.close()
    }
  }, [])

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropArgs): boolean => {
    if (!targetSquare) {
      return false
    }
    try {
      gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    } catch {
      return false
    }
    setPosition(gameRef.current.fen())
    socketRef.current?.send(
      JSON.stringify({ type: 'move', from: sourceSquare, to: targetSquare, promotion: 'q' })
    )
    return true
  }, [])

  return { position, onPieceDrop }
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/renderer/src/remote/useRemoteSocket.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: Коммит**

```bash
git add app/src/renderer/src/remote/useRemoteSocket.ts app/src/renderer/src/remote/useRemoteSocket.test.ts
git commit -m "feat: WS-логика удалённой доски"
```

---

### Task 9: Удалённая страница и второй entry

**Files:**
- Create: `app/src/renderer/src/remote/RemoteBoard.tsx`
- Test: `app/src/renderer/src/remote/RemoteBoard.test.tsx`
- Create: `app/src/renderer/remote.html`
- Create: `app/src/renderer/src/remote/main.tsx`
- Modify: `app/electron.vite.config.ts`
- Modify: `app/src/renderer/src/assets/main.css`

**Interfaces:**
- Consumes: `useRemoteSocket` из Task 8.
- Produces: компонент `RemoteBoard`; entry-страница `remote.html`.

- [ ] **Step 1: Написать падающий тест**

Создать `app/src/renderer/src/remote/RemoteBoard.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import RemoteBoard from './RemoteBoard'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }
  send(): void {}
  close(): void {}
}

describe('RemoteBoard', () => {
  afterEach(() => {
    FakeWebSocket.instances = []
    vi.unstubAllGlobals()
  })

  it('renders all 64 squares', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { container } = render(<RemoteBoard />)

    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/renderer/src/remote/RemoteBoard.test.tsx`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать `RemoteBoard.tsx`**

Создать `app/src/renderer/src/remote/RemoteBoard.tsx`:
```tsx
import { Chessboard } from 'react-chessboard'
import { useRemoteSocket } from './useRemoteSocket'

function RemoteBoard(): React.JSX.Element {
  const { position, onPieceDrop } = useRemoteSocket()

  return (
    <div className="remote-board">
      <Chessboard options={{ position, onPieceDrop }} />
    </div>
  )
}

export default RemoteBoard
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/renderer/src/remote/RemoteBoard.test.tsx`
Expected: PASS (1 тест).

- [ ] **Step 5: Создать entry-страницу**

Создать `app/src/renderer/remote.html`:
```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>Gambit — доска</title>
  </head>

  <body>
    <div id="remote-root"></div>
    <script type="module" src="/src/remote/main.tsx"></script>
  </body>
</html>
```

Создать `app/src/renderer/src/remote/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../assets/main.css'
import RemoteBoard from './RemoteBoard'

createRoot(document.getElementById('remote-root')!).render(
  <StrictMode>
    <RemoteBoard />
  </StrictMode>
)
```

- [ ] **Step 6: Добавить второй entry в electron-vite**

Заменить содержимое `app/electron.vite.config.ts`:
```ts
import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          remote: resolve('src/renderer/remote.html')
        }
      }
    }
  }
})
```

- [ ] **Step 7: Добавить стили страницы**

В `app/src/renderer/src/assets/main.css` добавить:
```css
#remote-root {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
}

.remote-board {
  width: min(100vw, 100vh);
  height: min(100vw, 100vh);
  padding: 8px;
}
```

- [ ] **Step 8: Прогнать тесты и коммит**

Run: `cd app && npm test -- --run && npm run lint && npm run typecheck`
Expected: все зелёные.
```bash
git add app/src/renderer/src/remote app/src/renderer/remote.html app/electron.vite.config.ts app/src/renderer/src/assets/main.css
git commit -m "feat: удалённая страница с доской"
```

---

### Task 10: Сборка сервера в `main` и IPC

**Files:**
- Create: `app/src/main/remoteIpc.ts`
- Test: `app/src/main/remoteIpc.test.ts`
- Modify: `app/src/main/index.ts`
- Modify: `app/package.json` (dep `qrcode`)

**Interfaces:**
- Consumes: `createRemoteServer` (Task 2), `getLanAddress` (Task 3), `RemoteMove`/`ServerInfo` (Task 3).
- Produces: `registerRemoteIpc(options: { ipcMain: IpcMainLike; server: { setPosition: (fen: string) => void }; info: ServerInfo }): void`; работающее приложение.

- [ ] **Step 1: Установить `qrcode`**

Run:
```bash
cd app && npm install qrcode && npm install -D @types/qrcode
```

- [ ] **Step 2: Написать падающий тест `remoteIpc`**

Создать `app/src/main/remoteIpc.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { registerRemoteIpc, type IpcMainLike } from './remoteIpc'
import type { ServerInfo } from '../shared/remote'

function createIpcMain(): {
  ipcMain: IpcMainLike
  emit: (channel: string, ...args: unknown[]) => void
  invoke: (channel: string) => unknown
} {
  const listeners = new Map<string, (event: unknown, ...args: unknown[]) => void>()
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  return {
    ipcMain: {
      on: (channel, listener) => listeners.set(channel, listener),
      handle: (channel, listener) => handlers.set(channel, listener)
    },
    emit: (channel, ...args) => listeners.get(channel)?.({}, ...args),
    invoke: (channel) => handlers.get(channel)?.()
  }
}

describe('registerRemoteIpc', () => {
  const info: ServerInfo = { url: 'http://192.168.1.42:3210/', port: 3210, qrDataUrl: 'data:...' }

  it('publishes positions to the server', () => {
    const { ipcMain, emit } = createIpcMain()
    const setPosition = vi.fn()
    registerRemoteIpc({ ipcMain, server: { setPosition }, info })

    emit('remote:position', '8/8/8/8/8/8/8/K6k w - - 0 1')

    expect(setPosition).toHaveBeenCalledWith('8/8/8/8/8/8/8/K6k w - - 0 1')
  })

  it('ignores non-string positions', () => {
    const { ipcMain, emit } = createIpcMain()
    const setPosition = vi.fn()
    registerRemoteIpc({ ipcMain, server: { setPosition }, info })

    emit('remote:position', 42)

    expect(setPosition).not.toHaveBeenCalled()
  })

  it('returns server info on request', () => {
    const { ipcMain, invoke } = createIpcMain()
    registerRemoteIpc({ ipcMain, server: { setPosition: vi.fn() }, info })

    expect(invoke('remote:server-info')).toEqual(info)
  })
})
```

- [ ] **Step 3: Запустить тест — должен упасть**

Run: `cd app && npm test -- --run src/main/remoteIpc.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 4: Реализовать `remoteIpc.ts`**

Создать `app/src/main/remoteIpc.ts`:
```ts
import type { ServerInfo } from '../shared/remote'

export type IpcMainLike = {
  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
  handle: (channel: string, listener: (...args: unknown[]) => unknown) => void
}

export type RegisterRemoteIpcOptions = {
  ipcMain: IpcMainLike
  server: { setPosition: (fen: string) => void }
  info: ServerInfo
}

export function registerRemoteIpc({ ipcMain, server, info }: RegisterRemoteIpcOptions): void {
  ipcMain.on('remote:position', (_event, fen) => {
    if (typeof fen === 'string') {
      server.setPosition(fen)
    }
  })
  ipcMain.handle('remote:server-info', () => info)
}
```

- [ ] **Step 5: Запустить тест — должен пройти**

Run: `cd app && npm test -- --run src/main/remoteIpc.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 6: Собрать всё в `main/index.ts`**

Заменить содержимое `app/src/main/index.ts`:
```ts
import { app, shell, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { networkInterfaces } from 'os'
import QRCode from 'qrcode'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createRemoteServer, type RemoteServer } from './remoteServer'
import { getLanAddress } from './lan'
import { registerRemoteIpc } from './remoteIpc'

let remoteServer: RemoteServer | null = null

async function startRemoteServer(): Promise<void> {
  remoteServer = await createRemoteServer({
    staticDir: join(__dirname, '../renderer'),
    devServerUrl: is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined,
    onMove: (move) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('remote:move', move)
    }
  })

  const url = `http://${getLanAddress(networkInterfaces())}:${remoteServer.port}/`
  const qrDataUrl = await QRCode.toDataURL(url)
  registerRemoteIpc({
    ipcMain,
    server: remoteServer,
    info: { url, port: remoteServer.port, qrDataUrl }
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.gambit.app')
  Menu.setApplicationMenu(null)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await startRemoteServer()
  } catch (error) {
    console.error('Не удалось запустить веб-сервер:', error)
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  remoteServer?.close()
})
```

- [ ] **Step 7: Проверки**

Run: `cd app && npm test -- --run && npm run lint && npm run typecheck && npm run build`
Expected: всё зелёное, сборка проходит (в `out/renderer` появляются `index.html` и `remote.html`).

- [ ] **Step 8: Ручная проверка**

Run: `cd app && npm run dev`
Ожидаемо: в правом нижнем углу — иконка QR; клик открывает модалку с QR и адресом. Открыть адрес на телефоне в той же сети: видна доска; ход с телефона появляется в приложении; ход в приложении появляется на телефоне.

- [ ] **Step 9: Коммит**

```bash
git add app/src/main/remoteIpc.ts app/src/main/remoteIpc.test.ts app/src/main/index.ts app/package.json app/package-lock.json
git commit -m "feat: запуск веб-сервера и IPC в main"
```

---

## Self-Review

**Покрытие спеки:**
- Архитектура и IPC-протокол — Task 3, 4, 5, 10.
- WebSocket-протокол — Task 2.
- Веб-сервер (порт, статика, dev-прокси, LAN-адрес, traversal) — Task 1, 2, 3, 10.
- Удалённая страница и второй entry — Task 8, 9.
- UI с адресом и QR — Task 7.
- Обработка ошибок (порт, localhost, нелегальный ход, обрыв WS, отсутствие renderer) — Task 1 (порт), 3 (localhost), 2 (отбрасывание при отсутствии подписчика), 8 (reconnect, отказ хода).
- Тестирование и проекты Vitest — Task 1.

**Placeholder-скан:** плейсхолдеров нет; каждый шаг содержит код или точную команду.

**Согласованность типов:** `RemoteMove`, `ServerInfo`, `RemoteApi` определены в Task 3 и используются без изменений в Task 4–8, 10; `startStaticServer`→`StaticServer` (Task 1) используется в `createRemoteServer` (Task 2); `registerRemoteIpc`/`IpcMainLike` (Task 10) соответствуют вызову в `index.ts`.
