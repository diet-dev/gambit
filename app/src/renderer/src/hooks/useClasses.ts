import { useCallback, useEffect, useState } from 'react'
import type { ClassInput, SchoolClass } from '../../../shared/classes'

export function useClasses(): {
  classes: SchoolClass[]
  create: (input: ClassInput) => Promise<void>
  update: (schoolClass: SchoolClass) => Promise<void>
  remove: (id: number) => Promise<void>
} {
  const [classes, setClasses] = useState<SchoolClass[]>([])

  const reload = useCallback(async () => {
    const api = window.api?.classes
    if (!api) {
      return
    }
    setClasses(await api.list())
  }, [])

  useEffect(() => {
    const api = window.api?.classes
    if (!api) {
      return
    }
    let active = true
    api.list().then((value) => {
      if (active) {
        setClasses(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const create = useCallback(
    async (input: ClassInput) => {
      await window.api?.classes?.create(input)
      await reload()
    },
    [reload]
  )

  const update = useCallback(
    async (schoolClass: SchoolClass) => {
      await window.api?.classes?.update(schoolClass)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (id: number) => {
      await window.api?.classes?.remove(id)
      await reload()
    },
    [reload]
  )

  return { classes, create, update, remove }
}
