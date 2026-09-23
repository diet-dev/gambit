import { type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import { useChessGame, type GameStatus } from '../hooks/useChessGame'

function statusText(status: GameStatus): string {
  switch (status.kind) {
    case 'turn':
      return status.turn === 'w' ? 'Ход белых' : 'Ход чёрных'
    case 'check':
      return status.turn === 'w' ? 'Шах белым!' : 'Шах чёрным!'
    case 'checkmate':
      return status.winner === 'w' ? 'Мат! Победа белых' : 'Мат! Победа чёрных'
    case 'stalemate':
      return 'Пат — ничья'
    case 'draw':
      switch (status.reason) {
        case 'insufficient-material':
          return 'Ничья: недостаточно материала'
        case 'threefold-repetition':
          return 'Ничья: троекратное повторение'
        case 'fifty-moves':
          return 'Ничья: правило 50 ходов'
      }
  }
}

const SELECTED_SQUARE_STYLE: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 0, 0.4)'
}

const CHECKED_KING_STYLE: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, transparent 35%, rgba(255, 0, 0, 0.75) 65%, rgba(255, 0, 0, 0.75) 100%)'
}

function moveStyle(isCapture: boolean): CSSProperties {
  return {
    backgroundImage: isCapture
      ? 'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.2) 56%)'
      : 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 22%, transparent 23%)'
  }
}

type ChessGameProps = {
  initialPosition?: string
}

function ChessGame({ initialPosition }: ChessGameProps): React.JSX.Element {
  const {
    position,
    selectedSquare,
    possibleMoves,
    checkedSquare,
    status,
    onPieceDrop,
    onSquareClick
  } = useChessGame(initialPosition)

  const squareStyles: Record<string, CSSProperties> = {}
  if (selectedSquare) {
    squareStyles[selectedSquare] = SELECTED_SQUARE_STYLE
  }
  for (const move of possibleMoves) {
    squareStyles[move.square] = moveStyle(move.isCapture)
  }
  if (checkedSquare) {
    squareStyles[checkedSquare] = CHECKED_KING_STYLE
  }

  return (
    <div className="chess-game">
      <div className="board">
        <Chessboard options={{ position, onPieceDrop, onSquareClick, squareStyles }} />
      </div>
      <div className="status-bar">{statusText(status)}</div>
    </div>
  )
}

export default ChessGame
