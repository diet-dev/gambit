import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import RemoteBoard from './RemoteBoard'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static OPEN = 1
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  readyState = 1
  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }
  send(data: string): void {
    void data
  }
  close(): void {
    FakeWebSocket.instances = FakeWebSocket.instances.filter((instance) => instance !== this)
  }
}

function lastSocket(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
}

describe('RemoteBoard', () => {
  let rectSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    const rect = {
      width: 60,
      height: 60,
      top: 0,
      left: 0,
      right: 60,
      bottom: 60,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }
    rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(rect as DOMRect)
  })

  afterEach(() => {
    rectSpy.mockRestore()
    FakeWebSocket.instances = []
    vi.unstubAllGlobals()
  })

  it('renders all 64 squares and the status bar', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { container } = render(<RemoteBoard />)

    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
    expect(container.querySelector('.status-bar')).toHaveTextContent('Ход белых')
  })

  it('highlights the king and shows the check status', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { container } = render(<RemoteBoard />)

    act(() => {
      lastSocket().onmessage?.({
        data: JSON.stringify({ type: 'position', fen: '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1' })
      })
    })

    expect(container.querySelector('[data-square="e8"] > div')).toHaveStyle({
      backgroundImage:
        'radial-gradient(circle, transparent 35%, rgba(255, 0, 0, 0.75) 65%, rgba(255, 0, 0, 0.75) 100%)'
    })
    expect(container.querySelector('.status-bar')).toHaveTextContent('Шах чёрным!')
  })

  it('shows the checkmate status in red', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { container } = render(<RemoteBoard />)

    act(() => {
      lastSocket().onmessage?.({
        data: JSON.stringify({
          type: 'position',
          fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'
        })
      })
    })

    const statusBar = container.querySelector('.status-bar')
    expect(statusBar).toHaveTextContent('Мат! Победа чёрных')
    expect(statusBar).toHaveClass('status-bar-checkmate')
  })
})
