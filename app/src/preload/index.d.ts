import { ElectronAPI } from '@electron-toolkit/preload'
import type { RemoteApi } from '../shared/remote'
import type { PlayersApi } from '../shared/players'
import type { GroupsApi } from '../shared/groups'
import type { TournamentApi } from '../shared/tournament'
import type { DatabaseApi } from '../shared/database'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      remote: RemoteApi
      players: PlayersApi
      groups: GroupsApi
      tournament: TournamentApi
      database: DatabaseApi
    }
  }
}
