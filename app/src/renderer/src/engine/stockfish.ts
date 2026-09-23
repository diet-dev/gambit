import { type UciTransport } from './uciTransport'

export type Engine = {
  setSkillLevel(level: number): Promise<void>
  findBestMove(fen: string): Promise<string>
  dispose(): void
}

export function createStockfishEngine(transport: UciTransport): Engine {
  const listeners = new Set<(line: string) => void>()

  transport.onMessage((line) => {
    for (const listener of [...listeners]) {
      listener(line)
    }
  })

  function waitFor(predicate: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => {
      const listener = (line: string): void => {
        if (predicate(line)) {
          listeners.delete(listener)
          resolve(line)
        }
      }
      listeners.add(listener)
    })
  }

  const ready = (async (): Promise<void> => {
    const uciok = waitFor((line) => line === 'uciok')
    transport.post('uci')
    await uciok
  })()

  return {
    async setSkillLevel(level: number): Promise<void> {
      await ready
      transport.post(`setoption name Skill Level value ${level}`)
    },

    async findBestMove(fen: string): Promise<string> {
      const bestmove = waitFor((line) => line.startsWith('bestmove'))
      await ready
      transport.post(`position fen ${fen}`)
      transport.post('go movetime 500')
      const line = await bestmove
      const move = line.split(' ')[1]

      if (!move || move === '(none)') {
        throw new Error('Stockfish did not return a move')
      }

      return move
    },

    dispose(): void {
      transport.terminate()
    }
  }
}
