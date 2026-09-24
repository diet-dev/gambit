import type { ClassInput, SchoolClass } from '../shared/classes'
import type { IpcMainLike } from './remoteIpc'
import type { ClassStore } from './classStore'

export type RegisterClassesIpcOptions = {
  ipcMain: IpcMainLike
  store: ClassStore
}

export function registerClassesIpc({ ipcMain, store }: RegisterClassesIpcOptions): void {
  ipcMain.handle('classes:list', () => store.list())
  ipcMain.handle('classes:create', (_event, input) => store.create(input as ClassInput))
  ipcMain.handle('classes:update', (_event, schoolClass) =>
    store.update(schoolClass as SchoolClass)
  )
  ipcMain.handle('classes:remove', (_event, id) => store.remove(id as number))
}
