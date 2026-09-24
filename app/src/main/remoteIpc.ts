import type { RemoteClient, ServerInfo } from '../shared/remote'

export type IpcMainLike = {
  on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown
  handle(channel: string, listener: (...args: unknown[]) => unknown): unknown
}

export type RegisterRemoteIpcOptions = {
  ipcMain: IpcMainLike
  server: { setPosition: (fen: string) => void; getClients: () => RemoteClient[] }
  info: ServerInfo
}

export function registerRemoteIpc({ ipcMain, server, info }: RegisterRemoteIpcOptions): void {
  ipcMain.on('remote:position', (_event, fen) => {
    if (typeof fen === 'string') {
      server.setPosition(fen)
    }
  })
  ipcMain.handle('remote:server-info', () => info)
  ipcMain.handle('remote:clients', () => server.getClients())
}
