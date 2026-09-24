import { ElectronAPI } from '@electron-toolkit/preload'
import type { RemoteApi } from '../shared/remote'
import type { StudentsApi } from '../shared/students'
import type { ClassesApi } from '../shared/classes'

declare global {
  interface Window {
    electron: ElectronAPI
    api: { remote: RemoteApi; students: StudentsApi; classes: ClassesApi }
  }
}
