import { useEffect } from 'react'
import type { RemoteMove } from '../../../shared/remote'

type UseRemoteBridgeOptions = {
  position: string
  playMove: (move: RemoteMove) => boolean
}

export function useRemoteBridge({ position, playMove }: UseRemoteBridgeOptions): void {
  useEffect(() => {
    window.api?.remote?.publishPosition(position)
  }, [position])

  useEffect(() => {
    const api = window.api?.remote
    if (!api) {
      return
    }
    return api.onRemoteMove((move) => {
      playMove(move)
    })
  }, [playMove])
}
