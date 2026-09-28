import { useEffect, useState } from 'react'
import type { SituationGroup } from '../../../shared/situations'

export function useSituations(): { groups: SituationGroup[] } {
  const [groups, setGroups] = useState<SituationGroup[]>([])

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
  }, [])

  return { groups }
}
