export type EventOrigin = 'local' | 'remote'

type DeviceEvent = {
  id: number
  time: number
  kind: 'device-new' | 'device-online' | 'device-offline'
  label: string
  address: string
}

type MoveEvent = {
  id: number
  time: number
  kind: 'move'
  origin: EventOrigin
  from: string
  to: string
}

export type RemoteEvent = DeviceEvent | MoveEvent

export type EventInput =
  | { kind: 'device-new' | 'device-online' | 'device-offline'; label: string; address: string }
  | { kind: 'move'; origin: EventOrigin; from: string; to: string }
