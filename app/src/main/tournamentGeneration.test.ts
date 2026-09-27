import { describe, expect, it } from 'vitest'
import { generateRound, swapFor } from './tournamentGeneration'

const defaultSettings = {
  weakerPlaysWhite: true,
  drawScoring: 'weaker',
  absenceScoring: 'loss'
} as const

const players = (ids: number[]): { id: number; lastName: string }[] =>
  ids.map((id) => ({ id, lastName: `Фамилия${id}` }))

describe('swapFor', () => {
  it('swaps when the weaker player (slot 2) wins', () => {
    expect(swapFor('player2_win', defaultSettings)).toBe(true)
    expect(swapFor('player1_win', defaultSettings)).toBe(false)
  })

  it('treats a draw according to drawScoring', () => {
    expect(swapFor('draw', defaultSettings)).toBe(true)
    expect(swapFor('draw', { ...defaultSettings, drawScoring: 'stronger' })).toBe(false)
    expect(swapFor('draw', { ...defaultSettings, drawScoring: 'none' })).toBe(false)
  })

  it('treats absences according to absenceScoring', () => {
    expect(swapFor('player1_absent', defaultSettings)).toBe(true)
    expect(swapFor('player2_absent', defaultSettings)).toBe(false)
    expect(swapFor('player1_absent', { ...defaultSettings, absenceScoring: 'no_effect' })).toBe(
      false
    )
    expect(swapFor('player2_absent', { ...defaultSettings, absenceScoring: 'no_effect' })).toBe(
      false
    )
  })

  it('mirrors colors when the stronger player plays white', () => {
    const settings = { ...defaultSettings, weakerPlaysWhite: false }
    expect(swapFor('player1_win', settings)).toBe(true)
    expect(swapFor('player2_win', settings)).toBe(false)
    expect(swapFor('player2_absent', settings)).toBe(true)
    expect(swapFor('player1_absent', settings)).toBe(false)
  })
})

describe('generateRound', () => {
  it('builds the first round by last name and rests the last player when odd', () => {
    const result = generateRound({
      seq: 1,
      players: players([3, 1, 2]),
      prevRound: null
    })

    expect(result).toEqual({
      pairs: [
        { player1Id: 1, player2Id: 2 },
        { player1Id: 3, player2Id: 4 }
      ],
      restingPlayerId: 4
    })
  })

  it('pairs everyone in the first round when the count is even', () => {
    const result = generateRound({
      seq: 1,
      players: players([4, 3, 2, 1]),
      prevRound: null
    })

    expect(result.pairs).toEqual([
      { player1Id: 1, player2Id: 2 },
      { player1Id: 3, player2Id: 4 }
    ])
    expect(result.restingPlayerId).toBe(null)
  })

  it('drops the first player in an even round so the previous outsider plays', () => {
    const result = generateRound({
      seq: 2,
      players: players([1, 2, 3]),
      prevRound: {
        seq: 1,
        settings: defaultSettings,
        pairs: [
          { player1Id: 1, player2Id: 2, result: 'player1_win' },
          { player1Id: 3, player2Id: 4, result: 'player2_win' }
        ]
      }
    })

    expect(result.pairs).toEqual([{ player1Id: 2, player2Id: 3 }])
    expect(result.restingPlayerId).toBe(1)
  })

  it('swaps pair slots according to the previous results and rules', () => {
    const result = generateRound({
      seq: 2,
      players: players([1, 2]),
      prevRound: {
        seq: 1,
        settings: defaultSettings,
        pairs: [{ player1Id: 1, player2Id: 2, result: 'player2_win' }]
      }
    })

    expect(result.pairs).toEqual([{ player1Id: 2, player2Id: 1 }])
    expect(result.restingPlayerId).toBe(null)
  })

  it('keeps the previous resting player in place', () => {
    const result = generateRound({
      seq: 3,
      players: players([1, 2, 3]),
      prevRound: {
        seq: 2,
        settings: defaultSettings,
        pairs: [{ player1Id: 2, player2Id: 3, result: 'draw' }]
      }
    })

    expect(result.pairs).toEqual([{ player1Id: 2, player2Id: 3 }])
    expect(result.restingPlayerId).toBe(1)
  })
})
