import { useEffect, useRef } from 'react'
import type { RemoteMove } from '../../../shared/remote'

type UseRemoteBridgeOptions = {
  position: string
  playMove: (move: RemoteMove) => boolean
}

export function useRemoteBridge({ position, playMove }: UseRemoteBridgeOptions): void {
  const positionRef = useRef(position)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    window.api?.remote?.publishPosition(position)
  }, [position])

  useEffect(() => {
    const api = window.api?.remote
    if (!api) {
      return
    }
    return api.onRemoteMove((move) => {
      if (!playMove(move)) {
        api.publishPosition(positionRef.current)
      }
    })
  }, [playMove])
}
