import { useCallback, useEffect, useRef, useState } from 'react'
import type { EventInput, EventOrigin, RemoteEvent } from '../events'
import { deviceLabel } from '../remote/deviceLabel'
import { useRemoteClients } from './useRemoteClients'

const MAX_EVENTS = 100

export type MoveLogInput = {
  from: string
  to: string
  promotion?: string
}

export function useEventLog(): {
  events: RemoteEvent[]
  logMove: (move: MoveLogInput, origin: EventOrigin) => void
} {
  const clients = useRemoteClients()
  const [events, setEvents] = useState<RemoteEvent[]>([])
  const idRef = useRef(0)
  const previous = useRef<Map<string, boolean> | null>(null)

  const append = useCallback((event: EventInput): void => {
    idRef.current += 1
    const record = { ...event, id: idRef.current, time: Date.now() } as RemoteEvent
    setEvents((prev) => [...prev, record].slice(-MAX_EVENTS))
  }, [])

  useEffect(() => {
    const current = new Map(clients.map((client) => [client.id, client.online]))
    const prev = previous.current
    previous.current = current
    if (prev === null) {
      return
    }
    for (const client of clients) {
      const was = prev.get(client.id)
      const label = deviceLabel(client.userAgent)
      if (was === undefined) {
        append({ kind: 'device-new', label, address: client.address })
      } else if (!was && client.online) {
        append({ kind: 'device-online', label, address: client.address })
      } else if (was && !client.online) {
        append({ kind: 'device-offline', label, address: client.address })
      }
    }
  }, [clients, append])

  const logMove = useCallback(
    (move: MoveLogInput, origin: EventOrigin): void => {
      append({ kind: 'move', origin, from: move.from, to: move.to })
    },
    [append]
  )

  return { events, logMove }
}
