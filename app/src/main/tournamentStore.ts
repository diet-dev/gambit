import type { DatabaseSync } from 'node:sqlite'
import type {
  Round,
  RoundCreateInput,
  RoundPair,
  RoundPairsPreview,
  Tournament,
  TournamentInput,
  TournamentSettings,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../shared/tournament'
import { generateRound } from './tournamentGeneration'

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
  previewPairs: (tournamentId: number) => RoundPairsPreview
  createRound: (input: RoundCreateInput) => { round: Round; pairs: RoundPair[] }
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

  function listRoundPairs(roundId: number): RoundPair[] {
    return database
      .prepare(
        `SELECT id, round_id AS roundId, board_no AS boardNo,
                player1_id AS player1Id, player2_id AS player2Id, result
         FROM round_pairs WHERE round_id = ? ORDER BY board_no`
      )
      .all(roundId) as unknown as RoundPair[]
  }

  function listTournamentPlayers(tournamentId: number): { id: number; lastName: string }[] {
    const tournament = getTournament(tournamentId)
    return database
      .prepare(
        `SELECT p.id, p.last_name AS lastName
         FROM players p
         JOIN group_memberships m ON m.player_id = p.id
         WHERE m.group_id = ?
         ORDER BY p.last_name COLLATE NOCASE, p.first_name COLLATE NOCASE`
      )
      .all(tournament.groupId) as unknown as { id: number; lastName: string }[]
  }

  function lastRound(tournamentId: number): Round | null {
    return (
      (database
        .prepare(
          `SELECT ${ROUND_COLUMNS} FROM rounds WHERE tournament_id = ? ORDER BY seq DESC LIMIT 1`
        )
        .get(tournamentId) as unknown as Round | undefined) ?? null
    )
  }

  function withTransaction<T>(run: () => T): T {
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
        .all(tournamentId) as unknown as Round[],
    previewPairs: (tournamentId) => {
      const players = listTournamentPlayers(tournamentId)
      const prev = lastRound(tournamentId)
      const generation = generateRound({
        seq: (prev?.seq ?? 0) + 1,
        players,
        prevRound:
          prev === null
            ? null
            : {
                seq: prev.seq,
                settings: getSettings(prev.settingsId),
                pairs: listRoundPairs(prev.id).map((pair) => ({
                  player1Id: pair.player1Id,
                  player2Id: pair.player2Id,
                  result: pair.result
                }))
              }
      })
      return {
        seq: (prev?.seq ?? 0) + 1,
        pairs: generation.pairs,
        restingPlayerId: generation.restingPlayerId
      }
    },
    createRound: (input) =>
      withTransaction(() => {
        const players = listTournamentPlayers(input.tournamentId)
        const playerIds = new Set(players.map((player) => player.id))
        const prev = lastRound(input.tournamentId)
        const seq = (prev?.seq ?? 0) + 1
        const submitted = input.pairs

        for (const pair of submitted) {
          if (!playerIds.has(pair.player1Id) || !playerIds.has(pair.player2Id)) {
            throw new Error('В паре указан игрок не из группы турнира')
          }
          if (pair.player1Id === pair.player2Id) {
            throw new Error('В паре не могут быть два одинаковых игрока')
          }
        }
        const seen = new Set(submitted.flatMap((pair) => [pair.player1Id, pair.player2Id]))
        if (seen.size !== submitted.length * 2) {
          throw new Error('Игрок не может играть в двух парах одного раунда')
        }

        if (seq > 1) {
          if (prev === null) {
            throw new Error('Предыдущий раунд не найден')
          }
          const expected = generateRound({
            seq,
            players,
            prevRound: {
              seq: prev.seq,
              settings: getSettings(prev.settingsId),
              pairs: listRoundPairs(prev.id).map((pair) => ({
                player1Id: pair.player1Id,
                player2Id: pair.player2Id,
                result: pair.result
              }))
            }
          })
          const matches =
            expected.pairs.length === submitted.length &&
            expected.pairs.every(
              (pair, index) =>
                pair.player1Id === submitted[index].player1Id &&
                pair.player2Id === submitted[index].player2Id
            )
          if (!matches) {
            throw new Error('Пары не совпадают с расчётными для этого раунда')
          }
        }

        const roundInfo = database
          .prepare(
            'INSERT INTO rounds (tournament_id, seq, played_date, settings_id) VALUES (?, ?, ?, ?)'
          )
          .run(input.tournamentId, seq, input.playedDate, input.settingsId)
        const roundId = Number(roundInfo.lastInsertRowid)
        const insertPair = database.prepare(
          'INSERT INTO round_pairs (round_id, board_no, player1_id, player2_id, result) VALUES (?, ?, ?, ?, ?)'
        )
        submitted.forEach((pair, index) => {
          insertPair.run(roundId, index + 1, pair.player1Id, pair.player2Id, pair.result)
        })

        return {
          round: {
            id: roundId,
            tournamentId: input.tournamentId,
            seq,
            playedDate: input.playedDate,
            settingsId: input.settingsId
          },
          pairs: listRoundPairs(roundId)
        }
      })
  }
}
