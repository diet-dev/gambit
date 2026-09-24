import { useCallback, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { useChessGame, type MoveInfo } from '../hooks/useChessGame'
import { useEngineOpponent } from '../hooks/useEngineOpponent'
import { useRemoteBridge } from '../hooks/useRemoteBridge'
import { getDefaultEngine } from '../engine/defaultEngine'
import { levelByIndex, loadLevelIndex, saveLevelIndex } from '../engine/levels'
import { type Engine } from '../engine/stockfish'
import type { EventOrigin } from '../events'
import { squareStylesFor, statusBarClassName, statusText } from '../chess/presentation'
import EngineControls from './EngineControls'

type ChessGameProps = {
  initialPosition?: string
  onMove?: (move: MoveInfo, origin: EventOrigin) => void
  getEngine?: () => Engine
}

function ChessGame({
  initialPosition,
  onMove,
  getEngine = getDefaultEngine
}: ChessGameProps): React.JSX.Element {
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
  const [level, setLevel] = useState(loadLevelIndex)

  const turn = status.kind === 'turn' || status.kind === 'check' ? status.turn : null
  const { isThinking } = useEngineOpponent({
    enabled: botEnabled,
    fen: position,
    turn,
    isGameOver: turn === null,
    playMove,
    getEngine
  })

  function configureStrength(index: number): void {
    void getEngine()
      .configureStrength(levelByIndex(index).elo)
      .catch(() => undefined)
  }

  function toggleBot(next: boolean): void {
    setBotEnabled(next)
    if (next) {
      configureStrength(level)
    }
  }

  function changeLevel(next: number): void {
    setLevel(next)
    saveLevelIndex(next)
    if (botEnabled) {
      configureStrength(next)
    }
  }

  const playRemoteMove = useCallback((move: MoveInfo) => playMove(move, 'remote'), [playMove])

  useRemoteBridge({ position, playMove: playRemoteMove })

  const squareStyles = squareStylesFor({ selectedSquare, possibleMoves, checkedSquare, status })

  return (
    <div className="chess-game">
      <div className={statusBarClassName(status)}>
        {isThinking ? 'Бот думает…' : statusText(status)}
      </div>
      <div className="board">
        <div className="board-square">
          <Chessboard options={{ position, onPieceDrop, onSquareClick, squareStyles }} />
        </div>
      </div>
      <div className="controls">
        <EngineControls
          enabled={botEnabled}
          level={level}
          onToggle={toggleBot}
          onLevelChange={changeLevel}
        />
      </div>
    </div>
  )
}

export default ChessGame
