import type { Group, GroupInput } from '../shared/groups'
import type { IpcMainLike } from './remoteIpc'
import type { GroupStore } from './groupStore'

export type RegisterGroupsIpcOptions = {
  ipcMain: IpcMainLike
  store: GroupStore
}

export function registerGroupsIpc({ ipcMain, store }: RegisterGroupsIpcOptions): void {
  ipcMain.handle('groups:list', () => store.list())
  ipcMain.handle('groups:create', (_event, input) => store.create(input as GroupInput))
  ipcMain.handle('groups:update', (_event, group) => store.update(group as Group))
  ipcMain.handle('groups:remove', (_event, id) => store.remove(id as number))
}
