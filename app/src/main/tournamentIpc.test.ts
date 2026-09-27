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
    removeSettings: vi.fn(),
    listTournaments: vi.fn(() => []),
    createTournament: vi.fn((input) => ({ id: 1, ...input })),
    updateTournament: vi.fn((id, input) => ({ id, ...input })),
    removeTournament: vi.fn(),
    listRounds: vi.fn(() => []),
    previewPairs: vi.fn(() => ({ seq: 1, pairs: [], restingPlayerId: null })),
    createRound: vi.fn(() => ({
      round: {
        id: 1,
        tournamentId: 1,
        seq: 1,
        playedDate: '2026-10-05',
        settingsId: 1
      },
      pairs: []
    }))
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

    expect(invoke('tournament:tournaments:list')).toEqual([])

    const tournamentInput = {
      name: 'Осенний',
      groupId: 1,
      startDate: '2026-10-01',
      settingsId: 2
    }
    expect(invoke('tournament:tournaments:create', tournamentInput)).toEqual({
      id: 1,
      ...tournamentInput
    })
    expect(store.createTournament).toHaveBeenCalledWith(tournamentInput)

    expect(invoke('tournament:tournaments:update', 5, tournamentInput)).toEqual({
      id: 5,
      ...tournamentInput
    })
    expect(store.updateTournament).toHaveBeenCalledWith(5, tournamentInput)

    invoke('tournament:tournaments:remove', 5)
    expect(store.removeTournament).toHaveBeenCalledWith(5)

    invoke('tournament:rounds:list', 5)
    expect(store.listRounds).toHaveBeenCalledWith(5)

    invoke('tournament:rounds:preview', 5)
    expect(store.previewPairs).toHaveBeenCalledWith(5)

    const roundInput = {
      tournamentId: 5,
      playedDate: '2026-10-05',
      settingsId: 1,
      pairs: [{ player1Id: 1, player2Id: 2, result: 'draw' }]
    }
    invoke('tournament:rounds:create', roundInput)
    expect(store.createRound).toHaveBeenCalledWith(roundInput)
  })
})
