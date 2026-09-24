import { useCallback, useState } from 'react'
import { Chess } from 'chess.js'
import {
  kingSquareInCheck,
  legalMovesFrom,
  statusOf,
  type GameStatus,
  type PossibleMove
} from '../chess/rules'

export type { GameStatus, PossibleMove } from '../chess/rules'

type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

type SquareClickArgs = {
  square: string
}

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
