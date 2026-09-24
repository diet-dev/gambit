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
  const version = row.user_version

  if (version < 1) {
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

  if (version < 2) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        comment TEXT NOT NULL DEFAULT ''
      )
    `)
    database.exec('ALTER TABLE students ADD COLUMN class_id INTEGER REFERENCES classes(id)')
    database.exec(`
      INSERT INTO classes (name)
      SELECT DISTINCT class_name FROM students
      WHERE class_name IS NOT NULL AND class_name <> ''
    `)
    database.exec(`
      UPDATE students
      SET class_id = (SELECT id FROM classes WHERE classes.name = students.class_name)
      WHERE class_name IS NOT NULL AND class_name <> ''
    `)
    database.exec('ALTER TABLE students DROP COLUMN class_name')
    database.exec('PRAGMA user_version = 2')
  }
}
