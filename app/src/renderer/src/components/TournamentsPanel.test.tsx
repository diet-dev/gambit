import { describe, expect, it, vi } from 'vitest'
import { render, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TournamentsPanel from './TournamentsPanel'
import type { RemoteApi } from '../../../shared/remote'
import type { Group } from '../../../shared/groups'
import type {
  Tournament,
  TournamentSettingsApi,
  TournamentSettingsInput,
  TournamentSettingsWithUsage,
  TournamentsApi,
  TournamentInput
} from '../../../shared/tournament'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

function installApi(
  settingsInit: TournamentSettingsWithUsage[],
  tournamentsInit: Tournament[] = [],
  groupsInit: Group[] = [{ id: 1, name: '7А', comment: '' }]
): {
  settingsApi: TournamentSettingsApi
  tournamentsApi: TournamentsApi
} {
  let settings = [...settingsInit]
  let tournaments = [...tournamentsInit]
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
  const tournamentsApi = {
    list: vi.fn(async () => tournaments),
    create: vi.fn(async (input: TournamentInput) => {
      const created = { id: tournaments.length + 1, ...input }
      tournaments = [...tournaments, created]
      return created
    }),
    update: vi.fn(async (id: number, input: TournamentInput) => {
      tournaments = tournaments.map((item) => (item.id === id ? { ...item, ...input } : item))
      return { id, ...input }
    }),
    remove: vi.fn(async (id: number) => {
      tournaments = tournaments.filter((item) => item.id !== id)
    })
  }
  window.api = {
    remote: remoteStub,
    players: {
      list: vi.fn(async () => [
        {
          id: 1,
          lastName: 'Иванов',
          firstName: 'Иван',
          middleName: '',
          groupIds: [1]
        }
      ]),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
    },
    groups: {
      list: vi.fn(async () => groupsInit),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
    },
    tournament: {
      settings: settingsApi,
      tournaments: tournamentsApi,
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
    },
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
  return { settingsApi, tournamentsApi }
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
  const onOpenChart = vi.fn()

  it('shows the tournaments sub-tab by default', () => {
    installApi([])
    const { container, getByRole } = render(<TournamentsPanel onOpenChart={onOpenChart} />)

    expect(getByRole('tab', { name: 'Турниры' })).toHaveAttribute('aria-selected', 'true')
    expect(getByRole('tabpanel', { name: 'Турниры' })).toBeInTheDocument()
    expect(container.querySelector('.tournaments-settings')).not.toBeInTheDocument()
  })

  it('lists tournaments with group, date and settings', async () => {
    installApi(
      [standard],
      [
        {
          id: 1,
          name: 'Осенний',
          groupId: 1,
          startDate: '2026-10-01',
          settingsId: 1
        }
      ]
    )
    const { findByText } = render(<TournamentsPanel onOpenChart={onOpenChart} />)

    expect(await findByText('Осенний')).toBeInTheDocument()
    expect(await findByText('7А · 01.10.2026 · Стандарт')).toBeInTheDocument()
  })

  it('opens the chart overlay from the tournament row', async () => {
    const onOpenChart = vi.fn()
    installApi(
      [standard],
      [{ id: 1, name: 'Осенний', groupId: 1, startDate: '2026-10-01', settingsId: 1 }]
    )
    const user = userEvent.setup()
    const { findByRole } = render(<TournamentsPanel onOpenChart={onOpenChart} />)

    await user.click(await findByRole('button', { name: 'График: Осенний' }))

    expect(onOpenChart).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Осенний' }))
  })

  it('creates a tournament through the form', async () => {
    const { tournamentsApi } = installApi([standard])
    const user = userEvent.setup()
    const { findByRole } = render(<TournamentsPanel onOpenChart={onOpenChart} />)

    await user.click(await findByRole('button', { name: 'Добавить турнир' }))
    const dialog = await findByRole('dialog')
    await user.type(dialog.querySelector('input')!, 'Осенний')
    await user.selectOptions(dialog.querySelectorAll('select')[0]!, '1')
    fireEvent.change(dialog.querySelector('input[type="date"]')!, {
      target: { value: '2026-10-01' }
    })
    await user.selectOptions(dialog.querySelectorAll('select')[1]!, '1')
    await user.click(await findByRole('button', { name: 'Создать' }))

    await waitFor(() =>
      expect(tournamentsApi.create).toHaveBeenCalledWith({
        name: 'Осенний',
        groupId: 1,
        startDate: '2026-10-01',
        settingsId: 1
      })
    )
  })

  it('deletes a tournament after confirmation', async () => {
    const { tournamentsApi } = installApi(
      [standard],
      [
        {
          id: 1,
          name: 'Осенний',
          groupId: 1,
          startDate: '2026-10-01',
          settingsId: 1
        }
      ]
    )
    const user = userEvent.setup()
    const { findByRole, queryByText } = render(<TournamentsPanel onOpenChart={onOpenChart} />)

    await user.click(await findByRole('button', { name: 'Удалить: Осенний' }))
    await user.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(tournamentsApi.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('Осенний')).not.toBeInTheDocument())
  })

  it('lists settings in the settings sub-tab', async () => {
    installApi([standard])
    const user = userEvent.setup()
    const { getByRole, findByText } = render(<TournamentsPanel onOpenChart={onOpenChart} />)

    await user.click(getByRole('tab', { name: 'Настройки' }))

    expect(
      await findByText('слабый — белыми · ничья: в пользу слабого · неявка: поражение неявившемуся')
    ).toBeInTheDocument()
  })

  it('creates a setting through the form', async () => {
    const { settingsApi } = installApi([])
    const user = userEvent.setup()
    const { getByRole, findByRole, findByText } = render(
      <TournamentsPanel onOpenChart={onOpenChart} />
    )

    await user.click(getByRole('tab', { name: 'Настройки' }))
    await user.click(await findByRole('button', { name: 'Добавить настройку' }))
    const dialog = await findByRole('dialog')
    await user.type(dialog.querySelector('input')!, 'Блиц')
    await user.click(getByRole('button', { name: 'Создать' }))

    await waitFor(() =>
      expect(settingsApi.create).toHaveBeenCalledWith({
        name: 'Блиц',
        weakerPlaysWhite: true,
        drawScoring: 'weaker',
        absenceScoring: 'loss'
      })
    )
    expect(await findByText('Блиц')).toBeInTheDocument()
  })

  it('deletes a setting after confirmation', async () => {
    const { settingsApi } = installApi([standard])
    const user = userEvent.setup()
    const { getByRole, findByRole, queryByText } = render(
      <TournamentsPanel onOpenChart={onOpenChart} />
    )

    await user.click(getByRole('tab', { name: 'Настройки' }))
    await user.click(await findByRole('button', { name: 'Удалить: Стандарт' }))
    await user.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(settingsApi.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('Стандарт')).not.toBeInTheDocument())
  })
})
