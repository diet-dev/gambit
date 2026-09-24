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

  it('closes a client that connects with a foreign origin', async () => {
    const server = await start()
    server.setPosition('8/8/8/8/8/8/8/K6k w - - 0 1')

    const socket = new WebSocket(`ws://127.0.0.1:${server.port}/ws`, {
      origin: 'http://evil.example'
    })
    const received = await new Promise<string | null>((resolve) => {
      socket.once('message', (data) => resolve(data.toString()))
      socket.once('close', () => resolve(null))
      socket.once('error', () => resolve(null))
    })

    expect(received).toBeNull()
  })

  it('accepts a client whose origin matches the request host', async () => {
    const server = await start()
    server.setPosition('8/8/8/8/8/8/8/K6k w - - 0 1')

    const socket = new WebSocket(`ws://127.0.0.1:${server.port}/ws`, {
      origin: `http://127.0.0.1:${server.port}`
    })
    const message = await nextMessage(socket)

    expect(message).toEqual({ type: 'position', fen: '8/8/8/8/8/8/8/K6k w - - 0 1' })
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
