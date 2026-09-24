import { useCallback, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { useChessGame, type MoveInfo } from '../hooks/useChessGame'
import { useEngineOpponent } from '../hooks/useEngineOpponent'
import { useRemoteBridge } from '../hooks/useRemoteBridge'
import type { EventOrigin } from '../events'
import { squareStylesFor, statusBarClassName, statusText } from '../chess/presentation'

type ChessGameProps = {
  initialPosition?: string
  onMove?: (move: MoveInfo, origin: EventOrigin) => void
}

function ChessGame({ initialPosition, onMove }: ChessGameProps): React.JSX.Element {
  const {
    position,
    selectedSquare,
    possibleMoves,
    checkedSquare,
    status,
    onPieceDrop,
    onSquareClick,
    playMove
  } = useChessGame(initialPosition, onMove)
  const [botEnabled, setBotEnabled] = useState(false)

  const turn = status.kind === 'turn' || status.kind === 'check' ? status.turn : null
  const { isThinking } = useEngineOpponent({
    enabled: botEnabled,
    fen: position,
    turn,
    isGameOver: turn === null,
    playMove
  })

  const playRemoteMove = useCallback((move: MoveInfo) => playMove(move, 'remote'), [playMove])

  useRemoteBridge({ position, playMove: playRemoteMove })

  const squareStyles = squareStylesFor({ selectedSquare, possibleMoves, checkedSquare, status })

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
