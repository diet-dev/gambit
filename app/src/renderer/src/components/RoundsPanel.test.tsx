import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoundsPanel from './RoundsPanel'
import type { RemoteApi } from '../../../shared/remote'
import type { Round, RoundsApi, Tournament } from '../../../shared/tournament'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

const standard = {
  id: 1,
  name: 'Стандарт',
  weakerPlaysWhite: true,
  drawScoring: 'weaker',
  absenceScoring: 'loss',
  createdAt: '2026-09-27T00:00:00.000Z',
  used: true
} as const

function installApi(tournaments: Tournament[], rounds: Round[]): RoundsApi {
  const roundsApi = {
    list: vi.fn(async () => rounds),
    results: vi.fn(async () => []),
    preview: vi.fn(async () => ({ seq: 1, pairs: [], restingPlayerId: null })),
    create: vi.fn(async () => ({
      round: { id: 1, tournamentId: 1, seq: 1, playedDate: '', settingsId: 1 },
      pairs: []
    }))
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
    tournament: {
      settings: {
        list: vi.fn(async () => [standard]),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      },
      tournaments: {
        list: vi.fn(async () => tournaments),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      },
      rounds: roundsApi
    }
  }
  return roundsApi
}

describe('RoundsPanel', () => {
  it('hints to create a tournament when there are none', async () => {
    installApi([], [])
    const { getByRole, findByText, queryByRole } = render(
      <RoundsPanel
        selectedTournamentId={null}
        onSelectTournament={() => {}}
        onCreateRound={() => {}}
        onOpenRound={() => {}}
        savedAt={0}
      />
    )

    expect(getByRole('combobox')).toBeEnabled()
    expect(await findByText('Сначала создайте турнир на подвкладке «Турниры»')).toBeInTheDocument()
    expect(queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows an empty state for a tournament without rounds', async () => {
    installApi([{ id: 1, name: 'Осенний', groupId: 1, startDate: '2026-10-01', settingsId: 1 }], [])
    const user = userEvent.setup()
    const { getByRole, findByText } = render(
      <RoundsPanel
        selectedTournamentId={1}
        onSelectTournament={() => {}}
        onCreateRound={() => {}}
        onOpenRound={() => {}}
        savedAt={0}
      />
    )

    await findByText('Осенний')
    await user.selectOptions(getByRole('combobox'), '1')

    expect(await findByText('Раундов пока нет')).toBeInTheDocument()
  })

  it('lists rounds of the selected tournament', async () => {
    const roundsApi = installApi(
      [{ id: 1, name: 'Осенний', groupId: 1, startDate: '2026-10-01', settingsId: 1 }],
      [
        { id: 1, tournamentId: 1, seq: 1, playedDate: '2026-10-01', settingsId: 1 },
        { id: 2, tournamentId: 1, seq: 2, playedDate: '2026-10-08', settingsId: 1 }
      ]
    )
    const user = userEvent.setup()
    const { getByRole, findByText } = render(
      <RoundsPanel
        selectedTournamentId={1}
        onSelectTournament={() => {}}
        onCreateRound={() => {}}
        onOpenRound={() => {}}
        savedAt={0}
      />
    )

    await findByText('Осенний')
    await user.selectOptions(getByRole('combobox'), '1')

    expect(await findByText('№1')).toBeInTheDocument()
    expect(await findByText('01.10.2026 · Стандарт')).toBeInTheDocument()
    expect(await findByText('№2')).toBeInTheDocument()
    expect(await findByText('08.10.2026 · Стандарт')).toBeInTheDocument()
    expect(roundsApi.list).toHaveBeenCalledWith(1)
  })

  it('opens round results on click', async () => {
    installApi(
      [{ id: 1, name: 'Осенний', groupId: 1, startDate: '2026-10-01', settingsId: 1 }],
      [{ id: 7, tournamentId: 1, seq: 2, playedDate: '2026-10-08', settingsId: 1 }]
    )
    const onOpenRound = vi.fn()
    const user = userEvent.setup()
    const { getByRole, findByText } = render(
      <RoundsPanel
        selectedTournamentId={1}
        onSelectTournament={() => {}}
        onCreateRound={() => {}}
        onOpenRound={onOpenRound}
        savedAt={0}
      />
    )

    await findByText('Осенний')
    await user.selectOptions(getByRole('combobox'), '1')
    await user.click(await findByText('№2'))

    expect(onOpenRound).toHaveBeenCalledWith(expect.objectContaining({ id: 7, seq: 2 }))
  })

  it('clears the list when the tournament is deselected', async () => {
    installApi(
      [{ id: 1, name: 'Осенний', groupId: 1, startDate: '2026-10-01', settingsId: 1 }],
      [{ id: 1, tournamentId: 1, seq: 1, playedDate: '2026-10-01', settingsId: 1 }]
    )
    const user = userEvent.setup()
    const props = {
      onSelectTournament: () => {},
      onCreateRound: () => {},
      onOpenRound: () => {},
      savedAt: 0
    }
    const { getByRole, findByText, queryByText, rerender } = render(
      <RoundsPanel selectedTournamentId={1} {...props} />
    )

    await findByText('Осенний')
    await user.selectOptions(getByRole('combobox'), '1')
    await findByText('№1')

    rerender(<RoundsPanel selectedTournamentId={null} {...props} />)

    await waitFor(() => expect(queryByText('№1')).not.toBeInTheDocument())
    expect(queryByText('Раундов пока нет')).not.toBeInTheDocument()
  })
})
