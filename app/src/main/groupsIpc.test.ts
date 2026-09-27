import { describe, expect, it, vi } from 'vitest'
import { registerGroupsIpc } from './groupsIpc'
import type { IpcMainLike } from './remoteIpc'
import type { GroupStore } from './groupStore'

function createIpcMain(): {
  ipcMain: IpcMainLike
  invoke: (channel: string, ...args: unknown[]) => unknown
} {
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  return {
    ipcMain: {
      on: () => {},
      handle: (channel, listener) => handlers.set(channel, listener)
    },
    invoke: (channel, ...args) => handlers.get(channel)?.({}, ...args)
  }
}

function createStore(): GroupStore {
  return {
    list: vi.fn(() => []),
    create: vi.fn((input) => ({ id: 1, ...input })),
    update: vi.fn((group) => group),
    remove: vi.fn()
  }
}

describe('registerGroupsIpc', () => {
  it('routes list/create/update/remove to the store', () => {
    const { ipcMain, invoke } = createIpcMain()
    const store = createStore()
    registerGroupsIpc({ ipcMain, store })

    expect(invoke('groups:list')).toEqual([])

    const input = { name: '7А', comment: '' }
    expect(invoke('groups:create', input)).toEqual({ id: 1, ...input })
    expect(store.create).toHaveBeenCalledWith(input)

    const group = { id: 1, ...input }
    expect(invoke('groups:update', group)).toEqual(group)
    expect(store.update).toHaveBeenCalledWith(group)

    invoke('groups:remove', 1)
    expect(store.remove).toHaveBeenCalledWith(1)
  })
})
