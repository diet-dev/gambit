import { ElectronAPI } from '@electron-toolkit/preload'
import type { RemoteApi } from '../shared/remote'
import type { StudentsApi } from '../shared/students'

declare global {
  interface Window {
    electron: ElectronAPI
    api: { remote: RemoteApi; students: StudentsApi }
  }
}
