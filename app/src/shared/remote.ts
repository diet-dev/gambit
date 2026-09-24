export type RemoteMove = {
  from: string
  to: string
  promotion?: string
}

export type ServerInfo = {
  url: string
  port: number
  qrDataUrl: string
}

export type RemoteClient = {
  id: string
  address: string
  userAgent: string
  online: boolean
  connectedAt: number
  lastSeenAt: number
}

export type RemoteApi = {
  publishPosition: (fen: string) => void
  onRemoteMove: (callback: (move: RemoteMove) => void) => () => void
  getServerInfo: () => Promise<ServerInfo | null>
  getClients: () => Promise<RemoteClient[]>
  onClientsChanged: (callback: (clients: RemoteClient[]) => void) => () => void
}
