import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STOCKFISH_DIR = resolve(import.meta.dirname, '../../public/stockfish')
const WASM_PATH = resolve(STOCKFISH_DIR, 'stockfish-19-lite-single.wasm')
const JS_PATH = resolve(STOCKFISH_DIR, 'stockfish-19-lite-single.js')
const README_PATH = resolve(STOCKFISH_DIR, 'README.md')

const ASSETS = [
  { name: 'stockfish-19-lite-single.wasm', path: WASM_PATH },
  { name: 'stockfish-19-lite-single.js', path: JS_PATH }
] as const

function recordedSha(readme: string, name: string): string | undefined {
  const normalized = readme.replace(/`/g, '')
  const escaped = name.replace(/\./g, '\\.')
  return new RegExp(`sha256 \\(${escaped}\\):\\s*([0-9a-f]{64})`, 'i').exec(normalized)?.[1]
}

describe('vendored stockfish assets', () => {
  it('ships a wasm binary with the correct magic header', () => {
    const wasm = readFileSync(WASM_PATH)

    expect(wasm.subarray(0, 4).toString('latin1')).toBe('\0asm')
    expect(wasm.length).toBeGreaterThan(1_000_000)
  })

  it.each(ASSETS)('records the $name sha256 in the README', ({ name, path }) => {
    const data = readFileSync(path)
    const readme = readFileSync(README_PATH, 'utf8')
    const actual = createHash('sha256').update(data).digest('hex')

    expect(recordedSha(readme, name)).toBe(actual)
  })
})
