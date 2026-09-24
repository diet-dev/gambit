import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRemoteBridge } from './useRemoteBridge'
import type { RemoteApi, RemoteMove } from '../../../shared/remote'

function installApi(overrides: Partial<RemoteApi> = {}): RemoteApi {
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => null),
    ...overrides
  }
  window.api = { remote }
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

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn()
    installApi({ onRemoteMove: vi.fn(() => unsubscribe) })
    const playMove = vi.fn(() => true)

    const { unmount } = renderHook(() => useRemoteBridge({ position: 'fen-a', playMove }))
    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
