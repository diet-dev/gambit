import { useCallback, useEffect, useState } from 'react'
import type { Tournament, TournamentInput } from '../../../shared/tournament'

export function useTournaments(): {
  tournaments: Tournament[]
  create: (input: TournamentInput) => Promise<void>
  update: (id: number, input: TournamentInput) => Promise<void>
  remove: (id: number) => Promise<void>
} {
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  const reload = useCallback(async () => {
    const api = window.api?.tournament?.tournaments
    if (!api) {
      return
    }
    setTournaments(await api.list())
  }, [])

  useEffect(() => {
    const api = window.api?.tournament?.tournaments
    if (!api) {
      return
    }
    let active = true
    api.list().then((value) => {
      if (active) {
        setTournaments(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const create = useCallback(
    async (input: TournamentInput) => {
      await window.api?.tournament?.tournaments.create(input)
      await reload()
    },
    [reload]
  )

  const update = useCallback(
    async (id: number, input: TournamentInput) => {
      await window.api?.tournament?.tournaments.update(id, input)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (id: number) => {
      await window.api?.tournament?.tournaments.remove(id)
      await reload()
    },
    [reload]
  )

  return { tournaments, create, update, remove }
}
