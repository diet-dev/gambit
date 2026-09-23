import { createStockfishEngine, type Engine } from './stockfish'
import { createWorkerTransport } from './workerTransport'

const ENGINE_URL = 'stockfish/stockfish-19-lite-single.js'
const SKILL_LEVEL = 1

let engine: Engine | null = null

export function getDefaultEngine(): Engine {
  if (!engine) {
    engine = createStockfishEngine(createWorkerTransport(ENGINE_URL))
    void engine.setSkillLevel(SKILL_LEVEL).catch(() => undefined)
  }

  return engine
}
