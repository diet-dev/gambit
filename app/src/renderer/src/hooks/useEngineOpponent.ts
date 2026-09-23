import { useEffect, useRef, useState } from 'react'
import { getDefaultEngine } from '../engine/defaultEngine'
import { parseUciMove } from '../engine/uciMove'
import { type Engine } from '../engine/stockfish'

type PlayMove = (args: { from: string; to: string; promotion?: string }) => boolean

type UseEngineOpponentOptions = {
  enabled: boolean
  fen: string
  turn: 'w' | 'b' | null
  isGameOver: boolean
  playMove: PlayMove
  getEngine?: () => Engine
}

export function useEngineOpponent({
  enabled,
  fen,
  turn,
  isGameOver,
  playMove,
  getEngine = getDefaultEngine
}: UseEngineOpponentOptions): { isThinking: boolean } {
  const [isThinking, setIsThinking] = useState(false)
  const requestedFenRef = useRef<string | null>(null)
  const latestRef = useRef({ fen, enabled })
  // eslint-disable-next-line react-hooks/refs -- latest-value ref read from async callbacks
  latestRef.current = { fen, enabled }

  useEffect(() => {
    if (!enabled) {
      requestedFenRef.current = null
      return
    }

    if (isGameOver || turn !== 'b' || requestedFenRef.current === fen) {
      return
    }

    requestedFenRef.current = fen
    setIsThinking(true)

    let search: Promise<string>

    try {
      search = getEngine().findBestMove(fen)
    } catch {
      search = Promise.reject(new Error('Stockfish engine unavailable'))
    }

    search
      .then((uci) => {
        if (!latestRef.current.enabled || latestRef.current.fen !== fen) {
          return
        }

        const move = parseUciMove(uci)

        if (!move || !playMove(move)) {
          requestedFenRef.current = null
        }
      })
      .catch(() => {
        requestedFenRef.current = null
      })
      .finally(() => setIsThinking(false))
  }, [enabled, isGameOver, turn, fen, playMove, getEngine])

  return { isThinking }
}
