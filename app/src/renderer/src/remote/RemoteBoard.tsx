import { Chessboard } from 'react-chessboard'
import { RotateCcw } from 'lucide-react'
import { squareStylesFor, statusBarClassName, statusText } from '../chess/presentation'
import { useRemoteSocket } from './useRemoteSocket'

function RemoteBoard(): React.JSX.Element {
  const {
    position,
    selectedSquare,
    possibleMoves,
    checkedSquare,
    status,
    onPieceDrop,
    onSquareClick
  } = useRemoteSocket()

  const squareStyles = squareStylesFor({ selectedSquare, possibleMoves, checkedSquare, status })

  return (
    <>
      <div className="remote-game">
        <div className={statusBarClassName(status)}>{statusText(status)}</div>
        <div className="remote-board-area">
          <div className="remote-board">
            <Chessboard options={{ position, onPieceDrop, onSquareClick, squareStyles }} />
          </div>
        </div>
      </div>
      <div className="orientation-guard">
        <RotateCcw className="orientation-guard-icon" size={72} aria-hidden="true" />
        <p className="orientation-guard-text">Поверните телефон вертикально</p>
      </div>
    </>
  )
}

export default RemoteBoard
