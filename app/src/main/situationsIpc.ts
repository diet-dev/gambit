import type { SituationCreateInput, SituationUpdateInput } from '../shared/situations'
import type { IpcMainLike } from './remoteIpc'
import type { SituationStore } from './situationStore'

export type RegisterSituationsIpcOptions = {
  ipcMain: IpcMainLike
  store: SituationStore
}

export function registerSituationsIpc({ ipcMain, store }: RegisterSituationsIpcOptions): void {
  ipcMain.handle('situations:list', () => store.list())
  ipcMain.handle('situations:create', (_event, input) =>
    store.create(input as SituationCreateInput)
  )
  ipcMain.handle('situations:update', (_event, input) =>
    store.update(input as SituationUpdateInput)
  )
  ipcMain.handle('situations:remove', (_event, id) => store.remove(id as number))
}
