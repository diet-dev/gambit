import { useEffect, useState } from 'react'
import type { RemoteClient } from '../../../shared/remote'

export function useRemoteClients(): RemoteClient[] {
  const [clients, setClients] = useState<RemoteClient[]>([])

  useEffect(() => {
    const api = window.api?.remote
    if (!api) {
      return
    }
    let active = true
    api.getClients().then((value) => {
      if (active) {
        setClients(value)
      }
    })
    const unsubscribe = api.onClientsChanged((value) => setClients(value))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return clients
}
