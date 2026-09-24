import { createStockfishEngine, type Engine } from './stockfish'
import { createWorkerTransport } from './workerTransport'

const ENGINE_URL = 'stockfish/stockfish-19-lite-single.js'

let engine: Engine | null = null

export function getDefaultEngine(): Engine {
  if (!engine) {
    engine = createStockfishEngine(createWorkerTransport(ENGINE_URL))
  }

  return engine
}
