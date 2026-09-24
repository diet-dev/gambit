import { describe, expect, it, vi } from 'vitest'
import { registerClassesIpc } from './classesIpc'
import type { IpcMainLike } from './remoteIpc'
import type { ClassStore } from './classStore'

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

function createStore(): ClassStore {
  return {
    list: vi.fn(() => []),
    create: vi.fn((input) => ({ id: 1, ...input })),
    update: vi.fn((schoolClass) => schoolClass),
    remove: vi.fn()
  }
}

describe('registerClassesIpc', () => {
  it('routes list/create/update/remove to the store', () => {
    const { ipcMain, invoke } = createIpcMain()
    const store = createStore()
    registerClassesIpc({ ipcMain, store })

    expect(invoke('classes:list')).toEqual([])

    const input = { name: '7А', comment: '' }
    expect(invoke('classes:create', input)).toEqual({ id: 1, ...input })
    expect(store.create).toHaveBeenCalledWith(input)

    const schoolClass = { id: 1, ...input }
    expect(invoke('classes:update', schoolClass)).toEqual(schoolClass)
    expect(store.update).toHaveBeenCalledWith(schoolClass)

    invoke('classes:remove', 1)
    expect(store.remove).toHaveBeenCalledWith(1)
  })
})
