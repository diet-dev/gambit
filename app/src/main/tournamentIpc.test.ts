import { describe, expect, it, vi } from 'vitest'
import { registerTournamentIpc } from './tournamentIpc'
import type { IpcMainLike } from './remoteIpc'
import type { TournamentStore } from './tournamentStore'

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

function createStore(): TournamentStore {
  return {
    listSettings: vi.fn(() => []),
    createSettings: vi.fn((input) => ({
      id: 1,
      createdAt: '2026-09-27T00:00:00.000Z',
      used: false,
      ...input
    })),
    updateSettings: vi.fn((id, input) => ({
      id,
      createdAt: '2026-09-27T00:00:00.000Z',
      used: false,
      ...input
    })),
    removeSettings: vi.fn()
  }
}

describe('registerTournamentIpc', () => {
  it('routes settings list/create/update/remove to the store', () => {
    const { ipcMain, invoke } = createIpcMain()
    const store = createStore()
    registerTournamentIpc({ ipcMain, store })

    expect(invoke('tournament:settings:list')).toEqual([])

    const input = {
      name: 'Блиц',
      weakerPlaysWhite: false,
      drawScoring: 'none',
      absenceScoring: 'no_effect'
    }
    expect(invoke('tournament:settings:create', input)).toMatchObject(input)
    expect(store.createSettings).toHaveBeenCalledWith(input)

    expect(invoke('tournament:settings:update', 3, input)).toMatchObject({ id: 3, ...input })
    expect(store.updateSettings).toHaveBeenCalledWith(3, input)

    invoke('tournament:settings:remove', 3)
    expect(store.removeSettings).toHaveBeenCalledWith(3)
  })
})
