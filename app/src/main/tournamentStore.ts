import type { DatabaseSync } from 'node:sqlite'
import type {
  TournamentSettings,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../shared/tournament'

export type TournamentStore = {
  listSettings: () => TournamentSettingsWithUsage[]
  createSettings: (input: TournamentSettingsInput) => TournamentSettings
  updateSettings: (id: number, input: TournamentSettingsInput) => TournamentSettings
  removeSettings: (id: number) => void
}

const SETTINGS_COLUMNS = `
  id,
  name,
  weaker_plays_white AS weakerPlaysWhite,
  draw_scoring AS drawScoring,
  absence_scoring AS absenceScoring,
  created_at AS createdAt,
  FALSE AS used
`

type SettingsRow = Omit<TournamentSettingsWithUsage, 'weakerPlaysWhite'> & {
  weakerPlaysWhite: number
}

function mapSettingsRow(row: SettingsRow): TournamentSettingsWithUsage {
  const { weakerPlaysWhite, ...rest } = row
  return { ...rest, weakerPlaysWhite: weakerPlaysWhite !== 0 }
}

export function createTournamentStore(database: DatabaseSync): TournamentStore {
  function getSettings(id: number): TournamentSettings {
    return mapSettingsRow(
      database
        .prepare(`SELECT ${SETTINGS_COLUMNS} FROM tournament_settings WHERE id = ?`)
        .get(id) as unknown as SettingsRow
    )
  }

  return {
    listSettings: () =>
      (
        database
          .prepare(
            `SELECT ${SETTINGS_COLUMNS} FROM tournament_settings ORDER BY name COLLATE NOCASE`
          )
          .all() as unknown as SettingsRow[]
      ).map(mapSettingsRow),
    createSettings: (input) => {
      const info = database
        .prepare(
          `INSERT INTO tournament_settings
             (name, weaker_plays_white, draw_scoring, absence_scoring, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          input.name,
          input.weakerPlaysWhite ? 1 : 0,
          input.drawScoring,
          input.absenceScoring,
          new Date().toISOString()
        )
      return getSettings(Number(info.lastInsertRowid))
    },
    updateSettings: (id, input) => {
      database
        .prepare(
          `UPDATE tournament_settings
           SET name = ?, weaker_plays_white = ?, draw_scoring = ?, absence_scoring = ?
           WHERE id = ?`
        )
        .run(
          input.name,
          input.weakerPlaysWhite ? 1 : 0,
          input.drawScoring,
          input.absenceScoring,
          id
        )
      return getSettings(id)
    },
    removeSettings: (id) => {
      database.prepare('DELETE FROM tournament_settings WHERE id = ?').run(id)
    }
  }
}
