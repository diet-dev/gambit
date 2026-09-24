import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'

type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

type UseRemoteSocket = {
  position: string
  onPieceDrop: (args: PieceDropArgs) => boolean
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

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropArgs): boolean => {
    if (!targetSquare) {
      return false
    }
    try {
      gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    } catch {
      return false
    }
    setPosition(gameRef.current.fen())
    socketRef.current?.send(
      JSON.stringify({ type: 'move', from: sourceSquare, to: targetSquare, promotion: 'q' })
    )
    return true
  }, [])

  return { position, onPieceDrop }
}
