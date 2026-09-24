import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { DEFAULT_SITUATION_ID, SITUATION_GROUPS, findSituation } from './situations'

const allSituations = SITUATION_GROUPS.flatMap((group) => group.situations)

function newGame(id: string): Chess {
  return new Chess(findSituation(id)!.fen)
}

function squaresOf(game: Chess, color: 'w' | 'b', type: string): string[] {
  return game
    .board()
    .flat()
    .filter((square) => square && square.color === color && square.type === type)
    .map((square) => square!.square)
}

describe('situations data', () => {
  it('has unique ids', () => {
    const ids = allSituations.map((situation) => situation.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every situation a title, a description, a comment and a valid FEN', () => {
    for (const situation of allSituations) {
      expect(situation.title.length).toBeGreaterThan(0)
      expect(situation.description.length).toBeGreaterThan(0)
      expect(situation.comment.length).toBeGreaterThan(0)
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

describe('endgame situations', () => {
  it('shows the rule of the square with a pawn on b6', () => {
    const game = newGame('eg-square-rule')

    expect(game.get('b6')?.type).toBe('p')
    expect(game.turn()).toBe('b')
  })

  it('shows the opposition with kings facing each other', () => {
    const game = newGame('eg-opposition')

    expect(game.get('f6')?.type).toBe('k')
    expect(game.get('f8')?.type).toBe('k')
    expect(game.turn()).toBe('b')
  })

  it('demonstrates the queen and king mate', () => {
    expect(newGame('eg-queen-mate').moves()).toContain('Qg7#')
  })

  it('demonstrates the rook and king mate', () => {
    expect(newGame('eg-rook-mate').moves()).toContain('Rh8#')
  })

  it('shows a protected passed pawn', () => {
    const game = newGame('eg-protected-passer')

    expect(game.get('b5')?.type).toBe('p')
    expect(game.get('c4')?.type).toBe('p')
  })

  it('shows an outside passed pawn far from the kings', () => {
    expect(newGame('eg-outside-passer').get('a4')?.type).toBe('p')
  })

  it('shows an active central king', () => {
    expect(newGame('eg-active-king').get('d4')?.type).toBe('k')
  })

  it('shows a pawn race where the first pawn queens', () => {
    const game = newGame('eg-pawn-race')
    game.move('a5')
    game.move('g4')
    game.move('a6')
    game.move('g3')
    game.move('a7')
    game.move('g2')

    expect(game.moves()).toContain('a8=Q')
  })

  it('shows connected pawns on c3, d4 and e5', () => {
    const game = newGame('eg-connected-pawns')

    expect([game.get('c3')?.type, game.get('d4')?.type, game.get('e5')?.type]).toEqual([
      'p',
      'p',
      'p'
    ])
  })
})

describe('strategy situations', () => {
  it('shows an open file without pawns', () => {
    const game = newGame('str-open-file')

    expect([...squaresOf(game, 'w', 'p'), ...squaresOf(game, 'b', 'p')]).not.toContain('d2')
    expect(squaresOf(game, 'w', 'p').some((square) => square[0] === 'd')).toBe(false)
    expect(squaresOf(game, 'b', 'p').some((square) => square[0] === 'd')).toBe(false)
  })

  it('shows a semi-open file for white', () => {
    const game = newGame('str-semi-open')

    expect(squaresOf(game, 'w', 'p').some((square) => square[0] === 'c')).toBe(false)
    expect(game.get('c7')).toMatchObject({ color: 'b', type: 'p' })
  })

  it('shows an outposted knight protected by a pawn', () => {
    const game = newGame('str-outpost')

    expect(game.get('d5')).toMatchObject({ color: 'w', type: 'n' })
    expect(game.get('c4')).toMatchObject({ color: 'w', type: 'p' })
    expect(squaresOf(game, 'b', 'p').some((square) => ['c6', 'e6', 'd6'].includes(square))).toBe(
      false
    )
  })

  it('shows an isolated pawn without neighbours', () => {
    const game = newGame('str-isolated-pawn')
    const files = squaresOf(game, 'w', 'p').map((square) => square[0])

    expect(game.get('d4')).toMatchObject({ color: 'w', type: 'p' })
    expect(files).not.toContain('c')
    expect(files).not.toContain('e')
  })

  it('shows doubled pawns on the c-file', () => {
    const cPawns = squaresOf(newGame('str-doubled-pawns'), 'w', 'p').filter(
      (square) => square[0] === 'c'
    )

    expect(cPawns).toHaveLength(2)
  })

  it('shows the bishop pair against two knights', () => {
    const game = newGame('str-bishop-pair')

    expect(squaresOf(game, 'w', 'b')).toHaveLength(2)
    expect(squaresOf(game, 'b', 'b')).toHaveLength(0)
  })

  it('shows a pawn chain c3-d4-e5', () => {
    const game = newGame('str-pawn-chain')

    expect([game.get('c3')?.type, game.get('d4')?.type, game.get('e5')?.type]).toEqual([
      'p',
      'p',
      'p'
    ])
  })
})

describe('opening situations', () => {
  it('shows the Italian game position', () => {
    const game = newGame('op-italian')

    expect(game.get('c4')).toMatchObject({ color: 'w', type: 'b' })
    expect(game.get('f3')).toMatchObject({ color: 'w', type: 'n' })
  })

  it('shows the Spanish bishop on a4 after a6', () => {
    expect(newGame('op-ruy-lopez').get('a4')).toMatchObject({ color: 'w', type: 'b' })
  })

  it('shows the Queen gambit pawns on d4 and c4', () => {
    const game = newGame('op-queens-gambit')

    expect(game.get('d4')).toMatchObject({ color: 'w', type: 'p' })
    expect(game.get('c4')).toMatchObject({ color: 'w', type: 'p' })
  })

  it('shows the Sicilian structure', () => {
    const game = newGame('op-sicilian')

    expect(game.get('f6')).toMatchObject({ color: 'b', type: 'n' })
    expect(game.get('d6')).toMatchObject({ color: 'b', type: 'p' })
  })

  it('shows the French pawn chain', () => {
    const game = newGame('op-french')

    expect(game.get('e5')).toMatchObject({ color: 'w', type: 'p' })
    expect(game.get('d5')).toMatchObject({ color: 'b', type: 'p' })
    expect(game.get('e6')).toMatchObject({ color: 'b', type: 'p' })
  })

  it('shows the Evans gambit with the bishop on a5', () => {
    const game = newGame('op-evans')

    expect(game.get('a5')).toMatchObject({ color: 'b', type: 'b' })
    expect(game.get('b4')).toBeUndefined()
  })

  it('shows the King gambit with the f4 pawn captured', () => {
    expect(newGame('op-kings-gambit').get('f4')).toMatchObject({ color: 'b', type: 'p' })
  })

  it('shows the Four knights development', () => {
    const game = newGame('op-four-knights')

    expect([game.get('c3')?.type, game.get('f3')?.type]).toEqual(['n', 'n'])
    expect([game.get('c6')?.type, game.get('f6')?.type]).toEqual(['n', 'n'])
  })

  it('shows the Philidor knight on d4', () => {
    expect(newGame('op-philidor').get('d4')).toMatchObject({ color: 'w', type: 'n' })
  })

  it('shows the Caro-Kann bishop developed to f5', () => {
    const game = newGame('op-caro-kann')

    expect(game.get('f5')).toMatchObject({ color: 'b', type: 'b' })
    expect(game.get('e4')).toMatchObject({ color: 'w', type: 'n' })
  })
})

describe('mistake situations', () => {
  it('shows a back-rank mate', () => {
    expect(newGame('err-back-rank').moves()).toContain('Re8#')
  })

  it("shows the scholar's mate on f7", () => {
    expect(newGame('err-f7-weakness').moves()).toContain('Qxf7#')
  })

  it('shows an early queen attacked by a pawn', () => {
    const game = newGame('err-queen-early')

    expect(game.isAttacked('h5', 'b')).toBe(true)
  })

  it('shows a hanging piece punished by a fork', () => {
    expect(newGame('err-hanging-fork').moves()).toContain('Nc2+')
  })

  it('shows greed punished by an attack', () => {
    const game = newGame('err-greedy-knight')

    expect(game.isCheck()).toBe(true)
    expect(game.get('e4')).toMatchObject({ color: 'b', type: 'q' })
  })

  it('shows the Nxf7 blow after a greedy capture', () => {
    expect(newGame('err-ignored-sacrifice').moves()).toContain('Nxf7')
  })

  it('shows a greedy queen punished by mate', () => {
    expect(newGame('err-greedy-queen').isCheckmate()).toBe(true)
  })

  it('shows a king caught in the centre after a check', () => {
    const game = newGame('err-king-in-center')

    expect(game.get('b4')).toMatchObject({ color: 'b', type: 'b' })
    expect(game.get('e4')).toMatchObject({ color: 'b', type: 'n' })
  })

  it('shows a bishop double attack on two rooks', () => {
    const game = newGame('err-bishop-double-attack')
    game.move('Be2')

    expect(game.isAttacked('d1', 'w')).toBe(true)
    expect(game.isAttacked('f1', 'w')).toBe(true)
  })

  it('shows a missed mate in one', () => {
    expect(newGame('err-missed-mate').moves()).toContain('Nf2#')
  })
})

describe('tactic situations', () => {
  it('shows a queen double attack with check', () => {
    const game = newGame('tac-queen-fork')

    expect(game.moves()).toContain('Qb3+')
    game.move('Qb3+')
    expect(game.isCheck()).toBe(true)
    expect(game.isAttacked('f7', 'w')).toBe(true)
  })

  it('shows a bishop double attack with check', () => {
    const game = newGame('tac-bishop-fork')

    expect(game.moves()).toContain('Bd5+')
    game.move('Bd5+')
    expect(game.isCheck()).toBe(true)
    expect(game.isAttacked('h1', 'w')).toBe(true)
  })

  it('shows a rook double attack with check', () => {
    const game = newGame('tac-rook-fork')

    expect(game.moves()).toContain('Re8+')
    game.move('Re8+')
    expect(game.isCheck()).toBe(true)
    expect(game.isAttacked('a8', 'w')).toBe(true)
  })

  it('shows a knight fork on two rooks', () => {
    const game = newGame('tac-knight-fork')
    game.move('Nc7')

    expect(game.isAttacked('a8', 'w')).toBe(true)
    expect(game.isAttacked('e8', 'w')).toBe(true)
  })

  it('shows a queen double attack without check', () => {
    const game = newGame('tac-queen-double')
    game.move('Qd4')

    expect(game.isCheck()).toBe(false)
    expect(game.isAttacked('a7', 'w')).toBe(true)
    expect(game.isAttacked('h8', 'w')).toBe(true)
  })

  it('shows a decoy leading to a smothered mate', () => {
    const game = newGame('tac-decoy')
    game.move('Qg8+')
    game.move('Rxg8')
    game.move('Nf7#')

    expect(game.isCheckmate()).toBe(true)
  })

  it('shows an in-between check before the recapture', () => {
    const game = newGame('tac-zwischenzug')
    game.move('Bxh7+')
    game.move('Kxh7')
    game.move('Rxb4')

    expect(game.get('b4')).toMatchObject({ color: 'w', type: 'r' })
  })

  it('shows an x-ray bishop winning a rook', () => {
    const game = newGame('tac-xray')
    game.move('Bxg7+')

    expect(game.isCheck()).toBe(true)
    expect(() => game.move('Kxg7')).toThrow()
  })

  it('shows the Greek gift sacrifice on h7', () => {
    const game = newGame('tac-greek-gift')
    game.move('Bxh7+')
    game.move('Kxh7')
    game.move('Ng5+')
    game.move('Kg8')
    game.move('Qh5')

    expect(game.get('h5')).toMatchObject({ color: 'w', type: 'q' })
  })

  it('shows a trapped knight in the corner', () => {
    const game = newGame('tac-trap-piece')

    expect(game.moves({ square: 'a8' })).toEqual(expect.arrayContaining(['Nc7', 'Nxb6']))
  })
})
