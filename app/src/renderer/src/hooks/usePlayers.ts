import { useCallback, useEffect, useState } from 'react'
import type { Player, PlayerInput } from '../../../shared/players'

export function usePlayers(): {
  players: Player[]
  create: (input: PlayerInput) => Promise<void>
  update: (player: Player) => Promise<void>
  remove: (id: number) => Promise<void>
} {
  const [players, setPlayers] = useState<Player[]>([])

  const reload = useCallback(async () => {
    const api = window.api?.players
    if (!api) {
      return
    }
    setPlayers(await api.list())
  }, [])

  useEffect(() => {
    const api = window.api?.players
    if (!api) {
      return
    }
    let active = true
    api.list().then((value) => {
      if (active) {
        setPlayers(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const create = useCallback(
    async (input: PlayerInput) => {
      await window.api?.players?.create(input)
      await reload()
    },
    [reload]
  )

  const update = useCallback(
    async (player: Player) => {
      await window.api?.players?.update(player)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (id: number) => {
      await window.api?.players?.remove(id)
      await reload()
    },
    [reload]
  )

  return { players, create, update, remove }
}
