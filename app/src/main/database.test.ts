import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'

describe('openDatabase', () => {
  it('creates the fresh schema with groups, players, memberships, settings and tournaments', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'gambit-db-')), 'gambit.db')
    const database = openDatabase(path)

    const tables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string }[]
    expect(tables.map((row) => row.name)).toEqual([
      'group_memberships',
      'groups',
      'players',
      'round_pairs',
      'rounds',
      'tournament_settings',
      'tournaments'
    ])

    const version = database.prepare('PRAGMA user_version').get() as { user_version: number }
    expect(version.user_version).toBe(2)

    const foreignKeys = database.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }
    expect(foreignKeys.foreign_keys).toBe(1)

    database.close()
  })

  it('cascades membership removal when a group or player is deleted', () => {
    const database = openDatabase(':memory:')

    const groupInfo = database.prepare("INSERT INTO groups (name) VALUES ('7А')").run()
    const groupId = Number(groupInfo.lastInsertRowid)
    const otherGroupInfo = database.prepare("INSERT INTO groups (name) VALUES ('7Б')").run()
    const otherGroupId = Number(otherGroupInfo.lastInsertRowid)
    const playerInfo = database
      .prepare("INSERT INTO players (last_name, first_name) VALUES ('Иванов', 'Иван')")
      .run()
    const playerId = Number(playerInfo.lastInsertRowid)
    database
      .prepare('INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)')
      .run(groupId, playerId)
    database
      .prepare('INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)')
      .run(otherGroupId, playerId)

    database.prepare('DELETE FROM groups WHERE id = ?').run(groupId)
    const afterGroupDelete = database
      .prepare('SELECT COUNT(*) AS count FROM group_memberships')
      .get() as { count: number }
    expect(afterGroupDelete.count).toBe(1)

    database.prepare('DELETE FROM players WHERE id = ?').run(playerId)
    const afterPlayerDelete = database
      .prepare('SELECT COUNT(*) AS count FROM group_memberships')
      .get() as { count: number }
    expect(afterPlayerDelete.count).toBe(0)

    database.close()
  })

  it('rebuilds a legacy schema instead of failing on missing tables', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'gambit-db-')), 'gambit.db')
    const legacy = new DatabaseSync(path)
    legacy.exec(`
      CREATE TABLE classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        comment TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT NOT NULL DEFAULT '',
        class_id INTEGER REFERENCES classes(id),
        rating INTEGER NOT NULL DEFAULT 0
      );
    `)
    legacy.exec('PRAGMA user_version = 3')
    legacy.close()

    const database = openDatabase(path)

    const tables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string }[]
    expect(tables.map((row) => row.name)).toEqual([
      'group_memberships',
      'groups',
      'players',
      'round_pairs',
      'rounds',
      'tournament_settings',
      'tournaments'
    ])

    const version = database.prepare('PRAGMA user_version').get() as { user_version: number }
    expect(version.user_version).toBe(2)

    database.close()
  })

  it('enforces unique group names and unique membership pairs', () => {
    const database = openDatabase(':memory:')

    database.prepare("INSERT INTO groups (name) VALUES ('7А')").run()
    expect(() => database.prepare("INSERT INTO groups (name) VALUES ('7А')").run()).toThrow()

    const group = database.prepare('SELECT id FROM groups LIMIT 1').get() as { id: number }
    const playerInfo = database
      .prepare("INSERT INTO players (last_name, first_name) VALUES ('Иванов', 'Иван')")
      .run()
    const playerId = Number(playerInfo.lastInsertRowid)
    database
      .prepare('INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)')
      .run(group.id, playerId)
    expect(() =>
      database
        .prepare('INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)')
        .run(group.id, playerId)
    ).toThrow()

    database.close()
  })
})
