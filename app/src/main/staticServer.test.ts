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

    const { status, body } = await fetchText(
      `http://127.0.0.1:${running.port}/..%2fgambit-secret.txt`
    )

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
