import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { RemoteApi, RemoteClient, RemoteMove, ServerInfo } from '../shared/remote'
import type { Player, PlayerInput, PlayersApi } from '../shared/players'
import type { Group, GroupInput, GroupsApi } from '../shared/groups'
import type {
  Tournament,
  TournamentApi,
  TournamentInput,
  TournamentSettings,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../shared/tournament'

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

const players: PlayersApi = {
  list: () => ipcRenderer.invoke('players:list') as Promise<Player[]>,
  create: (player: PlayerInput) => ipcRenderer.invoke('players:create', player) as Promise<Player>,
  update: (player: Player) => ipcRenderer.invoke('players:update', player) as Promise<Player>,
  remove: (id: number) => ipcRenderer.invoke('players:remove', id) as Promise<void>
}

const groups: GroupsApi = {
  list: () => ipcRenderer.invoke('groups:list') as Promise<Group[]>,
  create: (input: GroupInput) => ipcRenderer.invoke('groups:create', input) as Promise<Group>,
  update: (group: Group) => ipcRenderer.invoke('groups:update', group) as Promise<Group>,
  remove: (id: number) => ipcRenderer.invoke('groups:remove', id) as Promise<void>
}

const tournament: TournamentApi = {
  settings: {
    list: () =>
      ipcRenderer.invoke('tournament:settings:list') as Promise<TournamentSettingsWithUsage[]>,
    create: (input: TournamentSettingsInput) =>
      ipcRenderer.invoke('tournament:settings:create', input) as Promise<TournamentSettings>,
    update: (id: number, input: TournamentSettingsInput) =>
      ipcRenderer.invoke('tournament:settings:update', id, input) as Promise<TournamentSettings>,
    remove: (id: number) => ipcRenderer.invoke('tournament:settings:remove', id) as Promise<void>
  },
  tournaments: {
    list: () => ipcRenderer.invoke('tournament:tournaments:list') as Promise<Tournament[]>,
    create: (input: TournamentInput) =>
      ipcRenderer.invoke('tournament:tournaments:create', input) as Promise<Tournament>,
    update: (id: number, input: TournamentInput) =>
      ipcRenderer.invoke('tournament:tournaments:update', id, input) as Promise<Tournament>,
    remove: (id: number) => ipcRenderer.invoke('tournament:tournaments:remove', id) as Promise<void>
  }
}

const api = { remote, players, groups, tournament }

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
