import { useCallback, useEffect, useState } from 'react'
import type { Group, GroupInput } from '../../../shared/groups'

export function useGroups(): {
  groups: Group[]
  create: (input: GroupInput) => Promise<void>
  update: (group: Group) => Promise<void>
  remove: (id: number) => Promise<void>
} {
  const [groups, setGroups] = useState<Group[]>([])

  const reload = useCallback(async () => {
    const api = window.api?.groups
    if (!api) {
      return
    }
    setGroups(await api.list())
  }, [])

  useEffect(() => {
    const api = window.api?.groups
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

  const create = useCallback(
    async (input: GroupInput) => {
      await window.api?.groups?.create(input)
      await reload()
    },
    [reload]
  )

  const update = useCallback(
    async (group: Group) => {
      await window.api?.groups?.update(group)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (id: number) => {
      await window.api?.groups?.remove(id)
      await reload()
    },
    [reload]
  )

  return { groups, create, update, remove }
}
