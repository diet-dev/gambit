export type DrawScoring = 'weaker' | 'stronger' | 'none'

export type AbsenceScoring = 'loss' | 'no_effect'

export type TournamentSettings = {
  id: number
  name: string
  weakerPlaysWhite: boolean
  drawScoring: DrawScoring
  absenceScoring: AbsenceScoring
  createdAt: string
}

export type TournamentSettingsInput = Omit<TournamentSettings, 'id' | 'createdAt'>

export type TournamentSettingsWithUsage = TournamentSettings & { used: boolean }

export type TournamentSettingsApi = {
  list: () => Promise<TournamentSettingsWithUsage[]>
  create: (input: TournamentSettingsInput) => Promise<TournamentSettings>
  update: (id: number, input: TournamentSettingsInput) => Promise<TournamentSettings>
  remove: (id: number) => Promise<void>
}

export type Tournament = {
  id: number
  name: string
  groupId: number
  startDate: string
  settingsId: number
}

export type TournamentInput = Omit<Tournament, 'id'>

export type TournamentsApi = {
  list: () => Promise<Tournament[]>
  create: (input: TournamentInput) => Promise<Tournament>
  update: (id: number, input: TournamentInput) => Promise<Tournament>
  remove: (id: number) => Promise<void>
}

export type Round = {
  id: number
  tournamentId: number
  seq: number
  playedDate: string
  settingsId: number
}

export type PairResult =
  'player1_win' | 'player2_win' | 'draw' | 'player1_absent' | 'player2_absent' | 'both_absent'

export type RoundOutcome =
  'win' | 'loss' | 'draw' | 'forfeit_win' | 'forfeit_loss' | 'no_game' | 'resting'

export type RoundResultsRow = {
  position: number
  playerId: number
  lastName: string
  firstName: string
  middleName: string
  outcome: RoundOutcome
}

export type RoundPair = {
  id: number
  roundId: number
  boardNo: number
  player1Id: number
  player2Id: number
  result: PairResult
}

export type RoundPairInput = {
  player1Id: number
  player2Id: number
  result: PairResult
}

export type RoundPairsPreview = {
  seq: number
  pairs: { player1Id: number; player2Id: number }[]
  restingPlayerId: number | null
}

export type RoundCreateInput = {
  tournamentId: number
  playedDate: string
  settingsId: number
  pairs: RoundPairInput[]
}

export type RoundsApi = {
  list: (tournamentId: number) => Promise<Round[]>
  results: (roundId: number) => Promise<RoundResultsRow[]>
  preview: (tournamentId: number) => Promise<RoundPairsPreview>
  create: (input: RoundCreateInput) => Promise<{ round: Round; pairs: RoundPair[] }>
}

export type TournamentApi = {
  settings: TournamentSettingsApi
  tournaments: TournamentsApi
  rounds: RoundsApi
}
