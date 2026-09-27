import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createGroupStore, type GroupStore } from './groupStore'
import { createTournamentStore, type TournamentStore } from './tournamentStore'

function makeStores(): { tournaments: TournamentStore; groups: GroupStore } {
  const database = openDatabase(':memory:')
  return {
    tournaments: createTournamentStore(database),
    groups: createGroupStore(database)
  }
}

describe('tournamentStore settings', () => {
  it('seeds the «Стандарт» settings on a fresh database', () => {
    const { tournaments: store } = makeStores()

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
    const { tournaments: store } = makeStores()

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
    const { tournaments: store } = makeStores()

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
    const { tournaments: store } = makeStores()
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
    const { tournaments: store } = makeStores()
    const created = store.createSettings({
      name: 'Блиц',
      weakerPlaysWhite: true,
      drawScoring: 'weaker',
      absenceScoring: 'loss'
    })

    store.removeSettings(created.id)

    expect(store.listSettings().map((item) => item.name)).toEqual(['Стандарт'])
  })

  it('marks settings as used once a tournament references them', () => {
    const { tournaments: store, groups } = makeStores()
    const settings = store.createSettings({
      name: 'Блиц',
      weakerPlaysWhite: false,
      drawScoring: 'none',
      absenceScoring: 'no_effect'
    })
    const group = groups.create({ name: '7А', comment: '' })

    expect(store.listSettings().find((item) => item.id === settings.id)?.used).toBe(false)

    store.createTournament({
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })

    expect(store.listSettings().find((item) => item.id === settings.id)?.used).toBe(true)
  })

  it('rejects editing or removing settings used by a tournament', () => {
    const { tournaments: store, groups } = makeStores()
    const settings = store.createSettings({
      name: 'Блиц',
      weakerPlaysWhite: false,
      drawScoring: 'none',
      absenceScoring: 'no_effect'
    })
    const group = groups.create({ name: '7А', comment: '' })
    store.createTournament({
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })

    expect(() =>
      store.updateSettings(settings.id, {
        name: 'Блиц-2',
        weakerPlaysWhite: false,
        drawScoring: 'none',
        absenceScoring: 'no_effect'
      })
    ).toThrow('Настройка уже используется турниром — сохраните её как новую версию')
    expect(() => store.removeSettings(settings.id)).toThrow(
      'Нельзя удалить настройку «Блиц»: она используется турниром'
    )
  })

  it('creates, updates and removes tournaments', () => {
    const { tournaments: store, groups } = makeStores()
    const group = groups.create({ name: '7А', comment: '' })
    const settings = store.listSettings().find((item) => item.name === 'Стандарт')
    expect(settings).toBeDefined()
    if (!settings) {
      return
    }

    const created = store.createTournament({
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })
    expect(created).toEqual({
      id: expect.any(Number),
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })

    const updated = store.updateTournament(created.id, {
      name: 'Зимний',
      groupId: group.id,
      startDate: '2026-12-01',
      settingsId: settings.id
    })
    expect(updated).toMatchObject({ id: created.id, name: 'Зимний', startDate: '2026-12-01' })

    store.removeTournament(created.id)
    expect(store.listTournaments()).toHaveLength(0)
  })
})
