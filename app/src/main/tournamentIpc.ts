import type { TournamentSettingsInput } from '../shared/tournament'
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
}
