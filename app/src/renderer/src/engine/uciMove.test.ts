import { describe, expect, it } from 'vitest'
import { parseUciMove } from './uciMove'

describe('parseUciMove', () => {
  it('parses a simple move', () => {
    expect(parseUciMove('e2e4')).toEqual({ from: 'e2', to: 'e4' })
  })

  it('parses a promotion move', () => {
    expect(parseUciMove('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' })
  })

  it('parses castling as a king move', () => {
    expect(parseUciMove('e1g1')).toEqual({ from: 'e1', to: 'g1' })
  })

  it('returns null for malformed input', () => {
    expect(parseUciMove('(none)')).toBeNull()
    expect(parseUciMove('e2')).toBeNull()
    expect(parseUciMove('z9z8')).toBeNull()
  })
})
