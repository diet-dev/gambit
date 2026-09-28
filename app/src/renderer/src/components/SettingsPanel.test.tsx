import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SettingsPanel from './SettingsPanel'
import { THEME_STORAGE_KEY } from '../theme'
import type { DatabaseApi } from '../../../shared/database'
import type { RemoteApi } from '../../../shared/remote'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

function installApi(databaseApi: DatabaseApi): void {
  window.api = {
    remote: remoteStub,
    players: {
      list: vi.fn(async () => []),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
    },
    groups: {
      list: vi.fn(async () => []),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
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
    database: databaseApi,
    situations: {
      list: vi.fn(async () => []),
      create: vi.fn(async () => ({
        id: 1,
        groupId: 1,
        title: 'Новая ситуация',
        description: '',
        comment: '',
        fen: '',
        sortOrder: 1
      })),
      update: vi.fn(async () => ({
        id: 1,
        groupId: 1,
        title: 'Обновлено',
        description: '',
        comment: '',
        fen: '',
        sortOrder: 1
      })),
      remove: vi.fn(async () => undefined)
    }
  }
}

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('SettingsPanel', () => {
  it('shows the appearance section with the dark theme selected by default', () => {
    const { getByRole, getByText } = render(<SettingsPanel />)

    expect(getByText('Оформление')).toBeInTheDocument()
    expect(getByRole('radio', { name: 'Тёмная' })).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('switches to the light theme and persists the choice', () => {
    const { getByRole } = render(<SettingsPanel />)

    fireEvent.click(getByRole('radio', { name: 'Светлая' }))

    expect(getByRole('radio', { name: 'Светлая' })).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('reflects a previously stored theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    const { getByRole } = render(<SettingsPanel />)

    expect(getByRole('radio', { name: 'Светлая' })).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('exports the database and shows the saved path', async () => {
    const exportSnapshot = vi.fn(async () => '/home/user/gambit-дамп-2026-09-28.db')
    installApi({ exportSnapshot })
    const { getByRole, findByText } = render(<SettingsPanel />)

    fireEvent.click(getByRole('button', { name: 'Экспортировать…' }))

    expect(await findByText('Сохранено: /home/user/gambit-дамп-2026-09-28.db')).toBeInTheDocument()
    expect(exportSnapshot).toHaveBeenCalledTimes(1)
  })

  it('shows nothing about saving when the dialog is cancelled', async () => {
    installApi({ exportSnapshot: vi.fn(async () => null) })
    const { getByRole, findByRole, queryByText } = render(<SettingsPanel />)

    fireEvent.click(getByRole('button', { name: 'Экспортировать…' }))
    await findByRole('button', { name: 'Экспортировать…' })

    expect(queryByText(/Сохранено:/)).not.toBeInTheDocument()
  })

  it('shows an error when the export fails', async () => {
    installApi({ exportSnapshot: vi.fn(async () => Promise.reject(new Error('нет доступа'))) })
    const { getByRole, findByText } = render(<SettingsPanel />)

    fireEvent.click(getByRole('button', { name: 'Экспортировать…' }))

    expect(await findByText('нет доступа')).toBeInTheDocument()
  })
})
