import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true })
  }
  const database = new DatabaseSync(path)
  database.exec('PRAGMA journal_mode = WAL')
  database.exec('PRAGMA foreign_keys = ON')
  migrate(database)
  return database
}

function migrate(database: DatabaseSync): void {
  const version = currentVersion(database)

  if (version >= 1 && !hasTable(database, 'groups')) {
    dropLegacySchema(database)
  }

  if (currentVersion(database) < 1) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        comment TEXT NOT NULL DEFAULT ''
      );
      CREATE UNIQUE INDEX IF NOT EXISTS groups_name_unique ON groups(name);
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS group_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE (group_id, player_id)
      );
      CREATE TABLE IF NOT EXISTS tournament_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        weaker_plays_white INTEGER NOT NULL DEFAULT 1,
        draw_scoring TEXT NOT NULL,
        absence_scoring TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `)
    database
      .prepare(
        `INSERT INTO tournament_settings (name, weaker_plays_white, draw_scoring, absence_scoring, created_at)
         SELECT 'Стандарт', 1, 'weaker', 'loss', ?
         WHERE NOT EXISTS (SELECT 1 FROM tournament_settings WHERE name = 'Стандарт')`
      )
      .run(new Date().toISOString())
    database.exec('PRAGMA user_version = 1')
  }
}

function currentVersion(database: DatabaseSync): number {
  const row = database.prepare('PRAGMA user_version').get() as { user_version: number }
  return row.user_version
}

function hasTable(database: DatabaseSync, name: string): boolean {
  const row = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name)
  return row !== undefined
}

function dropLegacySchema(database: DatabaseSync): void {
  database.exec('DROP TABLE IF EXISTS students')
  database.exec('DROP TABLE IF EXISTS classes')
  database.exec('PRAGMA user_version = 0')
}
