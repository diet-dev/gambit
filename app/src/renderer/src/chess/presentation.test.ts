import { describe, expect, it } from 'vitest'
import { statusBarClassName, statusText } from './presentation'

describe('statusText', () => {
  it('describes turn, check, mate and draws', () => {
    expect(statusText({ kind: 'turn', turn: 'w' })).toBe('Ход белых')
    expect(statusText({ kind: 'turn', turn: 'b' })).toBe('Ход чёрных')
    expect(statusText({ kind: 'check', turn: 'b' })).toBe('Шах чёрным!')
    expect(statusText({ kind: 'checkmate', winner: 'w' })).toBe('Мат! Победа белых')
    expect(statusText({ kind: 'stalemate' })).toBe('Пат — ничья')
    expect(statusText({ kind: 'draw', reason: 'insufficient-material' })).toBe(
      'Ничья: недостаточно материала'
    )
    expect(statusText({ kind: 'draw', reason: 'threefold-repetition' })).toBe(
      'Ничья: троекратное повторение'
    )
    expect(statusText({ kind: 'draw', reason: 'fifty-moves' })).toBe('Ничья: правило 50 ходов')
  })
})

describe('statusBarClassName', () => {
  it('marks checkmate with the red modifier', () => {
    expect(statusBarClassName({ kind: 'checkmate', winner: 'b' })).toBe(
      'status-bar status-bar-checkmate'
    )
    expect(statusBarClassName({ kind: 'turn', turn: 'w' })).toBe('status-bar')
  })

  it('marks every draw with the green modifier', () => {
    expect(statusBarClassName({ kind: 'stalemate' })).toBe('status-bar status-bar-draw')
    expect(statusBarClassName({ kind: 'draw', reason: 'insufficient-material' })).toBe(
      'status-bar status-bar-draw'
    )
    expect(statusBarClassName({ kind: 'draw', reason: 'threefold-repetition' })).toBe(
      'status-bar status-bar-draw'
    )
    expect(statusBarClassName({ kind: 'draw', reason: 'fifty-moves' })).toBe(
      'status-bar status-bar-draw'
    )
  })
})
