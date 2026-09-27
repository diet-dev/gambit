import type { DatabaseSync } from 'node:sqlite'
import { isValidGroupName } from '../shared/groupName'
import type { Group, GroupInput } from '../shared/groups'

export type GroupStore = {
  list: () => Group[]
  create: (input: GroupInput) => Group
  update: (group: Group) => Group
  remove: (id: number) => void
}

const COLUMNS = 'id, name, comment'

function assertValidName(name: string): void {
  if (!isValidGroupName(name)) {
    throw new Error('Некорректное имя группы')
  }
}

export function createGroupStore(database: DatabaseSync): GroupStore {
  function get(id: number): Group {
    return database
      .prepare(`SELECT ${COLUMNS} FROM groups WHERE id = ?`)
      .get(id) as unknown as Group
  }

  return {
    list: () =>
      database
        .prepare(`SELECT ${COLUMNS} FROM groups ORDER BY name COLLATE NOCASE`)
        .all() as unknown as Group[],
    create: (input) => {
      assertValidName(input.name)
      const info = database
        .prepare('INSERT INTO groups (name, comment) VALUES (?, ?)')
        .run(input.name, input.comment)
      return get(Number(info.lastInsertRowid))
    },
    update: (group) => {
      assertValidName(group.name)
      database
        .prepare('UPDATE groups SET name = ?, comment = ? WHERE id = ?')
        .run(group.name, group.comment, group.id)
      return get(group.id)
    },
    remove: (id) => {
      database.prepare('DELETE FROM groups WHERE id = ?').run(id)
    }
  }
}
