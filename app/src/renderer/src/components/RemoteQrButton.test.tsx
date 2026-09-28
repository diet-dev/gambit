import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import RemoteQrButton from './RemoteQrButton'
import type { RemoteApi, ServerInfo } from '../../../shared/remote'

const info: ServerInfo = {
  url: 'http://192.168.1.42:3210/',
  port: 3210,
  qrDataUrl: 'data:image/png;base64,AAAA'
}

function installApi(serverInfo: ServerInfo | null): RemoteApi {
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => serverInfo),
    getClients: vi.fn(async () => []),
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
    },
    tournament: {
      settings: {
        list: vi.fn(async () => []),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      },
      tournaments: {
        list: vi.fn(async () => []),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      },
      rounds: {
        list: vi.fn(async () => []),
        results: vi.fn(async () => []),
        positions: vi.fn(async () => ({ seqs: [], series: [] })),
        preview: vi.fn(async () => ({ seq: 1, pairs: [], restingPlayerIds: [] })),
        create: vi.fn(async () => ({
          round: { id: 1, tournamentId: 1, seq: 1, playedDate: '', settingsId: 1 },
          pairs: []
        }))
      }
    },
    database: {
      exportSnapshot: vi.fn(async () => null)
    }
  }
  return remote
}

describe('RemoteQrButton', () => {
  it('is disabled until the address is available', async () => {
    installApi(null)
    const { getByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeDisabled())
  })

  it('opens a dialog with the QR code and address', async () => {
    installApi(info)
    const { getByRole, findByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))

    const dialog = await findByRole('dialog')
    expect(dialog).toHaveTextContent('http://192.168.1.42:3210/')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(info.qrDataUrl)
  })

  it('closes on Escape', async () => {
    installApi(info)
    const { getByRole, findByRole, queryByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))
    await findByRole('dialog')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('copies the address to the clipboard', async () => {
    installApi(info)
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })
    const { getByRole, findByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))
    await findByRole('dialog')

    fireEvent.click(getByRole('button', { name: 'Скопировать ссылку' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(info.url))
  })
})
