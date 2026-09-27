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
      const group = get(id)
      const soleOwner = database
        .prepare(
          `
          SELECT p.last_name AS lastName, p.first_name AS firstName
          FROM players p
          WHERE EXISTS (
            SELECT 1 FROM group_memberships m WHERE m.player_id = p.id AND m.group_id = ?
          )
          AND NOT EXISTS (
            SELECT 1 FROM group_memberships m2 WHERE m2.player_id = p.id AND m2.group_id <> ?
          )
          LIMIT 1
          `
        )
        .get(id, id) as { lastName: string; firstName: string } | undefined
      if (soleOwner) {
        const playerName = [soleOwner.lastName, soleOwner.firstName].filter(Boolean).join(' ')
        throw new Error(
          `Нельзя удалить группу «${group.name}»: она единственная для игрока ${playerName}`
        )
      }
      const tournament = database
        .prepare('SELECT name FROM tournaments WHERE group_id = ? LIMIT 1')
        .get(id) as { name: string } | undefined
      if (tournament) {
        throw new Error(`Нельзя удалить группу «${group.name}»: в ней есть турниры`)
      }
      database.prepare('DELETE FROM groups WHERE id = ?').run(id)
    }
  }
}
