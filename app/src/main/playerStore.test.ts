import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createGroupStore, type GroupStore } from './groupStore'
import { createPlayerStore, type PlayerStore } from './playerStore'

function makeStores(): { players: PlayerStore; groups: GroupStore } {
  const database = openDatabase(':memory:')
  return {
    players: createPlayerStore(database),
    groups: createGroupStore(database)
  }
}

const input = {
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  rating: 100
}

describe('playerStore', () => {
  it('creates a player and lists it', () => {
    const { players, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })

    const created = players.create({ ...input, groupId: group.id })

    expect(created.id).toBeGreaterThan(0)
    expect(created).toMatchObject({ ...input, groupId: group.id })
    expect(players.list()).toEqual([created])
  })

  it('updates a player including the group', () => {
    const { players, groups } = makeStores()
    const sevenA = groups.create({ name: '7А', comment: '' })
    const eightB = groups.create({ name: '8Б', comment: '' })
    const created = players.create({ ...input, groupId: sevenA.id })

    const updated = players.update({ ...created, rating: 250, groupId: eightB.id })

    expect(updated).toMatchObject({ id: created.id, rating: 250, groupId: eightB.id })
    expect(players.list()[0].groupId).toBe(eightB.id)
  })

  it('clears the group without deleting the player', () => {
    const { players, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })
    const created = players.create({ ...input, groupId: group.id })

    const updated = players.update({ ...created, groupId: null })

    expect(updated).toMatchObject({ id: created.id, groupId: null })
    expect(players.list()[0].groupId).toBe(null)
  })

  it('removes a player', () => {
    const { players, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })
    const created = players.create({ ...input, groupId: group.id })

    players.remove(created.id)

    expect(players.list()).toHaveLength(0)
  })

  it('lists players ordered by last name', () => {
    const { players, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })
    players.create({ ...input, lastName: 'Яковлев', groupId: group.id })
    players.create({ ...input, lastName: 'Абрамов', groupId: group.id })

    expect(players.list().map((player) => player.lastName)).toEqual(['Абрамов', 'Яковлев'])
  })
})
