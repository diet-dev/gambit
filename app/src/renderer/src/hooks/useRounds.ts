import { useCallback, useEffect, useState } from 'react'
import type { Round } from '../../../shared/tournament'

export function useRounds(tournamentId: number | null): {
  rounds: Round[]
  reload: () => Promise<void>
} {
  const [rounds, setRounds] = useState<Round[]>([])

  const reload = useCallback(async () => {
    const api = window.api?.tournament?.rounds
    if (!api || tournamentId === null) {
      return
    }
    setRounds(await api.list(tournamentId))
  }, [tournamentId])

  useEffect(() => {
    let active = true
    const load = async (): Promise<void> => {
      const api = window.api?.tournament?.rounds
      const value = tournamentId === null || !api ? [] : await api.list(tournamentId)
      if (active) {
        setRounds(value)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [tournamentId])

  return { rounds, reload }
}
