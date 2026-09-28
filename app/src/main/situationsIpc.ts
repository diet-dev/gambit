import type { IpcMainLike } from './remoteIpc'
import type { SituationStore } from './situationStore'

export type RegisterSituationsIpcOptions = {
  ipcMain: IpcMainLike
  store: SituationStore
}

export function registerSituationsIpc({ ipcMain, store }: RegisterSituationsIpcOptions): void {
  ipcMain.handle('situations:list', () => store.list())
}
