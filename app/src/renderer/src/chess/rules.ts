import { Chess, type Color, type Square } from 'chess.js'

export type PossibleMove = {
  square: string
  isCapture: boolean
}

export type GameStatus =
  | { kind: 'turn'; turn: Color }
  | { kind: 'check'; turn: Color }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: 'insufficient-material' | 'threefold-repetition' | 'fifty-moves' }

export function legalMovesFrom(game: Chess, square: string): PossibleMove[] {
  return game.moves({ square: square as Square, verbose: true }).map((move) => ({
    square: move.to,
    isCapture: move.isCapture()
  }))
}

export function kingSquareInCheck(game: Chess): string | null {
  if (!game.isCheck()) {
    return null
  }

  return game.findPiece({ type: 'k', color: game.turn() })[0] ?? null
}

export function statusOf(game: Chess): GameStatus {
  const turn = game.turn()

  if (game.isCheckmate()) {
    return { kind: 'checkmate', winner: turn === 'w' ? 'b' : 'w' }
  }
  if (game.isStalemate()) {
    return { kind: 'stalemate' }
  }
  if (game.isInsufficientMaterial()) {
    return { kind: 'draw', reason: 'insufficient-material' }
  }
  if (game.isThreefoldRepetition()) {
    return { kind: 'draw', reason: 'threefold-repetition' }
  }
  if (game.isDrawByFiftyMoves()) {
    return { kind: 'draw', reason: 'fifty-moves' }
  }
  if (game.isCheck()) {
    return { kind: 'check', turn }
  }

  return { kind: 'turn', turn }
}
