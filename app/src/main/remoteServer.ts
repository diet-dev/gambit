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
