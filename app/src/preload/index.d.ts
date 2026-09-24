import { ElectronAPI } from '@electron-toolkit/preload'
import type { RemoteApi } from '../shared/remote'

declare global {
  interface Window {
    electron: ElectronAPI
    api: { remote: RemoteApi }
  }
}
