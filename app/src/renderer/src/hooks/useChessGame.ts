import { useCallback, useState } from 'react'
import { Chess } from 'chess.js'

type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

type UseChessGame = {
  position: string
  onPieceDrop: (args: PieceDropArgs) => boolean
}

export function useChessGame(initialPosition?: string): UseChessGame {
  const [game] = useState(() => new Chess(initialPosition))
  const [position, setPosition] = useState(() => game.fen())

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropArgs): boolean => {
      if (!targetSquare) {
        return false
      }

      try {
        game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      } catch {
        return false
      }

      setPosition(game.fen())
      return true
    },
    [game]
  )

  return { position, onPieceDrop }
}
