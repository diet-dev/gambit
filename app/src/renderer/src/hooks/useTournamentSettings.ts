import { useCallback, useEffect, useState } from 'react'
import type {
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'

export function useTournamentSettings(): {
  settings: TournamentSettingsWithUsage[]
  create: (input: TournamentSettingsInput) => Promise<void>
  update: (id: number, input: TournamentSettingsInput) => Promise<void>
  remove: (id: number) => Promise<void>
} {
  const [settings, setSettings] = useState<TournamentSettingsWithUsage[]>([])

  const reload = useCallback(async () => {
    const api = window.api?.tournament?.settings
    if (!api) {
      return
    }
    setSettings(await api.list())
  }, [])

  useEffect(() => {
    const api = window.api?.tournament?.settings
    if (!api) {
      return
    }
    let active = true
    api.list().then((value) => {
      if (active) {
        setSettings(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const create = useCallback(
    async (input: TournamentSettingsInput) => {
      await window.api?.tournament?.settings.create(input)
      await reload()
    },
    [reload]
  )

  const update = useCallback(
    async (id: number, input: TournamentSettingsInput) => {
      await window.api?.tournament?.settings.update(id, input)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (id: number) => {
      await window.api?.tournament?.settings.remove(id)
      await reload()
    },
    [reload]
  )

  return { settings, create, update, remove }
}
