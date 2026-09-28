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

function installApi(situationsApi: Partial<SituationsApi>): void {
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
    situations: {
      list: vi.fn(async () => []),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      ...situationsApi
    }
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
  it('shows the group select, the fields and the board preview', async () => {
    installApi({ list: vi.fn(async () => groups), create: vi.fn() })
    const { getByRole, getByText, findByRole, container } = renderOverlay()

    expect(await findByRole('combobox')).toBeInTheDocument()
    expect(getByText('Сохранить ситуацию')).toBeInTheDocument()
    expect(container.querySelector('.situation-save-board')).toBeInTheDocument()
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

  it('edits a situation: prefilled fields, update without fen', async () => {
    const update = vi.fn(async () => ({
      id: 5,
      groupId: 5,
      title: 'Мат Легаля — правка',
      description: 'desc',
      comment: 'comment',
      fen,
      sortOrder: 1
    }))
    const create = vi.fn()
    installApi({ list: vi.fn(async () => groups), create, update })
    const user = userEvent.setup()
    const { getByRole, findByRole, getByText } = render(
      <SituationSaveOverlay fen={fen} situation={situation} onClose={() => {}} onSaved={() => {}} />
    )

    expect(getByText('Редактировать ситуацию')).toBeInTheDocument()
    const titleInput = getByRole('textbox', { name: /Название ситуации/ }) as HTMLInputElement
    expect(titleInput.value).toBe(situation.title)
    expect(await findByRole('combobox')).toHaveValue('5')

    await user.clear(titleInput)
    await user.type(titleInput, 'Мат Легаля — правка')
    await user.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        id: situation.id,
        groupId: situation.groupId,
        title: 'Мат Легаля — правка',
        description: situation.description,
        comment: situation.comment
      })
    )
    expect(create).not.toHaveBeenCalled()
  })
})

const situation = {
  id: 5,
  groupId: 5,
  title: 'Мат Легаля',
  description: 'Классическая ловушка в дебюте.',
  comment: 'Комментарий',
  fen: 'rn1q1bnr/ppp1kB1p/3p2p1/3NN3/4P3/8/PPPP1PPP/R1BbK2R b KQ - 2 7',
  sortOrder: 1
}
