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

export type TournamentApi = {
  settings: TournamentSettingsApi
  tournaments: TournamentsApi
}
