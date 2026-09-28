import { useCallback, useEffect, useState } from 'react'
import type { SituationGroup } from '../../../shared/situations'

export function useSituations(): { groups: SituationGroup[]; reload: () => void } {
  const [groups, setGroups] = useState<SituationGroup[]>([])
  const [reloadAt, setReloadAt] = useState(0)

  const reload = useCallback(() => setReloadAt((value) => value + 1), [])

  useEffect(() => {
    const api = window.api?.situations
    if (!api) {
      return
    }
    let active = true
    api.list().then((value) => {
      if (active) {
        setGroups(value)
      }
    })
    return () => {
      active = false
    }
  }, [reloadAt])

  return { groups, reload }
}
