import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import {
  kingSquareInCheck,
  legalMovesFrom,
  statusOf,
  type GameStatus,
  type PossibleMove
} from '../chess/rules'

type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

type SquareClickArgs = {
  square: string
}

type UseRemoteSocket = {
  position: string
  selectedSquare: string | null
  possibleMoves: PossibleMove[]
  checkedSquare: string | null
  status: GameStatus
  onPieceDrop: (args: PieceDropArgs) => boolean
  onSquareClick: (args: SquareClickArgs) => void
}

function remoteSocketUrl(): string {
  const params = new URLSearchParams(window.location.search)
  const port = params.get('wsPort') ?? window.location.port
  return `ws://${window.location.hostname}:${port}/ws`
}

export function useRemoteSocket(): UseRemoteSocket {
  const gameRef = useRef(new Chess())
  const socketRef = useRef<WebSocket | null>(null)
  const [position, setPosition] = useState(() => new Chess().fen())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<PossibleMove[]>([])
  const [checkedSquare, setCheckedSquare] = useState<string | null>(null)
  const [status, setStatus] = useState<GameStatus>(() => statusOf(new Chess()))

  useEffect(() => {
    let socket: WebSocket | null = null
    let closed = false
    let attempt = 0
    let timer: number | undefined

    function connect(): void {
      socket = new WebSocket(remoteSocketUrl())
      socketRef.current = socket
      socket.onopen = () => {
        attempt = 0
      }
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as { type: string; fen?: string }
        if (message.type === 'position' && message.fen) {
          gameRef.current = new Chess(message.fen)
          setPosition(message.fen)
          setCheckedSquare(kingSquareInCheck(gameRef.current))
          setStatus(statusOf(gameRef.current))
          setSelectedSquare(null)
          setPossibleMoves([])
        }
      }
      socket.onclose = () => {
        if (closed) {
          return
        }
        attempt += 1
        timer = window.setTimeout(connect, Math.min(1000 * attempt, 5000))
      }
    }

    connect()

    return () => {
      closed = true
      if (timer) {
        window.clearTimeout(timer)
      }
      socket?.close()
    }
  }, [])

  const applyMove = useCallback((from: string, to: string): boolean => {
    try {
      gameRef.current.move({ from, to, promotion: 'q' })
    } catch {
      return false
    }
    setPosition(gameRef.current.fen())
    setCheckedSquare(kingSquareInCheck(gameRef.current))
    setStatus(statusOf(gameRef.current))
    setSelectedSquare(null)
    setPossibleMoves([])

    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'move', from, to, promotion: 'q' }))
    }
    return true
  }, [])

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropArgs): boolean => {
      if (!targetSquare) {
        return false
      }
      return applyMove(sourceSquare, targetSquare)
    },
    [applyMove]
  )

  const onSquareClick = useCallback(
    ({ square }: SquareClickArgs): void => {
      if (selectedSquare && possibleMoves.some((move) => move.square === square)) {
        applyMove(selectedSquare, square)
        return
      }

      const moves = legalMovesFrom(gameRef.current, square)
      if (moves.length === 0) {
        setSelectedSquare(null)
        setPossibleMoves([])
        return
      }

      setSelectedSquare(square)
      setPossibleMoves(moves)
    },
    [selectedSquare, possibleMoves, applyMove]
  )

  return {
    position,
    selectedSquare,
    possibleMoves,
    checkedSquare,
    status,
    onPieceDrop,
    onSquareClick
  }
}
