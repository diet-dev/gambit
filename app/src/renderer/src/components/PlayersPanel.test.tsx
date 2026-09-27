import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayersPanel from './PlayersPanel'
import type { RemoteApi } from '../../../shared/remote'
import type { Group, GroupInput, GroupsApi } from '../../../shared/groups'
import type { Player, PlayerInput, PlayersApi } from '../../../shared/players'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

function installApi(
  playersInit: Player[],
  groupsInit: Group[]
): { playersApi: PlayersApi; groupsApi: GroupsApi } {
  let players = [...playersInit]
  let groups = [...groupsInit]
  const playersApi = {
    list: vi.fn(async () => players),
    create: vi.fn(async (input: PlayerInput) => {
      const created = { id: players.length + 1, ...input }
      players = [...players, created]
      return created
    }),
    update: vi.fn(async (player: Player) => {
      players = players.map((item) => (item.id === player.id ? player : item))
      return player
    }),
    remove: vi.fn(async (id: number) => {
      players = players.filter((item) => item.id !== id)
    })
  }
  const groupsApi = {
    list: vi.fn(async () => groups),
    create: vi.fn(async (input: GroupInput) => {
      const created = { id: groups.length + 1, ...input }
      groups = [...groups, created]
      return created
    }),
    update: vi.fn(async (group: Group) => {
      groups = groups.map((item) => (item.id === group.id ? group : item))
      return group
    }),
    remove: vi.fn(async (id: number) => {
      groups = groups.filter((item) => item.id !== id)
    })
  }
  window.api = { remote: remoteStub, players: playersApi, groups: groupsApi }
  return { playersApi, groupsApi }
}

const ivanov: Player = {
  id: 1,
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  groupIds: [1, 2]
}

const groups: Group[] = [
  { id: 1, name: '7А', comment: '' },
  { id: 2, name: '8Б', comment: '' }
]

describe('PlayersPanel', () => {
  it('shows an empty state', async () => {
    installApi([], groups)
    const { findByText } = render(<PlayersPanel />)

    expect(await findByText('Игроков пока нет')).toBeInTheDocument()
  })

  it('lists players with their group names', async () => {
    installApi([ivanov], groups)
    const { findByText, container } = render(<PlayersPanel />)

    expect(await findByText('Иванов Иван Иванович')).toBeInTheDocument()
    expect(container).toHaveTextContent('7А, 8Б')
  })

  it('creates a player with the selected groups', async () => {
    const { playersApi } = installApi([], groups)
    const user = userEvent.setup()
    const { getByRole, getByLabelText, findByText } = render(<PlayersPanel />)

    await user.click(getByRole('button', { name: 'Добавить игрока' }))
    await user.type(getByLabelText(/Фамилия/), 'Петров')
    await user.type(getByLabelText(/Имя/), 'Пётр')
    await user.selectOptions(getByRole('listbox'), ['1', '2'])
    await user.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(playersApi.create).toHaveBeenCalledWith({
        lastName: 'Петров',
        firstName: 'Пётр',
        middleName: '',
        groupIds: [1, 2]
      })
    )
    expect(await findByText('Петров Пётр')).toBeInTheDocument()
  })

  it('requires at least one group', async () => {
    const { playersApi } = installApi([], groups)
    const user = userEvent.setup()
    const { getByRole, getByLabelText, findByText } = render(<PlayersPanel />)

    await user.click(getByRole('button', { name: 'Добавить игрока' }))
    await user.type(getByLabelText(/Фамилия/), 'Петров')
    await user.type(getByLabelText(/Имя/), 'Пётр')
    await user.click(getByRole('button', { name: 'Сохранить' }))

    expect(await findByText('Выберите хотя бы одну группу')).toBeInTheDocument()
    expect(playersApi.create).not.toHaveBeenCalled()
  })

  it('blocks saving when there are no groups at all', async () => {
    installApi([], [])
    const user = userEvent.setup()
    const { getByRole } = render(<PlayersPanel />)

    await user.click(getByRole('button', { name: 'Добавить игрока' }))

    expect(getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    expect(getByTextSafe(getByRole('dialog'), 'Сначала добавьте группу')).toBeInTheDocument()
  })

  it('deletes a player after confirmation', async () => {
    const { playersApi } = installApi([ivanov], groups)
    const { getByRole, findByText, queryByText, findByRole } = render(<PlayersPanel />)

    await findByText('Иванов Иван Иванович')
    fireEvent.click(getByRole('button', { name: 'Удалить: Иванов' }))
    fireEvent.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(playersApi.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('Иванов Иван Иванович')).not.toBeInTheDocument())
  })
})

function getByTextSafe(container: HTMLElement, text: string): HTMLElement {
  const element = Array.from(container.querySelectorAll('.entity-error')).find((item) =>
    item.textContent?.includes(text)
  )
  if (!element) {
    throw new Error(`Expected error text "${text}" not found`)
  }
  return element as HTMLElement
}
