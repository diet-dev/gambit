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

    const created = players.create({ ...input, groupIds: [group.id] })

    expect(created.id).toBeGreaterThan(0)
    expect(created).toMatchObject({ ...input, groupIds: [group.id] })
    expect(players.list()).toEqual([created])
  })

  it('rejects a player without groups', () => {
    const { players } = makeStores()

    expect(() => players.create({ ...input, groupIds: [] })).toThrow(
      'У игрока должна быть минимум одна группа'
    )
  })

  it('updates a player including groups', () => {
    const { players, groups } = makeStores()
    const sevenA = groups.create({ name: '7А', comment: '' })
    const eightB = groups.create({ name: '8Б', comment: '' })
    const nineV = groups.create({ name: '9В', comment: '' })
    const created = players.create({ ...input, groupIds: [sevenA.id] })

    const updated = players.update({ ...created, rating: 250, groupIds: [eightB.id, nineV.id] })

    expect(updated).toMatchObject({ id: created.id, rating: 250, groupIds: [eightB.id, nineV.id] })
    expect(players.list()[0].groupIds).toEqual([eightB.id, nineV.id])
  })

  it('rejects clearing all groups on update', () => {
    const { players, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })
    const created = players.create({ ...input, groupIds: [group.id] })

    expect(() => players.update({ ...created, groupIds: [] })).toThrow(
      'У игрока должна быть минимум одна группа'
    )
  })

  it('keeps memberships of other players when regrouping one', () => {
    const { players, groups } = makeStores()
    const sevenA = groups.create({ name: '7А', comment: '' })
    const eightB = groups.create({ name: '8Б', comment: '' })
    players.create({ ...input, lastName: 'Иванов', groupIds: [sevenA.id] })
    const petrov = players.create({ ...input, lastName: 'Петров', groupIds: [sevenA.id] })

    players.update({ ...petrov, groupIds: [eightB.id] })

    expect(players.list().find((p) => p.lastName === 'Иванов')?.groupIds).toEqual([sevenA.id])
  })

  it('removes a player', () => {
    const { players, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })
    const created = players.create({ ...input, groupIds: [group.id] })

    players.remove(created.id)

    expect(players.list()).toHaveLength(0)
  })

  it('lists players ordered by last name', () => {
    const { players, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })
    players.create({ ...input, lastName: 'Яковлев', groupIds: [group.id] })
    players.create({ ...input, lastName: 'Абрамов', groupIds: [group.id] })

    expect(players.list().map((player) => player.lastName)).toEqual(['Абрамов', 'Яковлев'])
  })
})
