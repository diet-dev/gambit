import type { DatabaseSync } from 'node:sqlite'
import type { Student, StudentInput } from '../shared/students'

export type StudentStore = {
  list: () => Student[]
  create: (input: StudentInput) => Student
  update: (student: Student) => Student
  remove: (id: number) => void
}

const COLUMNS =
  'id, last_name AS lastName, first_name AS firstName, middle_name AS middleName, class_name AS className, rating'

export function createStudentStore(database: DatabaseSync): StudentStore {
  function get(id: number): Student {
    return database
      .prepare(`SELECT ${COLUMNS} FROM students WHERE id = ?`)
      .get(id) as unknown as Student
  }

  return {
    list: () =>
      database
        .prepare(
          `SELECT ${COLUMNS} FROM students ORDER BY last_name COLLATE NOCASE, first_name COLLATE NOCASE`
        )
        .all() as unknown as Student[],
    create: (input) => {
      const info = database
        .prepare(
          'INSERT INTO students (last_name, first_name, middle_name, class_name, rating) VALUES (?, ?, ?, ?, ?)'
        )
        .run(input.lastName, input.firstName, input.middleName, input.className, input.rating)
      return get(Number(info.lastInsertRowid))
    },
    update: (student) => {
      database
        .prepare(
          'UPDATE students SET last_name = ?, first_name = ?, middle_name = ?, class_name = ?, rating = ? WHERE id = ?'
        )
        .run(
          student.lastName,
          student.firstName,
          student.middleName,
          student.className,
          student.rating,
          student.id
        )
      return get(student.id)
    },
    remove: (id) => {
      database.prepare('DELETE FROM students WHERE id = ?').run(id)
    }
  }
}
