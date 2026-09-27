import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TournamentsPanel from './TournamentsPanel'
import type { RemoteApi } from '../../../shared/remote'
import type {
  TournamentSettingsApi,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

function installApi(initial: TournamentSettingsWithUsage[]): TournamentSettingsApi {
  let settings = [...initial]
  const settingsApi = {
    list: vi.fn(async () => settings),
    create: vi.fn(async (input: TournamentSettingsInput) => {
      const created = {
        id: settings.length + 1,
        createdAt: '2026-09-27T00:00:00.000Z',
        used: false,
        ...input
      }
      settings = [...settings, created]
      return created
    }),
    update: vi.fn(async (id: number, input: TournamentSettingsInput) => {
      settings = settings.map((item) => (item.id === id ? { ...item, ...input } : item))
      return { id, createdAt: '2026-09-27T00:00:00.000Z', used: false, ...input }
    }),
    remove: vi.fn(async (id: number) => {
      settings = settings.filter((item) => item.id !== id)
    })
  }
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
    tournament: { settings: settingsApi }
  }
  return settingsApi
}

const standard: TournamentSettingsWithUsage = {
  id: 1,
  name: 'Стандарт',
  weakerPlaysWhite: true,
  drawScoring: 'weaker',
  absenceScoring: 'loss',
  createdAt: '2026-09-27T00:00:00.000Z',
  used: false
}

describe('TournamentsPanel', () => {
  it('shows the tournaments sub-tab by default', () => {
    installApi([])
    const { container, getByRole } = render(<TournamentsPanel />)

    expect(getByRole('tab', { name: 'Турниры' })).toHaveAttribute('aria-selected', 'true')
    expect(getByRole('tabpanel', { name: 'Турниры' })).toBeInTheDocument()
    expect(container.querySelector('.tournaments-settings')).not.toBeInTheDocument()
  })

  it('lists settings in the settings sub-tab', async () => {
    installApi([standard])
    const user = userEvent.setup()
    const { getByRole, findByText } = render(<TournamentsPanel />)

    await user.click(getByRole('tab', { name: 'Настройки' }))

    expect(
      await findByText('слабый — белыми · ничья: в пользу слабого · неявка: поражение неявившемуся')
    ).toBeInTheDocument()
  })

  it('creates a setting through the form', async () => {
    const api = installApi([])
    const user = userEvent.setup()
    const { getByRole, findByRole, findByText } = render(<TournamentsPanel />)

    await user.click(getByRole('tab', { name: 'Настройки' }))
    await user.click(await findByRole('button', { name: 'Добавить настройку' }))
    const dialog = await findByRole('dialog')
    await user.type(dialog.querySelector('input')!, 'Блиц')
    await user.click(getByRole('button', { name: 'Создать' }))

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        name: 'Блиц',
        weakerPlaysWhite: true,
        drawScoring: 'weaker',
        absenceScoring: 'loss'
      })
    )
    expect(await findByText('Блиц')).toBeInTheDocument()
  })

  it('deletes a setting after confirmation', async () => {
    const api = installApi([standard])
    const user = userEvent.setup()
    const { getByRole, findByRole, queryByText } = render(<TournamentsPanel />)

    await user.click(getByRole('tab', { name: 'Настройки' }))
    await user.click(await findByRole('button', { name: 'Удалить: Стандарт' }))
    await user.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('Стандарт')).not.toBeInTheDocument())
  })
})
