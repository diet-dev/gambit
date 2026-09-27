import type { Player, PlayerInput } from '../shared/players'
import type { IpcMainLike } from './remoteIpc'
import type { PlayerStore } from './playerStore'

export type RegisterPlayersIpcOptions = {
  ipcMain: IpcMainLike
  store: PlayerStore
}

export function registerPlayersIpc({ ipcMain, store }: RegisterPlayersIpcOptions): void {
  ipcMain.handle('players:list', () => store.list())
  ipcMain.handle('players:create', (_event, input) => store.create(input as PlayerInput))
  ipcMain.handle('players:update', (_event, player) => store.update(player as Player))
  ipcMain.handle('players:remove', (_event, id) => store.remove(id as number))
}
