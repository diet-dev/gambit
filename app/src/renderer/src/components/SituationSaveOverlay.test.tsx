import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SituationSaveOverlay from './SituationSaveOverlay'
import type { SituationGroup, SituationsApi } from '../../../shared/situations'
import type { DatabaseApi } from '../../../shared/database'
import type { GroupsApi } from '../../../shared/groups'
import type { PlayersApi } from '../../../shared/players'
import type { TournamentApi } from '../../../shared/tournament'

const groups: SituationGroup[] = [
  {
    id: 5,
    name: 'Маты',
    sortOrder: 1,
    situations: []
  }
]

function installApi(situationsApi: SituationsApi): void {
  window.api = {
    remote: {
      publishPosition: vi.fn(),
      onRemoteMove: vi.fn(() => () => {}),
      getServerInfo: vi.fn(async () => null),
      getClients: vi.fn(async () => []),
      onClientsChanged: vi.fn(() => () => {})
    },
    players: {
      list: vi.fn(async () => [])
    } as unknown as PlayersApi,
    groups: {
      list: vi.fn(async () => [])
    } as unknown as GroupsApi,
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
    } as unknown as TournamentApi,
    database: {
      exportSnapshot: vi.fn(async () => null)
    } as DatabaseApi,
    situations: situationsApi
  }
}

const fen = '6k1/5ppp/8/8/8/8/8/4Q1K1 w - - 0 1'

function renderOverlay(): ReturnType<typeof render> {
  return render(<SituationSaveOverlay fen={fen} onClose={() => {}} onSaved={() => {}} />)
}

afterEach(() => {
  window.api = undefined as unknown as typeof window.api
})

describe('SituationSaveOverlay', () => {
  it('shows the group select, the fields and the saved position', async () => {
    installApi({ list: vi.fn(async () => groups), create: vi.fn() })
    const { getByRole, getByText, findByRole } = renderOverlay()

    expect(await findByRole('combobox')).toBeInTheDocument()
    expect(getByText('Сохранить ситуацию')).toBeInTheDocument()
    expect(getByText(`Позиция: ${fen}`)).toBeInTheDocument()
    expect(getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('creates a situation in an existing group', async () => {
    const create = vi.fn(async () => ({
      id: 9,
      groupId: 5,
      title: 'Мат на диагонали',
      description: '',
      comment: '',
      fen,
      sortOrder: 1
    }))
    installApi({ list: vi.fn(async () => groups), create })
    const user = userEvent.setup()
    const { getByRole, findByRole } = renderOverlay()

    await user.selectOptions(await findByRole('combobox'), '5')
    await user.type(getByRole('textbox', { name: /Название ситуации/ }), 'Мат на диагонали')
    await user.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        groupId: 5,
        title: 'Мат на диагонали',
        description: '',
        comment: '',
        fen
      })
    )
  })

  it('creates a new group and normalizes texts on save', async () => {
    const create = vi.fn(async () => ({
      id: 9,
      groupId: 7,
      title: 'Моя позиция',
      description: '',
      comment: '',
      fen,
      sortOrder: 1
    }))
    installApi({ list: vi.fn(async () => groups), create })
    const user = userEvent.setup()
    const { getByRole, findByRole } = renderOverlay()

    await findByRole('combobox')
    await user.selectOptions(getByRole('combobox'), 'new')
    await user.type(getByRole('textbox', { name: /Название группы/ }), '  мои   позиции ')
    await user.type(getByRole('textbox', { name: /Название ситуации/ }), '  моя   позиция ')
    await user.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        groupName: 'Мои позиции',
        title: 'Моя позиция',
        description: '',
        comment: '',
        fen
      })
    )
  })

  it('shows a backend error in the form', async () => {
    installApi({
      list: vi.fn(async () => groups),
      create: vi.fn(async () => Promise.reject(new Error('Позиция уже сохранена: «Мат»')))
    })
    const user = userEvent.setup()
    const { getByRole, findByRole, findByText } = renderOverlay()

    await findByRole('combobox')
    await user.selectOptions(getByRole('combobox'), '5')
    await user.type(getByRole('textbox', { name: /Название ситуации/ }), 'Мат на диагонали')
    await user.click(getByRole('button', { name: 'Сохранить' }))

    expect(await findByText('Позиция уже сохранена: «Мат»')).toBeInTheDocument()
  })
})
