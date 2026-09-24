import { randomUUID } from 'node:crypto'
import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import { startStaticServer } from './staticServer'
import type { RemoteClient, RemoteMove } from '../shared/remote'

const DEVICE_COOKIE = 'gambit_device'
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type RemoteServer = {
  port: number
  setPosition: (fen: string) => void
  getClients: () => RemoteClient[]
  close: () => Promise<void>
}

export type RemoteServerOptions = {
  staticDir: string
  devServerUrl?: string
  preferredPort?: number
  onMove: (move: RemoteMove) => void
  onClientsChanged?: (clients: RemoteClient[]) => void
  heartbeatIntervalMs?: number
}

type SocketState = {
  isAlive: boolean
  deviceId: string | null
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) {
    return cookies
  }
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) {
      continue
    }
    const name = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (name) {
      cookies[name] = decodeURIComponent(value)
    }
  }
  return cookies
}

function remoteAddress(request: IncomingMessage): string {
  const address = request.socket.remoteAddress ?? ''
  return address.startsWith('::ffff:') ? address.slice(7) : address
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export async function createRemoteServer(options: RemoteServerOptions): Promise<RemoteServer> {
  const staticServer = await startStaticServer({
    staticDir: options.staticDir,
    devServerUrl: options.devServerUrl,
    preferredPort: options.preferredPort,
    responseHeaders: (request, urlPath): Record<string, string> => {
      const path = urlPath.split('?')[0]
      if (path !== '/' && path !== '/remote.html') {
        return {}
      }
      if (parseCookies(request.headers.cookie)[DEVICE_COOKIE]) {
        return {}
      }
      const id = randomUUID()
      return {
        'set-cookie': `${DEVICE_COOKIE}=${id}; Path=/; SameSite=Lax; Max-Age=31536000`
      }
    }
  })

  const devices = new Map<string, RemoteClient>()
  const sockets = new Map<WebSocket, SocketState>()
  const wss = new WebSocketServer({ server: staticServer.server, path: '/ws' })
  let lastPosition = ''

  function clientsList(): RemoteClient[] {
    return Array.from(devices.values()).sort((a, b) => b.lastSeenAt - a.lastSeenAt)
  }

  function notifyClients(): void {
    options.onClientsChanged?.(clientsList())
  }

  function upsertOnline(id: string, request: IncomingMessage): void {
    const existing = devices.get(id)
    const now = Date.now()
    devices.set(id, {
      id,
      address: remoteAddress(request),
      userAgent: request.headers['user-agent'] ?? '',
      online: true,
      connectedAt: existing?.connectedAt ?? now,
      lastSeenAt: now
    })
  }

  function setOffline(id: string): void {
    const existing = devices.get(id)
    if (!existing) {
      return
    }
    devices.set(id, { ...existing, online: false, lastSeenAt: Date.now() })
  }

  function broadcast(fen: string): void {
    const message = JSON.stringify({ type: 'position', fen })
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    }
  }

  wss.on('connection', (socket, request) => {
    const origin = request.headers.origin
    if (origin) {
      let originHost: string | null = null
      try {
        originHost = new URL(origin).hostname
      } catch {
        originHost = null
      }
      const requestHost = request.headers.host?.split(':')[0]
      if (!originHost || originHost !== requestHost) {
        socket.close()
        return
      }
    }

    const state: SocketState = { isAlive: true, deviceId: null }
    sockets.set(socket, state)

    socket.on('pong', () => {
      state.isAlive = true
    })

    socket.send(JSON.stringify({ type: 'position', fen: lastPosition }))

    socket.on('message', (data) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(data.toString())
      } catch {
        return
      }
      if (typeof parsed !== 'object' || parsed === null) {
        return
      }
      const type = (parsed as { type?: unknown }).type

      if (type === 'hello') {
        const proposed = (parsed as { id?: unknown }).id
        const cookieId = parseCookies(request.headers.cookie)[DEVICE_COOKIE]
        const id = isUuid(proposed) ? proposed : isUuid(cookieId) ? cookieId : randomUUID()
        state.deviceId = id
        upsertOnline(id, request)
        socket.send(JSON.stringify({ type: 'welcome', id }))
        notifyClients()
        return
      }

      if (type === 'move') {
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

    socket.on('close', () => {
      sockets.delete(socket)
      if (state.deviceId) {
        setOffline(state.deviceId)
        notifyClients()
      }
    })
  })

  const heartbeat = setInterval(() => {
    for (const [socket, state] of sockets) {
      if (!state.isAlive) {
        socket.terminate()
        continue
      }
      state.isAlive = false
      socket.ping()
    }
  }, options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS)

  return {
    port: staticServer.port,
    setPosition: (fen) => {
      lastPosition = fen
      broadcast(fen)
    },
    getClients: () => clientsList(),
    close: () =>
      new Promise<void>((resolve, reject) => {
        clearInterval(heartbeat)
        for (const client of wss.clients) {
          client.terminate()
        }
        wss.close(() => {
          staticServer.close().then(resolve, reject)
        })
      })
  }
}
