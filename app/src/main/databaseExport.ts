import { rmSync } from 'node:fs'
import type { DatabaseSync } from 'node:sqlite'

export type DatabaseExporter = {
  showSaveDialog: (defaultFileName: string) => Promise<string | null>
}

export function fileNameStamp(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function defaultSnapshotFileName(date = new Date()): string {
  return `gambit-дамп-${fileNameStamp(date)}.db`
}

export async function exportDatabaseSnapshot(
  database: DatabaseSync,
  exporter: DatabaseExporter
): Promise<string | null> {
  const targetPath = await exporter.showSaveDialog(defaultSnapshotFileName())
  if (targetPath === null) {
    return null
  }
  rmSync(targetPath, { force: true })
  database.prepare('VACUUM INTO ?').run(targetPath)
  return targetPath
}
