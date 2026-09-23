import { useCallback, useState } from 'react'
import { Chess, type Color, type Square } from 'chess.js'

type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

type SquareClickArgs = {
  square: string
}

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

type UseChessGame = {
  position: string
  selectedSquare: string | null
  possibleMoves: PossibleMove[]
  checkedSquare: string | null
  status: GameStatus
  onPieceDrop: (args: PieceDropArgs) => boolean
  onSquareClick: (args: SquareClickArgs) => void
  playMove: (args: { from: string; to: string; promotion?: string }) => boolean
}

function legalMovesFrom(game: Chess, square: string): PossibleMove[] {
  return game.moves({ square: square as Square, verbose: true }).map((move) => ({
    square: move.to,
    isCapture: move.isCapture()
  }))
}

function kingSquareInCheck(game: Chess): string | null {
  if (!game.isCheck()) {
    return null
  }

  return game.findPiece({ type: 'k', color: game.turn() })[0] ?? null
}

function statusOf(game: Chess): GameStatus {
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

export function useChessGame(initialPosition?: string): UseChessGame {
  const [game] = useState(() => new Chess(initialPosition))
  const [position, setPosition] = useState(() => game.fen())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<PossibleMove[]>([])
  const [checkedSquare, setCheckedSquare] = useState<string | null>(() => kingSquareInCheck(game))
  const [status, setStatus] = useState<GameStatus>(() => statusOf(game))

  const clearSelection = useCallback((): void => {
    setSelectedSquare(null)
    setPossibleMoves([])
  }, [])

  const applyMove = useCallback(
    (sourceSquare: string, targetSquare: string, promotion = 'q'): boolean => {
      try {
        game.move({ from: sourceSquare, to: targetSquare, promotion })
      } catch {
        return false
      }

      setPosition(game.fen())
      setCheckedSquare(kingSquareInCheck(game))
      setStatus(statusOf(game))
      clearSelection()
      return true
    },
    [game, clearSelection]
  )

  const onSquareClick = useCallback(
    ({ square }: SquareClickArgs): void => {
      if (selectedSquare && possibleMoves.some((move) => move.square === square)) {
        applyMove(selectedSquare, square)
        return
      }

      const moves = legalMovesFrom(game, square)
      if (moves.length === 0) {
        clearSelection()
        return
      }

      setSelectedSquare(square)
      setPossibleMoves(moves)
    },
    [game, selectedSquare, possibleMoves, applyMove, clearSelection]
  )

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropArgs): boolean => {
      if (!targetSquare) {
        return false
      }

      return applyMove(sourceSquare, targetSquare)
    },
    [applyMove]
  )

  const playMove = useCallback(
    ({ from, to, promotion }: { from: string; to: string; promotion?: string }): boolean =>
      applyMove(from, to, promotion),
    [applyMove]
  )

  return {
    position,
    selectedSquare,
    possibleMoves,
    checkedSquare,
    status,
    onPieceDrop,
    onSquareClick,
    playMove
  }
}
