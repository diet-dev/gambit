import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRemoteBridge } from './useRemoteBridge'
import type { RemoteApi, RemoteMove } from '../../../shared/remote'

function installApi(overrides: Partial<RemoteApi> = {}): RemoteApi {
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => null),
    getClients: vi.fn(async () => []),
    onClientsChanged: vi.fn(() => () => {}),
    ...overrides
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
        results: vi.fn(async () => []),
        positions: vi.fn(async () => ({ seqs: [], series: [] })),
        preview: vi.fn(async () => ({ seq: 1, pairs: [], restingPlayerIds: [] })),
        create: vi.fn(async () => ({
          round: { id: 1, tournamentId: 1, seq: 1, playedDate: '', settingsId: 1 },
          pairs: []
        }))
      }
    },
    database: {
      exportSnapshot: vi.fn(async () => null)
    },
    situations: {
      list: vi.fn(async () => []),
      create: vi.fn(async () => ({
        id: 1,
        groupId: 1,
        title: 'Новая ситуация',
        description: '',
        comment: '',
        fen: '',
        sortOrder: 1
      }))
    }
  }
  return remote
}

describe('useRemoteBridge', () => {
  it('publishes the position on mount and on change', () => {
    const remote = installApi()
    const playMove = vi.fn(() => true)

    const { rerender } = renderHook(({ position }) => useRemoteBridge({ position, playMove }), {
      initialProps: { position: 'fen-a' }
    })
    rerender({ position: 'fen-b' })

    expect(remote.publishPosition).toHaveBeenNthCalledWith(1, 'fen-a')
    expect(remote.publishPosition).toHaveBeenNthCalledWith(2, 'fen-b')
  })

  it('applies remote moves through playMove', () => {
    let handler: ((move: RemoteMove) => void) | null = null
    installApi({
      onRemoteMove: (callback) => {
        handler = callback
        return () => {}
      }
    })
    const playMove = vi.fn(() => true)

    renderHook(() => useRemoteBridge({ position: 'fen-a', playMove }))
    handler!({ from: 'e2', to: 'e4' })

    expect(playMove).toHaveBeenCalledWith({ from: 'e2', to: 'e4' })
  })

  it('re-publishes the current position when playMove rejects the move', () => {
    let handler: ((move: RemoteMove) => void) | null = null
    const publishPosition = vi.fn()
    installApi({
      publishPosition,
      onRemoteMove: (callback) => {
        handler = callback
        return () => {}
      }
    })
    const playMove = vi.fn(() => false)

    renderHook(() => useRemoteBridge({ position: 'fen-a', playMove }))
    publishPosition.mockClear()
    handler!({ from: 'e2', to: 'e4' })

    expect(publishPosition).toHaveBeenCalledTimes(1)
    expect(publishPosition).toHaveBeenCalledWith('fen-a')
  })

  it('does not republish when playMove accepts the move', () => {
    let handler: ((move: RemoteMove) => void) | null = null
    const publishPosition = vi.fn()
    installApi({
      publishPosition,
      onRemoteMove: (callback) => {
        handler = callback
        return () => {}
      }
    })
    const playMove = vi.fn(() => true)

    renderHook(() => useRemoteBridge({ position: 'fen-a', playMove }))
    publishPosition.mockClear()
    handler!({ from: 'e2', to: 'e4' })

    expect(publishPosition).not.toHaveBeenCalled()
  })

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn()
    installApi({ onRemoteMove: vi.fn(() => unsubscribe) })
    const playMove = vi.fn(() => true)

    const { unmount } = renderHook(() => useRemoteBridge({ position: 'fen-a', playMove }))
    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
