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
