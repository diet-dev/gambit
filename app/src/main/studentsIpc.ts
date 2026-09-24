import type { Student, StudentInput } from '../shared/students'
import type { IpcMainLike } from './remoteIpc'
import type { StudentStore } from './studentStore'

export type RegisterStudentsIpcOptions = {
  ipcMain: IpcMainLike
  store: StudentStore
}

export function registerStudentsIpc({ ipcMain, store }: RegisterStudentsIpcOptions): void {
  ipcMain.handle('students:list', () => store.list())
  ipcMain.handle('students:create', (_event, input) => store.create(input as StudentInput))
  ipcMain.handle('students:update', (_event, student) => store.update(student as Student))
  ipcMain.handle('students:remove', (_event, id) => store.remove(id as number))
}
