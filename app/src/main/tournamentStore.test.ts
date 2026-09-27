import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createTournamentStore, type TournamentStore } from './tournamentStore'

function makeStore(): TournamentStore {
  const database = openDatabase(':memory:')
  return createTournamentStore(database)
}

describe('tournamentStore settings', () => {
  it('seeds the «Стандарт» settings on a fresh database', () => {
    const store = makeStore()

    expect(store.listSettings()).toEqual([
      {
        id: expect.any(Number),
        name: 'Стандарт',
        weakerPlaysWhite: true,
        drawScoring: 'weaker',
        absenceScoring: 'loss',
        createdAt: expect.any(String),
        used: false
      }
    ])
  })

  it('creates settings with generated createdAt', () => {
    const store = makeStore()

    const created = store.createSettings({
      name: 'Блиц',
      weakerPlaysWhite: false,
      drawScoring: 'none',
      absenceScoring: 'no_effect'
    })

    expect(created).toEqual({
      id: expect.any(Number),
      name: 'Блиц',
      weakerPlaysWhite: false,
      drawScoring: 'none',
      absenceScoring: 'no_effect',
      createdAt: expect.any(String),
      used: false
    })
    expect(store.listSettings().map((item) => item.name)).toEqual(['Блиц', 'Стандарт'])
  })

  it('rejects a duplicate settings name', () => {
    const store = makeStore()

    expect(() =>
      store.createSettings({
        name: 'Стандарт',
        weakerPlaysWhite: false,
        drawScoring: 'none',
        absenceScoring: 'no_effect'
      })
    ).toThrow()
  })

  it('updates settings', () => {
    const store = makeStore()
    const standard = store.listSettings().find((item) => item.name === 'Стандарт')
    expect(standard).toBeDefined()
    if (!standard) {
      return
    }

    const updated = store.updateSettings(standard.id, {
      name: 'Стандарт-2',
      weakerPlaysWhite: false,
      drawScoring: 'stronger',
      absenceScoring: 'no_effect'
    })

    expect(updated).toMatchObject({
      id: standard.id,
      name: 'Стандарт-2',
      weakerPlaysWhite: false,
      drawScoring: 'stronger',
      absenceScoring: 'no_effect'
    })
    expect(store.listSettings()).toHaveLength(1)
  })

  it('removes settings', () => {
    const store = makeStore()
    const created = store.createSettings({
      name: 'Блиц',
      weakerPlaysWhite: true,
      drawScoring: 'weaker',
      absenceScoring: 'loss'
    })

    store.removeSettings(created.id)

    expect(store.listSettings().map((item) => item.name)).toEqual(['Стандарт'])
  })
})
