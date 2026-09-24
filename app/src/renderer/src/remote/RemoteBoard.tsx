import { Chessboard } from 'react-chessboard'
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

  const squareStyles = squareStylesFor({ selectedSquare, possibleMoves, checkedSquare })

  return (
    <div className="remote-game">
      <div className="remote-board-area">
        <div className="remote-board">
          <Chessboard options={{ position, onPieceDrop, onSquareClick, squareStyles }} />
        </div>
      </div>
      <div className={statusBarClassName(status)}>{statusText(status)}</div>
    </div>
  )
}

export default RemoteBoard
