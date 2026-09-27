import type { DatabaseSync } from 'node:sqlite'
import type { Player, PlayerInput } from '../shared/players'

export type PlayerStore = {
  list: () => Player[]
  create: (input: PlayerInput) => Player
  update: (player: Player) => Player
  remove: (id: number) => void
}

const COLUMNS = `
  p.id AS id,
  p.last_name AS lastName,
  p.first_name AS firstName,
  p.middle_name AS middleName,
  (SELECT GROUP_CONCAT(m.group_id) FROM group_memberships m WHERE m.player_id = p.id) AS groupIds,
  p.rating AS rating
`

function assertHasGroup(groupIds: number[]): void {
  if (groupIds.length === 0) {
    throw new Error('У игрока должна быть минимум одна группа')
  }
}

function mapRow(row: unknown): Player {
  const record = row as Omit<Player, 'groupIds'> & { groupIds: string | null }
  return {
    ...record,
    groupIds: record.groupIds === null ? [] : record.groupIds.split(',').map(Number)
  }
}

function withTransaction<T>(database: DatabaseSync, run: () => T): T {
  database.exec('BEGIN')
  try {
    const result = run()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

export function createPlayerStore(database: DatabaseSync): PlayerStore {
  function get(id: number): Player {
    return mapRow(database.prepare(`SELECT ${COLUMNS} FROM players p WHERE p.id = ?`).get(id))
  }

  function setGroups(playerId: number, groupIds: number[]): void {
    database.prepare('DELETE FROM group_memberships WHERE player_id = ?').run(playerId)
    for (const groupId of new Set(groupIds)) {
      database
        .prepare('INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)')
        .run(groupId, playerId)
    }
  }

  return {
    list: () =>
      database
        .prepare(
          `SELECT ${COLUMNS} FROM players p ORDER BY p.last_name COLLATE NOCASE, p.first_name COLLATE NOCASE`
        )
        .all()
        .map(mapRow),
    create: (input) =>
      withTransaction(database, () => {
        assertHasGroup(input.groupIds)
        const info = database
          .prepare(
            'INSERT INTO players (last_name, first_name, middle_name, rating) VALUES (?, ?, ?, ?)'
          )
          .run(input.lastName, input.firstName, input.middleName, input.rating)
        const id = Number(info.lastInsertRowid)
        setGroups(id, input.groupIds)
        return get(id)
      }),
    update: (player) =>
      withTransaction(database, () => {
        assertHasGroup(player.groupIds)
        database
          .prepare(
            'UPDATE players SET last_name = ?, first_name = ?, middle_name = ?, rating = ? WHERE id = ?'
          )
          .run(player.lastName, player.firstName, player.middleName, player.rating, player.id)
        setGroups(player.id, player.groupIds)
        return get(player.id)
      }),
    remove: (id) => {
      database.prepare('DELETE FROM players WHERE id = ?').run(id)
    }
  }
}
