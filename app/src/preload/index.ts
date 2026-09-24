import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { RemoteApi, RemoteMove, ServerInfo } from '../shared/remote'

const remote: RemoteApi = {
  publishPosition: (fen) => ipcRenderer.send('remote:position', fen),
  onRemoteMove: (callback) => {
    const listener = (_event: IpcRendererEvent, move: RemoteMove): void => callback(move)
    ipcRenderer.on('remote:move', listener)
    return () => ipcRenderer.removeListener('remote:move', listener)
  },
  getServerInfo: () => ipcRenderer.invoke('remote:server-info') as Promise<ServerInfo | null>
}

const api = { remote }

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
