import type { DatabaseSync } from 'node:sqlite'
import type { ClassInput, SchoolClass } from '../shared/classes'

export type ClassStore = {
  list: () => SchoolClass[]
  create: (input: ClassInput) => SchoolClass
  update: (schoolClass: SchoolClass) => SchoolClass
  remove: (id: number) => void
}

const COLUMNS = 'id, name, comment'

export function createClassStore(database: DatabaseSync): ClassStore {
  function get(id: number): SchoolClass {
    return database
      .prepare(`SELECT ${COLUMNS} FROM classes WHERE id = ?`)
      .get(id) as unknown as SchoolClass
  }

  return {
    list: () =>
      database
        .prepare(`SELECT ${COLUMNS} FROM classes ORDER BY name COLLATE NOCASE`)
        .all() as unknown as SchoolClass[],
    create: (input) => {
      const info = database
        .prepare('INSERT INTO classes (name, comment) VALUES (?, ?)')
        .run(input.name, input.comment)
      return get(Number(info.lastInsertRowid))
    },
    update: (schoolClass) => {
      database
        .prepare('UPDATE classes SET name = ?, comment = ? WHERE id = ?')
        .run(schoolClass.name, schoolClass.comment, schoolClass.id)
      return get(schoolClass.id)
    },
    remove: (id) => {
      database.prepare('UPDATE students SET class_id = NULL WHERE class_id = ?').run(id)
      database.prepare('DELETE FROM classes WHERE id = ?').run(id)
    }
  }
}
