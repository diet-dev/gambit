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

  it('includes a smothered mate', () => {
    const game = new Chess(findSituation('smothered-mate')!.fen)

    expect(game.moves()).toContain('Nf7#')
  })

  it('includes a ladder mate with two rooks', () => {
    const game = new Chess(findSituation('ladder-mate')!.fen)

    expect(game.moves()).toContain('Rb8#')
  })

  it('includes a draw by insufficient material', () => {
    const game = new Chess(findSituation('insufficient-material')!.fen)

    expect(game.isInsufficientMaterial()).toBe(true)
    expect(game.isDraw()).toBe(true)
  })

  it('includes a double check given by two pieces at once', () => {
    const game = new Chess(findSituation('double-check')!.fen)

    game.move('Nf7+')
    expect(game.isCheck()).toBe(true)
    expect(game.attackers('h8', 'w')).toHaveLength(2)
  })

  it('includes a skewer that wins the piece behind the king', () => {
    const game = new Chess(findSituation('skewer')!.fen)

    game.move('Ra1+')
    expect(game.isCheck()).toBe(true)
    game.move('Kb6')
    expect(game.moves()).toContain('Rxa8')
  })

  it('includes a discovered attack that is not a check', () => {
    const game = new Chess(findSituation('discovered-attack')!.fen)

    game.move('Nf5')
    expect(game.isCheck()).toBe(false)
    expect(game.isAttacked('h8', 'w')).toBe(true)
  })

  it('includes a pawn fork', () => {
    const game = new Chess(findSituation('pawn-fork')!.fen)

    game.move('c4')
    expect(game.isAttacked('b5', 'w')).toBe(true)
    expect(game.isAttacked('d5', 'w')).toBe(true)
  })

  it('includes a centre-control opening position', () => {
    const game = new Chess(findSituation('center-control')!.fen)

    expect(game.get('e4')?.type).toBe('p')
    expect(game.get('e5')?.type).toBe('p')
  })

  it('includes a piece-development opening position', () => {
    const game = new Chess(findSituation('piece-development')!.fen)

    expect(game.get('f3')?.type).toBe('n')
    expect(game.get('c4')?.type).toBe('b')
    expect(game.get('c6')?.type).toBe('n')
    expect(game.get('f6')?.type).toBe('n')
  })

  it('has no duplicate positions', () => {
    const fens = allSituations.map((situation) => situation.fen)

    expect(new Set(fens).size).toBe(fens.length)
  })
})
