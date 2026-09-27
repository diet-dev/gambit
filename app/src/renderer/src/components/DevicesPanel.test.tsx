import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import DevicesPanel from './DevicesPanel'
import type { RemoteApi, RemoteClient } from '../../../shared/remote'

function installApi(clients: RemoteClient[]): RemoteApi {
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => null),
    getClients: vi.fn(async () => clients),
    onClientsChanged: vi.fn(() => () => {})
  }
  window.api = {
    remote,
    players: {
      list: async () => [],
      create: async (input) => ({ id: 1, ...input }),
      update: async (player) => player,
      remove: async () => {}
    },
    groups: {
      list: async () => [],
      create: async (input) => ({ id: 1, ...input }),
      update: async (group) => group,
      remove: async () => {}
    }
  }
  return remote
}

const online: RemoteClient = {
  id: '1',
  address: '192.168.1.5',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  online: true,
  connectedAt: 1,
  lastSeenAt: 2
}

const offline: RemoteClient = {
  id: '2',
  address: '192.168.1.6',
  userAgent: 'Mozilla/5.0 (Linux; Android 14)',
  online: false,
  connectedAt: 1,
  lastSeenAt: 2
}

describe('DevicesPanel', () => {
  it('shows an empty state when nothing connected', async () => {
    installApi([])
    const { findByText } = render(<DevicesPanel />)

    expect(await findByText('Устройства ещё не подключались')).toBeInTheDocument()
  })

  it('lists devices with a name, address and online status', async () => {
    installApi([online, offline])
    const { findByText, container } = render(<DevicesPanel />)

    expect(await findByText('iPhone')).toBeInTheDocument()
    expect(container).toHaveTextContent('192.168.1.5')
    expect(container).toHaveTextContent('Android')
    expect(container.querySelectorAll('.device-status-online')).toHaveLength(1)
  })
})
