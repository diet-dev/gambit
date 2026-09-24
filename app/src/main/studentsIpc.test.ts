import { describe, expect, it, vi } from 'vitest'
import { registerStudentsIpc } from './studentsIpc'
import type { IpcMainLike } from './remoteIpc'
import type { StudentStore } from './studentStore'

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

function createStore(): StudentStore {
  return {
    list: vi.fn(() => []),
    create: vi.fn((input) => ({ id: 1, ...input })),
    update: vi.fn((student) => student),
    remove: vi.fn()
  }
}

describe('registerStudentsIpc', () => {
  it('routes list/create/update/remove to the store', () => {
    const { ipcMain, invoke } = createIpcMain()
    const store = createStore()
    registerStudentsIpc({ ipcMain, store })

    expect(invoke('students:list')).toEqual([])

    const input = {
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: '',
      className: '7А',
      rating: 0
    }
    expect(invoke('students:create', input)).toEqual({ id: 1, ...input })
    expect(store.create).toHaveBeenCalledWith(input)

    const student = { id: 1, ...input }
    expect(invoke('students:update', student)).toEqual(student)
    expect(store.update).toHaveBeenCalledWith(student)

    invoke('students:remove', 1)
    expect(store.remove).toHaveBeenCalledWith(1)
  })
})
