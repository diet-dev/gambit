import { useCallback, useEffect, useState } from 'react'
import type { Student, StudentInput } from '../../../shared/students'

export function useStudents(): {
  students: Student[]
  create: (input: StudentInput) => Promise<void>
  update: (student: Student) => Promise<void>
  remove: (id: number) => Promise<void>
} {
  const [students, setStudents] = useState<Student[]>([])

  const reload = useCallback(async () => {
    const api = window.api?.students
    if (!api) {
      return
    }
    setStudents(await api.list())
  }, [])

  useEffect(() => {
    const api = window.api?.students
    if (!api) {
      return
    }
    let active = true
    api.list().then((value) => {
      if (active) {
        setStudents(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const create = useCallback(
    async (input: StudentInput) => {
      await window.api?.students?.create(input)
      await reload()
    },
    [reload]
  )

  const update = useCallback(
    async (student: Student) => {
      await window.api?.students?.update(student)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (id: number) => {
      await window.api?.students?.remove(id)
      await reload()
    },
    [reload]
  )

  return { students, create, update, remove }
}
