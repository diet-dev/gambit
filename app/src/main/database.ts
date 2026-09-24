import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true })
  }
  const database = new DatabaseSync(path)
  database.exec('PRAGMA journal_mode = WAL')
  migrate(database)
  return database
}

function migrate(database: DatabaseSync): void {
  const row = database.prepare('PRAGMA user_version').get() as { user_version: number }
  if (row.user_version < 1) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT NOT NULL DEFAULT '',
        class_name TEXT NOT NULL DEFAULT '',
        rating INTEGER NOT NULL DEFAULT 0
      )
    `)
    database.exec('PRAGMA user_version = 1')
  }
}
