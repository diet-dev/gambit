import { type UciTransport } from './uciTransport'

export type Engine = {
  configureStrength(elo: number): Promise<void>
  findBestMove(fen: string): Promise<string>
  dispose(): void
}

const HANDSHAKE_TIMEOUT_MS = 10_000
const SEARCH_TIMEOUT_MS = 5_000

export function createStockfishEngine(transport: UciTransport): Engine {
  const listeners = new Set<(line: string) => void>()
  const pending = new Set<(error: Error) => void>()

  transport.onMessage((line) => {
    for (const listener of [...listeners]) {
      listener(line)
    }
  })

  function waitFor(
    predicate: (line: string) => boolean,
    timeoutMs: number,
    onTimeout?: () => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null

      const finish = (): void => {
        if (timer !== null) {
          clearTimeout(timer)
        }
        listeners.delete(listener)
        pending.delete(fail)
      }

      const fail = (error: Error): void => {
        finish()
        reject(error)
      }

      const listener = (line: string): void => {
        if (!predicate(line)) {
          return
        }

        finish()
        resolve(line)
      }

      timer = setTimeout(() => {
        finish()
        onTimeout?.()
        reject(new Error('Stockfish timed out'))
      }, timeoutMs)

      listeners.add(listener)
      pending.add(fail)
    })
  }

  const ready = (async (): Promise<void> => {
    const uciok = waitFor((line) => line === 'uciok', HANDSHAKE_TIMEOUT_MS)
    transport.post('uci')
    await uciok
  })()
  void ready.catch(() => undefined)

  let active: Promise<unknown> | null = null

  async function search(fen: string): Promise<string> {
    const bestmove = waitFor(
      (line) => line.startsWith('bestmove'),
      SEARCH_TIMEOUT_MS,
      () => transport.post('stop')
    )
    void bestmove.catch(() => undefined)
    await ready
    transport.post(`position fen ${fen}`)
    transport.post('go movetime 500')
    const line = await bestmove
    const move = line.split(' ')[1]

    if (!move || move === '(none)') {
      throw new Error('Stockfish did not return a move')
    }

    return move
  }

  function findBestMove(fen: string): Promise<string> {
    if (active) {
      const run = active.then(() => search(fen))
      active = run.catch(() => undefined)
      return run
    }

    const run = search(fen)
    active = run.catch(() => undefined)
    return run
  }

  return {
    async configureStrength(elo: number): Promise<void> {
      await ready
      transport.post('setoption name UCI_LimitStrength value true')
      transport.post(`setoption name UCI_Elo value ${elo}`)
    },

    findBestMove,

    dispose(): void {
      for (const fail of [...pending]) {
        fail(new Error('Stockfish engine disposed'))
      }

      pending.clear()
      transport.terminate()
    }
  }
}
