import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { DEFAULT_SITUATION_ID, SITUATION_GROUPS, findSituation } from './situations'

const allSituations = SITUATION_GROUPS.flatMap((group) => group.situations)

describe('situations data', () => {
  it('has unique ids', () => {
    const ids = allSituations.map((situation) => situation.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every situation a title, a description and a valid FEN', () => {
    for (const situation of allSituations) {
      expect(situation.title.length).toBeGreaterThan(0)
      expect(situation.description.length).toBeGreaterThan(0)
      expect(() => new Chess(situation.fen)).not.toThrow()
    }
  })

  it('starts with the classic opening position', () => {
    const first = allSituations[0]

    expect(first.id).toBe(DEFAULT_SITUATION_ID)
    expect(first.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(findSituation(DEFAULT_SITUATION_ID)).toBe(first)
  })

  it('includes a mate-in-one where a mating move exists', () => {
    const situation = findSituation('mate-in-one')!

    const game = new Chess(situation.fen)
    const mating = game.moves({ verbose: true }).some((move) => move.san.endsWith('#'))
    expect(mating).toBe(true)
  })

  it('includes checkmate demonstrations', () => {
    expect(new Chess(findSituation('fool-mate')!.fen).isCheckmate()).toBe(true)
    expect(new Chess(findSituation('legal-mate')!.fen).isCheckmate()).toBe(true)
  })

  it('includes a stalemate demonstration', () => {
    expect(new Chess(findSituation('stalemate')!.fen).isStalemate()).toBe(true)
  })

  it('includes a castling demonstration where castling is legal', () => {
    const game = new Chess(findSituation('castling')!.fen)

    expect(game.moves()).toContain('O-O')
  })

  it('includes an en passant demonstration where the capture is legal', () => {
    const game = new Chess(findSituation('en-passant')!.fen)

    expect(game.moves()).toContain('exd6')
  })

  it('includes a promotion demonstration', () => {
    const game = new Chess(findSituation('promotion')!.fen)

    expect(game.moves({ verbose: true }).some((move) => move.promotion === 'q')).toBe(true)
  })

  it('includes a knight fork that gives check', () => {
    const game = new Chess(findSituation('knight-fork')!.fen)

    game.move('Nc7+')
    expect(game.isCheck()).toBe(true)
  })

  it('includes a discovered check where moving the bishop gives check', () => {
    const game = new Chess(findSituation('discovered-check')!.fen)

    game.move('Bc4+')
    expect(game.isCheck()).toBe(true)
  })
})
