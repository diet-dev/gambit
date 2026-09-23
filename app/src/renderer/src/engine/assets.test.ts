import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const WASM_PATH = resolve(
  import.meta.dirname,
  '../../public/stockfish/stockfish-19-lite-single.wasm'
)
const README_PATH = resolve(import.meta.dirname, '../../public/stockfish/README.md')

describe('vendored stockfish assets', () => {
  it('ships a wasm binary with the correct magic header', () => {
    const wasm = readFileSync(WASM_PATH)

    expect(wasm.subarray(0, 4).toString('latin1')).toBe('\0asm')
    expect(wasm.length).toBeGreaterThan(1_000_000)
  })

  it('records the wasm sha256 in the README', () => {
    const wasm = readFileSync(WASM_PATH)
    const readme = readFileSync(README_PATH, 'utf8')
    const recorded = /sha256[^:]*:\s*`?([0-9a-f]{64})`?/i.exec(readme)?.[1]
    const actual = createHash('sha256').update(wasm).digest('hex')

    expect(recorded).toBe(actual)
  })
})
