import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createGroupStore, type GroupStore } from './groupStore'
import { createPlayerStore, type PlayerStore } from './playerStore'

function makeStores(): { groups: GroupStore; players: PlayerStore } {
  const database = openDatabase(':memory:')
  return {
    groups: createGroupStore(database),
    players: createPlayerStore(database)
  }
}

describe('groupStore', () => {
  it('creates and lists groups ordered by name', () => {
    const { groups } = makeStores()

    const seven = groups.create({ name: '7А', comment: 'первый' })
    groups.create({ name: '8Б', comment: '' })

    expect(seven.id).toBeGreaterThan(0)
    expect(groups.list()).toEqual([
      { id: seven.id, name: '7А', comment: 'первый' },
      { id: seven.id + 1, name: '8Б', comment: '' }
    ])
  })

  it('rejects an invalid group name', () => {
    const { groups } = makeStores()

    expect(() => groups.create({ name: '7а', comment: '' })).toThrow('Некорректное имя группы')
    expect(() => groups.create({ name: '-7А', comment: '' })).toThrow('Некорректное имя группы')
    expect(() => groups.create({ name: '7А-', comment: '' })).toThrow('Некорректное имя группы')
    expect(() => groups.create({ name: '7--А', comment: '' })).toThrow('Некорректное имя группы')
    expect(() => groups.create({ name: '7A', comment: '' })).toThrow('Некорректное имя группы')
  })

  it('rejects a duplicate group name', () => {
    const { groups } = makeStores()
    groups.create({ name: '7А', comment: '' })

    expect(() => groups.create({ name: '7А', comment: '' })).toThrow()
  })

  it('updates a group', () => {
    const { groups } = makeStores()
    const created = groups.create({ name: '7А', comment: '' })

    const updated = groups.update({ ...created, name: '7Б', comment: 'изменён' })

    expect(updated).toEqual({ id: created.id, name: '7Б', comment: 'изменён' })
  })

  it('refuses to remove a group that is the only one for a player', () => {
    const { groups, players } = makeStores()
    const sevenA = groups.create({ name: '7А', comment: '' })
    const eightB = groups.create({ name: '8Б', comment: '' })
    players.create({
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: '',
      groupIds: [sevenA.id]
    })
    players.create({
      lastName: 'Петров',
      firstName: 'Пётр',
      middleName: '',
      groupIds: [sevenA.id, eightB.id]
    })

    expect(() => groups.remove(sevenA.id)).toThrow(
      'Нельзя удалить группу «7А»: она единственная для игрока Иванов Иван'
    )
    expect(groups.list()).toHaveLength(2)
  })

  it('removes a group and cascades its memberships when players have other groups', () => {
    const { groups, players } = makeStores()
    const sevenA = groups.create({ name: '7А', comment: '' })
    const eightB = groups.create({ name: '8Б', comment: '' })
    const player = players.create({
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: '',
      groupIds: [sevenA.id, eightB.id]
    })

    groups.remove(sevenA.id)

    expect(groups.list().map((group) => group.name)).toEqual(['8Б'])
    expect(players.list()[0]).toMatchObject({ id: player.id, groupIds: [eightB.id] })
  })
})
