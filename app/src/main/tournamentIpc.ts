import type {
  TournamentInput,
  TournamentSettingsInput,
  RoundCreateInput
} from '../shared/tournament'
import type { IpcMainLike } from './remoteIpc'
import type { TournamentStore } from './tournamentStore'

export type RegisterTournamentIpcOptions = {
  ipcMain: IpcMainLike
  store: TournamentStore
}

export function registerTournamentIpc({ ipcMain, store }: RegisterTournamentIpcOptions): void {
  ipcMain.handle('tournament:settings:list', () => store.listSettings())
  ipcMain.handle('tournament:settings:create', (_event, input) =>
    store.createSettings(input as TournamentSettingsInput)
  )
  ipcMain.handle('tournament:settings:update', (_event, id, input) =>
    store.updateSettings(id as number, input as TournamentSettingsInput)
  )
  ipcMain.handle('tournament:settings:remove', (_event, id) => store.removeSettings(id as number))
  ipcMain.handle('tournament:tournaments:list', () => store.listTournaments())
  ipcMain.handle('tournament:tournaments:create', (_event, input) =>
    store.createTournament(input as TournamentInput)
  )
  ipcMain.handle('tournament:tournaments:update', (_event, id, input) =>
    store.updateTournament(id as number, input as TournamentInput)
  )
  ipcMain.handle('tournament:tournaments:remove', (_event, id) =>
    store.removeTournament(id as number)
  )
  ipcMain.handle('tournament:rounds:list', (_event, tournamentId) =>
    store.listRounds(tournamentId as number)
  )
  ipcMain.handle('tournament:rounds:results', (_event, roundId) =>
    store.roundResults(roundId as number)
  )
  ipcMain.handle('tournament:rounds:positions', (_event, tournamentId) =>
    store.positions(tournamentId as number)
  )
  ipcMain.handle('tournament:rounds:preview', (_event, tournamentId) =>
    store.previewPairs(tournamentId as number)
  )
  ipcMain.handle('tournament:rounds:create', (_event, input) =>
    store.createRound(input as RoundCreateInput)
  )
}
