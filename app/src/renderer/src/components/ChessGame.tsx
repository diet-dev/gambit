import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { useChessGame } from '../hooks/useChessGame'
import { useEngineOpponent } from '../hooks/useEngineOpponent'
import { useRemoteBridge } from '../hooks/useRemoteBridge'
import { squareStylesFor, statusBarClassName, statusText } from '../chess/presentation'

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
    onSquareClick,
    playMove
  } = useChessGame(initialPosition)
  const [botEnabled, setBotEnabled] = useState(false)

  const turn = status.kind === 'turn' || status.kind === 'check' ? status.turn : null
  const { isThinking } = useEngineOpponent({
    enabled: botEnabled,
    fen: position,
    turn,
    isGameOver: turn === null,
    playMove
  })

  useRemoteBridge({ position, playMove })

  const squareStyles = squareStylesFor({ selectedSquare, possibleMoves, checkedSquare })

  return (
    <div className="chess-game">
      <div className="board">
        <div className="board-square">
          <Chessboard options={{ position, onPieceDrop, onSquareClick, squareStyles }} />
        </div>
      </div>
      <div className="controls">
        <label className="bot-toggle">
          <input
            type="checkbox"
            checked={botEnabled}
            onChange={(event) => setBotEnabled(event.target.checked)}
          />
          Играть с ботом
        </label>
      </div>
      <div className={statusBarClassName(status)}>
        {isThinking ? 'Бот думает…' : statusText(status)}
      </div>
    </div>
  )
}

export default ChessGame
