import { Chessboard } from 'react-chessboard'
import { useChessGame } from '../hooks/useChessGame'

function ChessGame(): React.JSX.Element {
  const { position, onPieceDrop } = useChessGame()

  return (
    <div className="chess-game">
      <Chessboard options={{ position, onPieceDrop }} />
    </div>
  )
}

export default ChessGame
