import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import RemoteBoard from './RemoteBoard'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
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

describe('RemoteBoard', () => {
  afterEach(() => {
    FakeWebSocket.instances = []
    vi.unstubAllGlobals()
  })

  it('renders all 64 squares', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const { container } = render(<RemoteBoard />)

    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
  })
})
