import type { DatabaseSync } from 'node:sqlite'
import type {
  Round,
  Tournament,
  TournamentInput,
  TournamentSettings,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../shared/tournament'

export type TournamentStore = {
  listSettings: () => TournamentSettingsWithUsage[]
  createSettings: (input: TournamentSettingsInput) => TournamentSettings
  updateSettings: (id: number, input: TournamentSettingsInput) => TournamentSettings
  removeSettings: (id: number) => void
  listTournaments: () => Tournament[]
  createTournament: (input: TournamentInput) => Tournament
  updateTournament: (id: number, input: TournamentInput) => Tournament
  removeTournament: (id: number) => void
  listRounds: (tournamentId: number) => Round[]
}

const SETTINGS_COLUMNS = `
  s.id,
  s.name,
  s.weaker_plays_white AS weakerPlaysWhite,
  s.draw_scoring AS drawScoring,
  s.absence_scoring AS absenceScoring,
  s.created_at AS createdAt,
  EXISTS(SELECT 1 FROM tournaments t WHERE t.settings_id = s.id) AS used
`

const TOURNAMENT_COLUMNS = `
  id,
  name,
  group_id AS groupId,
  start_date AS startDate,
  settings_id AS settingsId
`

const ROUND_COLUMNS = `
  id,
  tournament_id AS tournamentId,
  seq,
  played_date AS playedDate,
  settings_id AS settingsId
`

type SettingsRow = Omit<TournamentSettingsWithUsage, 'weakerPlaysWhite'> & {
  weakerPlaysWhite: number
}

function mapSettingsRow(row: SettingsRow): TournamentSettingsWithUsage {
  const { weakerPlaysWhite, ...rest } = row
  return { ...rest, weakerPlaysWhite: weakerPlaysWhite !== 0 }
}

export function createTournamentStore(database: DatabaseSync): TournamentStore {
  function getSettings(id: number): TournamentSettingsWithUsage {
    return mapSettingsRow(
      database
        .prepare(`SELECT ${SETTINGS_COLUMNS} FROM tournament_settings s WHERE s.id = ?`)
        .get(id) as unknown as SettingsRow
    )
  }

  function getTournament(id: number): Tournament {
    return database
      .prepare(`SELECT ${TOURNAMENT_COLUMNS} FROM tournaments WHERE id = ?`)
      .get(id) as unknown as Tournament
  }

  return {
    listSettings: () =>
      (
        database
          .prepare(
            `SELECT ${SETTINGS_COLUMNS} FROM tournament_settings s ORDER BY s.name COLLATE NOCASE`
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
      const settings = getSettings(id)
      if (settings.used) {
        throw new Error('Настройка уже используется турниром — сохраните её как новую версию')
      }
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
      const settings = getSettings(id)
      if (settings.used) {
        throw new Error(`Нельзя удалить настройку «${settings.name}»: она используется турниром`)
      }
      database.prepare('DELETE FROM tournament_settings WHERE id = ?').run(id)
    },
    listTournaments: () =>
      database
        .prepare(
          `SELECT ${TOURNAMENT_COLUMNS} FROM tournaments ORDER BY start_date DESC, name COLLATE NOCASE`
        )
        .all() as unknown as Tournament[],
    createTournament: (input) => {
      const info = database
        .prepare(
          'INSERT INTO tournaments (name, group_id, start_date, settings_id) VALUES (?, ?, ?, ?)'
        )
        .run(input.name, input.groupId, input.startDate, input.settingsId)
      return getTournament(Number(info.lastInsertRowid))
    },
    updateTournament: (id, input) => {
      database
        .prepare(
          'UPDATE tournaments SET name = ?, group_id = ?, start_date = ?, settings_id = ? WHERE id = ?'
        )
        .run(input.name, input.groupId, input.startDate, input.settingsId, id)
      return getTournament(id)
    },
    removeTournament: (id) => {
      database.prepare('DELETE FROM tournaments WHERE id = ?').run(id)
    },
    listRounds: (tournamentId) =>
      database
        .prepare(`SELECT ${ROUND_COLUMNS} FROM rounds WHERE tournament_id = ? ORDER BY seq`)
        .all(tournamentId) as unknown as Round[]
  }
}
