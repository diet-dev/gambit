import { describe, expect, it, vi } from 'vitest'
import { registerSituationsIpc } from './situationsIpc'
import type { IpcMainLike } from './remoteIpc'
import type { SituationStore } from './situationStore'

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

function createStore(): SituationStore {
  return {
    list: vi.fn(() => []),
    create: vi.fn((input) => ({
      id: 1,
      groupId: input.groupId ?? 2,
      title: input.title,
      description: input.description,
      comment: input.comment,
      fen: input.fen,
      sortOrder: 1
    }))
  }
}

describe('registerSituationsIpc', () => {
  it('routes list and create to the store', () => {
    const { ipcMain, invoke } = createIpcMain()
    const store = createStore()
    registerSituationsIpc({ ipcMain, store })

    expect(invoke('situations:list')).toEqual([])

    const input = {
      groupName: 'Мои позиции',
      title: 'Позиция',
      description: '',
      comment: '',
      fen: '8/8/8/8/8/8/8/K6k w - - 0 2'
    }
    invoke('situations:create', input)
    expect(store.create).toHaveBeenCalledWith(input)
  })
})
