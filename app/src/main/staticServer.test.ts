import { mkdtemp, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { createServer } from 'http'
import type { AddressInfo } from 'net'
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

  it('marks the page as no-store and hashed assets as immutable', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gambit-static-'))
    await writeFile(join(dir, 'remote.html'), '<!doctype html><title>remote</title>')
    await writeFile(join(dir, 'app-abc123.js'), 'export {}')

    running = await startStaticServer({ staticDir: dir, preferredPort: 0 })
    const page = await fetch(`http://127.0.0.1:${running.port}/`)
    const asset = await fetch(`http://127.0.0.1:${running.port}/app-abc123.js`)

    expect(page.headers.get('cache-control')).toBe('no-store')
    expect(asset.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
  })

  it('blocks path traversal', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gambit-static-'))
    const secret = join(dir, '..', 'gambit-secret.txt')
    await writeFile(secret, 'secret')
    running = await startStaticServer({ staticDir: dir, preferredPort: 0 })

    const { status, body } = await fetchText(
      `http://127.0.0.1:${running.port}/..%2fgambit-secret.txt`
    )

    expect(status).toBe(404)
    expect(body).not.toContain('secret')
  })

  it('serves the page for the root path with a cache-busting query', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gambit-static-'))
    await writeFile(join(dir, 'remote.html'), '<!doctype html><title>remote</title>')

    running = await startStaticServer({ staticDir: dir, preferredPort: 0 })
    const { status, body } = await fetchText(`http://127.0.0.1:${running.port}/?v=abc`)

    expect(status).toBe(200)
    expect(body).toContain('remote')
  })

  it('proxies to the dev server, mapping root with a query to remote.html', async () => {
    let receivedUrl = ''
    const devServer = createServer((request, response) => {
      receivedUrl = request.url ?? ''
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
    const { status, body } = await fetchText(`http://127.0.0.1:${running.port}/?v=abc`)

    expect(status).toBe(200)
    expect(body).toContain('dev-remote')
    expect(receivedUrl).toBe('/remote.html?v=abc')

    await new Promise<void>((resolve) => devServer.close(() => resolve()))
  })

  it('falls back to the next port when the preferred port is busy', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gambit-static-'))
    await writeFile(join(dir, 'remote.html'), '<!doctype html><title>remote</title>')

    const blocker = createServer()
    await new Promise<void>((resolve) => blocker.listen(0, '127.0.0.1', resolve))
    const busyPort = (blocker.address() as AddressInfo).port

    try {
      running = await startStaticServer({ staticDir: dir, preferredPort: busyPort })
      expect(running.port).not.toBe(busyPort)
      expect(running.port).toBeGreaterThan(busyPort)
    } finally {
      await new Promise<void>((resolve) => blocker.close(() => resolve()))
    }
  })
})
