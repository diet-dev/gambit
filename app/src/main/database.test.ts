import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'

function createLegacyDatabase(path: string): void {
  const legacy = new DatabaseSync(path)
  legacy.exec(`
    CREATE TABLE students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      last_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      middle_name TEXT NOT NULL DEFAULT '',
      class_name TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 0
    )
  `)
  legacy.exec('PRAGMA user_version = 1')
  legacy.exec(`
    INSERT INTO students (last_name, first_name, middle_name, class_name, rating) VALUES
      ('Иванов', 'Иван', 'Иванович', '7А', 100),
      ('Петров', 'Пётр', '', '7А', 50),
      ('Сидоров', 'Сидор', '', '8Б', 10),
      ('Пустой', 'Без', '', '', 0)
  `)
  legacy.close()
}

describe('openDatabase migrations', () => {
  it('migrates class names into the classes table without losing students', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'gambit-db-')), 'gambit.db')
    createLegacyDatabase(path)

    const database = openDatabase(path)
    const classes = database.prepare('SELECT name FROM classes ORDER BY name').all() as {
      name: string
    }[]
    const joined = database
      .prepare(
        `SELECT s.last_name AS lastName, c.name AS className
         FROM students s LEFT JOIN classes c ON c.id = s.class_id
         ORDER BY s.last_name`
      )
      .all() as { lastName: string; className: string | null }[]

    expect(classes.map((row) => row.name)).toEqual(['7А', '8Б'])
    expect(joined).toEqual([
      { lastName: 'Иванов', className: '7А' },
      { lastName: 'Петров', className: '7А' },
      { lastName: 'Пустой', className: null },
      { lastName: 'Сидоров', className: '8Б' }
    ])

    const version = database.prepare('PRAGMA user_version').get() as { user_version: number }
    expect(version.user_version).toBe(3)
    database.close()
  })

  it('merges duplicate class names and enforces uniqueness', () => {
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
    legacy.exec('PRAGMA user_version = 2')
    legacy.exec(
      "INSERT INTO classes (name, comment) VALUES ('7А', ''), ('7А', 'дубль'), ('8Б', '')"
    )
    legacy.exec(`
      INSERT INTO students (last_name, first_name, class_id, rating) VALUES
        ('Иванов', 'Иван', 1, 100),
        ('Петров', 'Пётр', 2, 50),
        ('Сидоров', 'Сидор', 3, 10)
    `)
    legacy.close()

    const database = openDatabase(path)
    const classes = database.prepare('SELECT id, name FROM classes ORDER BY name').all() as {
      id: number
      name: string
    }[]
    const petrov = database
      .prepare("SELECT class_id AS classId FROM students WHERE last_name = 'Петров'")
      .get() as { classId: number }

    expect(classes).toEqual([
      { id: 1, name: '7А' },
      { id: 3, name: '8Б' }
    ])
    expect(petrov.classId).toBe(1)
    expect(() => database.exec("INSERT INTO classes (name) VALUES ('7А')")).toThrow()
    database.close()
  })
})
