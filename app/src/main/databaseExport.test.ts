import { existsSync } from 'node:fs'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { defaultSnapshotFileName, exportDatabaseSnapshot } from './databaseExport'

function makeDatabase(): DatabaseSync {
  const database = openDatabase(':memory:')
  database.prepare("INSERT INTO groups (name, comment) VALUES ('7А', '')").run()
  return database
}

describe('exportDatabaseSnapshot', () => {
  it('writes a restorable snapshot to the chosen path', async () => {
    const database = makeDatabase()
    const targetPath = join(mkdtempSync(join(tmpdir(), 'gambit-export-')), 'dump.db')

    const saved = await exportDatabaseSnapshot(database, {
      showSaveDialog: async () => targetPath
    })

    expect(saved).toBe(targetPath)
    expect(existsSync(targetPath)).toBe(true)

    const snapshot = new DatabaseSync(targetPath)
    const groups = snapshot.prepare('SELECT name FROM groups').all() as { name: string }[]
    expect(groups).toEqual([{ name: '7А' }])
    const version = snapshot.prepare('PRAGMA user_version').get() as { user_version: number }
    expect(version.user_version).toBe(4)
    snapshot.close()
    database.close()
  })

  it('overwrites an existing file at the chosen path', async () => {
    const database = makeDatabase()
    const targetPath = join(mkdtempSync(join(tmpdir(), 'gambit-export-')), 'dump.db')
    writeFileSync(targetPath, 'старый файл')

    const saved = await exportDatabaseSnapshot(database, {
      showSaveDialog: async () => targetPath
    })

    expect(saved).toBe(targetPath)
    const snapshot = new DatabaseSync(targetPath)
    expect(
      snapshot.prepare("SELECT name FROM sqlite_master WHERE name = 'groups'").all()
    ).toHaveLength(1)
    snapshot.close()
    database.close()
  })

  it('does nothing when the dialog is cancelled', async () => {
    const database = makeDatabase()

    const saved = await exportDatabaseSnapshot(database, {
      showSaveDialog: async () => null
    })

    expect(saved).toBe(null)
    database.close()
  })

  it('suggests a file name with today stamp', () => {
    const name = defaultSnapshotFileName(new Date(2026, 8, 28, 15, 30))
    expect(name).toBe('gambit-дамп-2026-09-28.db')
  })
})
