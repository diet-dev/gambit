import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useRemoteSocket } from './useRemoteSocket'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  sent: string[] = []
  closed = false

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.closed = true
  }
}

function lastSocket(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
}

describe('useRemoteSocket', () => {
  afterEach(() => {
    FakeWebSocket.instances = []
    vi.unstubAllGlobals()
  })

  it('starts from the initial position and follows server updates', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { result } = renderHook(() => useRemoteSocket())

    act(() => {
      lastSocket().onmessage?.({
        data: JSON.stringify({ type: 'position', fen: '8/8/8/8/8/8/8/K6k b - - 0 1' })
      })
    })

    expect(result.current.position).toBe('8/8/8/8/8/8/8/K6k b - - 0 1')
  })

  it('applies a legal drop locally and sends it to the server', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { result } = renderHook(() => useRemoteSocket())

    act(() => {
      lastSocket().onmessage?.({
        data: JSON.stringify({
          type: 'position',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        })
      })
    })

    let accepted = false
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' })
    })

    expect(accepted).toBe(true)
    expect(lastSocket().sent[0]).toBe(
      JSON.stringify({ type: 'move', from: 'e2', to: 'e4', promotion: 'q' })
    )
  })

  it('rejects an illegal drop', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { result } = renderHook(() => useRemoteSocket())

    let accepted = true
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e5' })
    })

    expect(accepted).toBe(false)
    expect(lastSocket().sent).toHaveLength(0)
  })
})
