import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import App from './App'
import type { RemoteApi } from '../../shared/remote'
import type { DatabaseApi } from '../../shared/database'
import type { SituationGroup, SituationsApi } from '../../shared/situations'
import type { GroupsApi } from '../../shared/groups'
import type { PlayersApi } from '../../shared/players'
import type { TournamentApi } from '../../shared/tournament'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

const groups: SituationGroup[] = [
  {
    id: 1,
    name: 'Начало',
    sortOrder: 1,
    situations: [
      {
        id: 1,
        groupId: 1,
        title: 'Начальная позиция',
        description: 'Классическое начало игры. Белые ходят первыми.',
        comment: 'Начальная позиция — точка отсчёта любой партии.',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        sortOrder: 1
      }
    ]
  },
  {
    id: 2,
    name: 'Маты',
    sortOrder: 2,
    situations: [
      {
        id: 2,
        groupId: 2,
        title: 'Мат в один ход',
        description: 'Найдите ход, который сразу ставит мат.',
        comment: 'Ферзь с e1 идёт на e8.',
        fen: '6k1/5ppp/8/8/8/8/8/4Q1K1 w - - 0 1',
        sortOrder: 1
      }
    ]
  }
]

const situationsApi: SituationsApi = {
  list: vi.fn(async () => groups),
  create: vi.fn(async () => ({ ...groups[0].situations[0], id: 99 })),
  update: vi.fn(async () => ({ ...groups[0].situations[0] })),
  remove: vi.fn(async () => undefined)
}

