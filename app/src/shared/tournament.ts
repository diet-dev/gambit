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

export type TournamentApi = {
  settings: TournamentSettingsApi
}
