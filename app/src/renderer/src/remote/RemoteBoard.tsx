import { Chessboard } from 'react-chessboard'
import { useRemoteSocket } from './useRemoteSocket'

function RemoteBoard(): React.JSX.Element {
  const { position, onPieceDrop } = useRemoteSocket()

  return (
    <div className="remote-board">
      <Chessboard options={{ position, onPieceDrop }} />
    </div>
  )
}

export default RemoteBoard
