import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createStudentStore, type StudentStore } from './studentStore'

function makeStore(): StudentStore {
  const database = openDatabase(':memory:')
  return createStudentStore(database)
}

const input = {
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  className: '7А',
  rating: 100
}

describe('studentStore', () => {
  it('creates a student and lists it', () => {
    const store = makeStore()

    const created = store.create(input)

    expect(created.id).toBeGreaterThan(0)
    expect(created).toMatchObject(input)
    expect(store.list()).toEqual([created])
  })

  it('updates a student', () => {
    const store = makeStore()
    const created = store.create(input)

    const updated = store.update({ ...created, rating: 250, className: '8Б' })

    expect(updated).toMatchObject({ id: created.id, rating: 250, className: '8Б' })
    expect(store.list()[0].rating).toBe(250)
  })

  it('removes a student', () => {
    const store = makeStore()
    const created = store.create(input)

    store.remove(created.id)

    expect(store.list()).toHaveLength(0)
  })

  it('lists students ordered by last name', () => {
    const store = makeStore()
    store.create({ ...input, lastName: 'Яковлев' })
    store.create({ ...input, lastName: 'Абрамов' })

    expect(store.list().map((student) => student.lastName)).toEqual(['Абрамов', 'Яковлев'])
  })
})
