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
  const ports =
    preferred === 0 ? [0] : Array.from({ length: PORT_ATTEMPTS }, (_, i) => preferred + i)

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
