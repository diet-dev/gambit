import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { RemoteApi, RemoteClient, RemoteMove, ServerInfo } from '../shared/remote'
import type { Student, StudentInput, StudentsApi } from '../shared/students'

const remote: RemoteApi = {
  publishPosition: (fen) => ipcRenderer.send('remote:position', fen),
  onRemoteMove: (callback) => {
    const listener = (_event: IpcRendererEvent, move: RemoteMove): void => callback(move)
    ipcRenderer.on('remote:move', listener)
    return () => ipcRenderer.removeListener('remote:move', listener)
  },
  getServerInfo: () => ipcRenderer.invoke('remote:server-info') as Promise<ServerInfo | null>,
  getClients: () => ipcRenderer.invoke('remote:clients') as Promise<RemoteClient[]>,
  onClientsChanged: (callback) => {
    const listener = (_event: IpcRendererEvent, clients: RemoteClient[]): void => callback(clients)
    ipcRenderer.on('remote:clients-changed', listener)
    return () => ipcRenderer.removeListener('remote:clients-changed', listener)
  }
}

const students: StudentsApi = {
  list: () => ipcRenderer.invoke('students:list') as Promise<Student[]>,
  create: (student: StudentInput) =>
    ipcRenderer.invoke('students:create', student) as Promise<Student>,
  update: (student: Student) => ipcRenderer.invoke('students:update', student) as Promise<Student>,
  remove: (id: number) => ipcRenderer.invoke('students:remove', id) as Promise<void>
}

const api = { remote, students }

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