function installApi(): void {
  window.api = {
    remote: remoteStub,
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

describe('App', () => {
  it('renders the situation list on the left and the board in the right panel', async () => {
    installApi()
    const { container, findByRole } = render(<App />)

    expect(await findByRole('button', { name: /^Начальная позиция/ })).toBeInTheDocument()
    expect(container.querySelector('.left-panel .situation-list')).toBeInTheDocument()
    expect(container.querySelector('.right-panel')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
  })

  it('loads a situation onto the board when it is clicked', async () => {
    installApi()
    const { container, getByRole, findByRole } = render(<App />)
    await findByRole('button', { name: /^Начальная позиция/ })

    fireEvent.click(getByRole('button', { name: /Мат в один ход/ }))

    expect(container.querySelector('[data-square="g8"] [data-piece="bK"]')).toBeInTheDocument()
    expect(container.querySelector('[data-square="e1"] [data-piece="wQ"]')).toBeInTheDocument()
  })

  it('switches the left panel to the devices tab', async () => {
    installApi()
    const { container, getByRole, findByRole, queryByRole } = render(<App />)
    await findByRole('button', { name: /Мат в один ход/ })

    fireEvent.click(getByRole('button', { name: 'Устройства' }))

    expect(getByRole('button', { name: 'Устройства' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .devices-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the events tab', async () => {
    installApi()
    const { container, getByRole, findByRole, queryByRole } = render(<App />)
    await findByRole('button', { name: /Мат в один ход/ })

    fireEvent.click(getByRole('button', { name: 'События' }))

    expect(getByRole('button', { name: 'События' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .events-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the tournaments tab', async () => {
    installApi()
    const { container, getByRole, findByRole, queryByRole } = render(<App />)
    await findByRole('button', { name: /Мат в один ход/ })

    fireEvent.click(getByRole('button', { name: 'Турниры' }))

    expect(getByRole('button', { name: 'Турниры' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .tournaments-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the groups tab', async () => {
    installApi()
    const { container, getByRole, findByRole, queryByRole } = render(<App />)
    await findByRole('button', { name: /Мат в один ход/ })

    fireEvent.click(getByRole('button', { name: 'Группы' }))

    expect(getByRole('button', { name: 'Группы' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .groups-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the rounds tab', async () => {
    installApi()
    const { container, getByRole, findByRole, queryByRole } = render(<App />)
    await findByRole('button', { name: /Мат в один ход/ })

    fireEvent.click(getByRole('button', { name: 'Раунды' }))

    expect(getByRole('button', { name: 'Раунды' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .rounds-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the players tab', async () => {
    installApi()
    const { container, getByRole, findByRole, queryByRole } = render(<App />)
    await findByRole('button', { name: /Мат в один ход/ })

    fireEvent.click(getByRole('button', { name: 'Игроки' }))

    expect(getByRole('button', { name: 'Игроки' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .players-panel')).toBeInTheDocument()
  })

  it('restarts the active situation by remounting the board', async () => {
    installApi()
    const { container, getByRole, findByRole } = render(<App />)
    await findByRole('button', { name: /^Начальная позиция/ })
    const boardBefore = container.querySelector('.board')

    fireEvent.click(getByRole('button', { name: /Сбросить: Начальная позиция/ }))

    expect(container.querySelector('.board')).not.toBe(boardBefore)
    expect(container.querySelector('[data-square="e2"] [data-piece="wP"]')).toBeInTheDocument()
  })

  it('switches the left panel to the settings and help tabs', async () => {
    installApi()
    const { container, getByRole, findByRole } = render(<App />)
    await findByRole('button', { name: /^Начальная позиция/ })

    fireEvent.click(getByRole('button', { name: 'Настройки' }))
    expect(container.querySelector('.left-panel .settings-panel')).toBeInTheDocument()
    expect(getByRole('radiogroup', { name: 'Тема оформления' })).toBeInTheDocument()

    fireEvent.click(getByRole('button', { name: 'Справка' }))
    expect(container.querySelector('.left-panel .help-panel')).toBeInTheDocument()
  })

  it('opens a help article over the board and closes it when leaving the tab', async () => {
    installApi()
    const { container, getByRole, findByRole } = render(<App />)
    await findByRole('button', { name: /^Начальная позиция/ })

    fireEvent.click(getByRole('button', { name: 'Справка' }))
    fireEvent.click(getByRole('button', { name: 'Лицензия' }))

    expect(container.querySelector('.right-panel .help-overlay')).toBeInTheDocument()

    fireEvent.click(getByRole('button', { name: 'Ситуации' }))

    expect(container.querySelector('.help-overlay')).not.toBeInTheDocument()
  })

  it('reflects the selected situation in the window title', async () => {
    installApi()
    const { getByRole, findByRole } = render(<App />)

    expect(await findByRole('button', { name: /^Начальная позиция/ })).toBeInTheDocument()
    expect(document.title).toBe('Гамбит — Начальная позиция')

    fireEvent.click(getByRole('button', { name: /Мат в один ход/ }))

    expect(document.title).toBe('Гамбит — Мат в один ход')
  })

  it('opens the comment dialog for the active situation and closes it on Escape', async () => {
    installApi()
    const { queryByRole, getByRole, findByRole } = render(<App />)
    await findByRole('button', { name: /^Начальная позиция/ })

    fireEvent.click(getByRole('button', { name: /Подробнее: Начальная позиция/ }))

    const dialog = getByRole('dialog')
    expect(dialog).toHaveTextContent('Начальная позиция')
    expect(dialog).toHaveTextContent('точка отсчёта любой партии')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('edits a situation through the overlay', async () => {
    installApi()
    const { getByRole, findByRole } = render(<App />)
    await findByRole('button', { name: /^Начальная позиция/ })

    fireEvent.click(getByRole('button', { name: /Редактировать: Начальная позиция/ }))

    const overlay = getByRole('button', { name: 'Сохранить' }).closest('form')
    expect(overlay).not.toBeNull()
    const titleInput = getByRole('textbox', { name: /Название ситуации/ }) as HTMLInputElement
    expect(titleInput.value).toBe('Начальная позиция')

    fireEvent.change(titleInput, { target: { value: 'Начальная позиция — правка' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(situationsApi.update).toHaveBeenCalled())
    expect(situationsApi.create).not.toHaveBeenCalled()
  })

  it('deletes a situation after confirmation', async () => {
    installApi()
    const { getByRole, findByRole, queryByRole } = render(<App />)
    await findByRole('button', { name: /^Начальная позиция/ })

    fireEvent.click(getByRole('button', { name: /Удалить: Начальная позиция/ }))

    const dialog = getByRole('dialog')
    expect(dialog).toHaveTextContent('Удалить ситуацию?')
    expect(dialog).toHaveTextContent('Начальная позиция')

    fireEvent.click(getByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(situationsApi.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByRole('dialog')).not.toBeInTheDocument())
  })
})
