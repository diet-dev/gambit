import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import GroupsPanel from './GroupsPanel'
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

const playersStub: PlayersApi = {
  list: vi.fn(async () => []),
  create: vi.fn(async (input: PlayerInput) => ({ id: 1, ...input })),
  update: vi.fn(async (player: Player) => player),
  remove: vi.fn(async () => {})
}

function installApi(initial: Group[]): GroupsApi {
  let groups = [...initial]
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
  window.api = {
    remote: remoteStub,
    players: playersStub,
    groups: groupsApi,
    tournament: {
      settings: {
        list: vi.fn(async () => []),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      }
    }
  }
  return groupsApi
}

describe('GroupsPanel', () => {
  it('shows an empty state', async () => {
    installApi([])
    const { findByText } = render(<GroupsPanel />)

    expect(await findByText('Групп пока нет')).toBeInTheDocument()
  })

  it('lists groups with name and comment', async () => {
    installApi([{ id: 1, name: '7А', comment: 'первый' }])
    const { findByText, container } = render(<GroupsPanel />)

    expect(await findByText('7А')).toBeInTheDocument()
    expect(container).toHaveTextContent('первый')
  })

  it('creates a group through the form', async () => {
    const api = installApi([])
    const { getByRole, getByLabelText, findByText } = render(<GroupsPanel />)

    fireEvent.click(getByRole('button', { name: 'Добавить группу' }))
    fireEvent.change(getByLabelText(/Название/), { target: { value: '8Б' } })
    fireEvent.change(getByLabelText('Комментарий'), { target: { value: 'второй' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(api.create).toHaveBeenCalledWith({ name: '8Б', comment: 'второй' }))
    expect(await findByText('8Б')).toBeInTheDocument()
  })

  it('normalizes the group name to uppercase russian letters, digits and single hyphens', () => {
    installApi([])
    const { getByRole, getByLabelText } = render(<GroupsPanel />)

    fireEvent.click(getByRole('button', { name: 'Добавить группу' }))
    const input = getByLabelText(/Название/) as HTMLInputElement
    fireEvent.change(input, { target: { value: '7а--8 б.' } })

    expect(input.value).toBe('7А-8Б')
  })

  it('rejects a duplicate group name', async () => {
    const api = installApi([{ id: 1, name: '7А', comment: '' }])
    const { getByRole, getByLabelText, findByText } = render(<GroupsPanel />)

    await findByText('7А')
    fireEvent.click(getByRole('button', { name: 'Добавить группу' }))
    fireEvent.change(getByLabelText(/Название/), { target: { value: '7А' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    expect(await findByText('Группа с таким именем уже есть')).toBeInTheDocument()
    expect(api.create).not.toHaveBeenCalled()
  })

  it('deletes a group after confirmation', async () => {
    const api = installApi([{ id: 1, name: '7А', comment: '' }])
    const { getByRole, findByText, queryByText, findByRole } = render(<GroupsPanel />)

    await findByText('7А')
    fireEvent.click(getByRole('button', { name: 'Удалить: 7А' }))
    fireEvent.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('7А')).not.toBeInTheDocument())
  })

  it('keeps the dialog open with the error when the removal is rejected', async () => {
    const api = installApi([{ id: 1, name: '7А', comment: '' }])
    api.remove = vi.fn(async () => {
      throw new Error('Нельзя удалить группу «7А»: она единственная для игрока Иванов Иван')
    })
    const { getByRole, findByText, findByRole, queryByText } = render(<GroupsPanel />)

    await findByText('7А')
    fireEvent.click(getByRole('button', { name: 'Удалить: 7А' }))
    fireEvent.click(await findByRole('button', { name: 'Удалить' }))

    expect(await findByText(/она единственная для игрока/)).toBeInTheDocument()
    expect(getByRole('dialog')).toBeInTheDocument()
    expect(queryByText('Удалить группу?')).not.toBeNull()
  })
})
