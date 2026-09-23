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
  const latestFenRef = useRef(fen)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    latestFenRef.current = fen
    enabledRef.current = enabled
  }, [fen, enabled])

  useEffect(() => {
    if (!enabled || isGameOver || turn !== 'b' || requestedFenRef.current === fen) {
      return
    }

    requestedFenRef.current = fen
    setIsThinking(true)

    getEngine()
      .findBestMove(fen)
      .then((uci) => {
        if (!enabledRef.current || latestFenRef.current !== fen) {
          return
        }

        const move = parseUciMove(uci)

        if (move) {
          playMove(move)
        }
      })
      .catch(() => undefined)
      .finally(() => setIsThinking(false))
  }, [enabled, isGameOver, turn, fen, playMove, getEngine])

  return { isThinking }
}
