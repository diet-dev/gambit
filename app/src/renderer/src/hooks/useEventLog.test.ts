import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEventLog } from './useEventLog'
import type { RemoteApi, RemoteClient } from '../../../shared/remote'

function installApi(initial: RemoteClient[]): { emit: (clients: RemoteClient[]) => void } {
  let handler: ((clients: RemoteClient[]) => void) | null = null
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => null),
    getClients: vi.fn(async () => initial),
    onClientsChanged: vi.fn((callback) => {
      handler = callback
      return () => {}
    })
  }
  window.api = {
    remote,
    players: {
      list: async () => [],
      create: async (input) => ({ id: 1, ...input }),
      update: async (player) => player,
      remove: async () => {}
    },
    groups: {
      list: async () => [],
      create: async (input) => ({ id: 1, ...input }),
      update: async (group) => group,
      remove: async () => {}
    },
    tournament: {
      settings: {
        list: vi.fn(async () => []),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      },
      tournaments: {
        list: vi.fn(async () => []),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      },
      rounds: {
        list: vi.fn(async () => []),
        preview: vi.fn(async () => ({ seq: 1, pairs: [], restingPlayerId: null })),
        create: vi.fn(async () => ({
          round: { id: 1, tournamentId: 1, seq: 1, playedDate: '', settingsId: 1 },
          pairs: []
        }))
      }
    }
  }
  return {
    emit: (clients) => handler?.(clients)
  }
}

function client(id: string, online: boolean): RemoteClient {
  return {
    id,
    address: '192.168.1.5',
    userAgent: 'Mozilla (iPhone)',
    online,
    connectedAt: 1,
    lastSeenAt: Date.now()
  }
}

describe('useEventLog', () => {
  it('logs new devices and online/offline transitions', async () => {
    const { emit } = installApi([])
    const { result } = renderHook(() => useEventLog())

    await act(async () => {})
    act(() => emit([client('a', true)]))
    act(() => emit([client('a', false)]))
    act(() => emit([client('a', true)]))

    expect(result.current.events.map((event) => event.kind)).toEqual([
      'device-new',
      'device-offline',
      'device-online'
    ])
  })

  it('logs moves with their origin', async () => {
    installApi([])
    const { result } = renderHook(() => useEventLog())

    act(() => {
      result.current.logMove({ from: 'e2', to: 'e4' }, 'remote')
      result.current.logMove({ from: 'e7', to: 'e5' }, 'local')
    })

    expect(result.current.events).toMatchObject([
      { kind: 'move', origin: 'remote', from: 'e2', to: 'e4' },
      { kind: 'move', origin: 'local', from: 'e7', to: 'e5' }
    ])
  })

  it('keeps only the last 100 events', async () => {
    installApi([])
    const { result } = renderHook(() => useEventLog())

    act(() => {
      for (let index = 0; index < 105; index += 1) {
        result.current.logMove({ from: 'e2', to: 'e4' }, 'local')
      }
    })

    expect(result.current.events).toHaveLength(100)
  })
})
