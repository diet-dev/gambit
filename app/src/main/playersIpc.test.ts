import { describe, expect, it, vi } from 'vitest'
import { registerPlayersIpc } from './playersIpc'
import type { IpcMainLike } from './remoteIpc'
import type { PlayerStore } from './playerStore'

function createIpcMain(): {
  ipcMain: IpcMainLike
  invoke: (channel: string, ...args: unknown[]) => unknown
} {
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  return {
    ipcMain: {
      on: () => {},
      handle: (channel, listener) => handlers.set(channel, listener)
    },
    invoke: (channel, ...args) => handlers.get(channel)?.({}, ...args)
  }
}

function createStore(): PlayerStore {
  return {
    list: vi.fn(() => []),
    create: vi.fn((input) => ({ id: 1, ...input })),
    update: vi.fn((player) => player),
    remove: vi.fn()
  }
}

describe('registerPlayersIpc', () => {
  it('routes list/create/update/remove to the store', () => {
    const { ipcMain, invoke } = createIpcMain()
    const store = createStore()
    registerPlayersIpc({ ipcMain, store })

    expect(invoke('players:list')).toEqual([])

    const input = {
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: '',
      groupId: 1,
      rating: 0
    }
    expect(invoke('players:create', input)).toEqual({ id: 1, ...input })
    expect(store.create).toHaveBeenCalledWith(input)

    const player = { id: 1, ...input }
    expect(invoke('players:update', player)).toEqual(player)
    expect(store.update).toHaveBeenCalledWith(player)

    invoke('players:remove', 1)
    expect(store.remove).toHaveBeenCalledWith(1)
  })
})
