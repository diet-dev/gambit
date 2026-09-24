import { describe, expect, it, vi } from 'vitest'
import { createStockfishEngine } from './stockfish'
import { type UciTransport } from './uciTransport'

function createFakeTransport(): {
  transport: UciTransport
  sent: string[]
  terminate: ReturnType<typeof vi.fn>
  emit: (line: string) => void
} {
  const sent: string[] = []
  const handlers: ((line: string) => void)[] = []
  const terminate = vi.fn()

  const transport: UciTransport = {
    post: (message) => sent.push(message),
    onMessage: (handler) => handlers.push(handler),
    terminate
  }

  return {
    transport,
    sent,
    terminate,
    emit: (line: string): void => handlers.forEach((handler) => handler(line))
  }
}

describe('createStockfishEngine', () => {
  it('performs the UCI handshake on creation', () => {
    const fake = createFakeTransport()

    createStockfishEngine(fake.transport)

    expect(fake.sent).toContain('uci')
  })

  it('configures the Elo strength limit after the handshake', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    await engine.configureStrength(2200)

    expect(fake.sent).toContain('setoption name UCI_LimitStrength value true')
    expect(fake.sent).toContain('setoption name UCI_Elo value 2200')
  })

  it('returns the move from the bestmove line', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    const move = engine.findBestMove('8/8/8/8/8/8/8/K6k w - - 0 1')
    await Promise.resolve()
    fake.emit('bestmove e2e4 ponder e7e5')

    await expect(move).resolves.toBe('e2e4')
  })

  it('throws when the engine has no move', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    const move = engine.findBestMove('8/8/8/8/8/8/8/K6k w - - 0 1')
    fake.emit('bestmove (none)')

    await expect(move).rejects.toThrow()
  })

  it('terminates the transport on dispose', () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    engine.dispose()

    expect(fake.terminate).toHaveBeenCalled()
  })

  it('rejects a search that never receives a bestmove', async () => {
    vi.useFakeTimers()

    try {
      const fake = createFakeTransport()
      const engine = createStockfishEngine(fake.transport)

      fake.emit('uciok')
      const move = engine.findBestMove('8/8/8/8/8/8/8/K6k w - - 0 1')

      await vi.advanceTimersByTimeAsync(5_000)

      await expect(move).rejects.toThrow()
      expect(fake.sent).toContain('stop')
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects a pending search on dispose', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    const move = engine.findBestMove('8/8/8/8/8/8/8/K6k w - - 0 1')

    engine.dispose()

    await expect(move).rejects.toThrow()
    expect(fake.terminate).toHaveBeenCalled()
  })

  it('serializes overlapping searches so each receives its own move', async () => {
    const fake = createFakeTransport()
    const engine = createStockfishEngine(fake.transport)

    fake.emit('uciok')
    await Promise.resolve()

    const first = engine.findBestMove('fen-a')
    const second = engine.findBestMove('fen-b')

    const goCount = (): number =>
      fake.sent.filter((message) => message === 'go movetime 500').length

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(goCount()).toBe(1)

    fake.emit('bestmove e2e4 ponder e7e5')
    await expect(first).resolves.toBe('e2e4')

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(goCount()).toBe(2)

    fake.emit('bestmove d2d4 ponder d7d5')
    await expect(second).resolves.toBe('d2d4')
  })
})
