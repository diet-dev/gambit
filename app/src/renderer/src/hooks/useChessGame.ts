import { useCallback, useState } from 'react'
import { Chess, type Square } from 'chess.js'

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

type UseChessGame = {
  position: string
  selectedSquare: string | null
  possibleMoves: PossibleMove[]
  checkedSquare: string | null
  onPieceDrop: (args: PieceDropArgs) => boolean
  onSquareClick: (args: SquareClickArgs) => void
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

export function useChessGame(initialPosition?: string): UseChessGame {
  const [game] = useState(() => new Chess(initialPosition))
  const [position, setPosition] = useState(() => game.fen())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<PossibleMove[]>([])
  const [checkedSquare, setCheckedSquare] = useState<string | null>(() => kingSquareInCheck(game))

  const clearSelection = useCallback((): void => {
    setSelectedSquare(null)
    setPossibleMoves([])
  }, [])

  const applyMove = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      try {
        game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      } catch {
        return false
      }

      setPosition(game.fen())
      setCheckedSquare(kingSquareInCheck(game))
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

  return {
    position,
    selectedSquare,
    possibleMoves,
    checkedSquare,
    onPieceDrop,
    onSquareClick
  }
}
