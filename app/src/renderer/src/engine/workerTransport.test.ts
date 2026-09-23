import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWorkerTransport } from './workerTransport'

describe('createWorkerTransport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('wraps a Web Worker as a UCI transport', () => {
    const postMessage = vi.fn()
    const terminate = vi.fn()
    let instance: { onmessage: ((event: MessageEvent) => void) | null } | null = null

    class FakeWorker {
      onmessage: ((event: MessageEvent) => void) | null = null
      postMessage = postMessage
      terminate = terminate

      constructor() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        instance = this
      }
    }

    vi.stubGlobal('Worker', FakeWorker)

    const transport = createWorkerTransport('stockfish/engine.js')
    const received: string[] = []
    transport.onMessage((line) => received.push(line))
    transport.post('uci')
    instance!.onmessage!({ data: 'uciok' } as MessageEvent)
    transport.terminate()

    expect(postMessage).toHaveBeenCalledWith('uci')
    expect(received).toEqual(['uciok'])
    expect(terminate).toHaveBeenCalled()
  })
})
