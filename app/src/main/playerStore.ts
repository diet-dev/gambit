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
  (SELECT m.group_id FROM group_memberships m WHERE m.player_id = p.id LIMIT 1) AS groupId,
  p.rating AS rating
`

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
    return database
      .prepare(`SELECT ${COLUMNS} FROM players p WHERE p.id = ?`)
      .get(id) as unknown as Player
  }

  function setGroup(playerId: number, groupId: number | null): void {
    database.prepare('DELETE FROM group_memberships WHERE player_id = ?').run(playerId)
    if (groupId !== null) {
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
        .all() as unknown as Player[],
    create: (input) =>
      withTransaction(database, () => {
        const info = database
          .prepare(
            'INSERT INTO players (last_name, first_name, middle_name, rating) VALUES (?, ?, ?, ?)'
          )
          .run(input.lastName, input.firstName, input.middleName, input.rating)
        const id = Number(info.lastInsertRowid)
        setGroup(id, input.groupId)
        return get(id)
      }),
    update: (player) =>
      withTransaction(database, () => {
        database
          .prepare(
            'UPDATE players SET last_name = ?, first_name = ?, middle_name = ?, rating = ? WHERE id = ?'
          )
          .run(player.lastName, player.firstName, player.middleName, player.rating, player.id)
        setGroup(player.id, player.groupId)
        return get(player.id)
      }),
    remove: (id) => {
      database.prepare('DELETE FROM players WHERE id = ?').run(id)
    }
  }
}
