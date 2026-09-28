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

  it('lists rounds of a tournament ordered by seq', () => {
    const database = openDatabase(':memory:')
    const store = createTournamentStore(database)
    const groups = createGroupStore(database)
    const group = groups.create({ name: '7А', comment: '' })
    const settings = store.listSettings().find((item) => item.name === 'Стандарт')
    expect(settings).toBeDefined()
    if (!settings) {
      return
    }
    const tournament = store.createTournament({
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })

    expect(store.listRounds(tournament.id)).toEqual([])

    const insert = database.prepare(
      'INSERT INTO rounds (tournament_id, seq, played_date, settings_id) VALUES (?, ?, ?, ?)'
    )
    insert.run(tournament.id, 2, '2026-10-02', settings.id)
    insert.run(tournament.id, 1, '2026-10-01', settings.id)

    expect(store.listRounds(tournament.id)).toEqual([
      {
        id: expect.any(Number),
        tournamentId: tournament.id,
        seq: 1,
        playedDate: '2026-10-01',
        settingsId: settings.id
      },
      {
        id: expect.any(Number),
        tournamentId: tournament.id,
        seq: 2,
        playedDate: '2026-10-02',
        settingsId: settings.id
      }
    ])
  })

  it('previews the first round from the group players and saves it', () => {
    const database = openDatabase(':memory:')
    const store = createTournamentStore(database)
    const groups = createGroupStore(database)
    const playersDb = database.prepare("INSERT INTO players (last_name, first_name) VALUES (?, '')")
    const ids = ['Волков', 'Абрамов', 'Борисов', 'Гаврилов'].map((lastName) =>
      Number(playersDb.run(lastName).lastInsertRowid)
    )
    const group = groups.create({ name: '7А', comment: '' })
    const join = database.prepare(
      'INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)'
    )
    ids.forEach((id) => join.run(group.id, id))
    const settings = store.listSettings()[0]
    const tournament = store.createTournament({
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })

    const preview = store.previewPairs(tournament.id)
    expect(preview.seq).toBe(1)
    expect(preview.pairs).toEqual([
      { player1Id: ids[1], player2Id: ids[2] },
      { player1Id: ids[0], player2Id: ids[3] }
    ])
    expect(preview.restingPlayerIds).toEqual([])

    const { round, pairs } = store.createRound({
      tournamentId: tournament.id,
      playedDate: '2026-10-05',
      settingsId: settings.id,
      pairs: preview.pairs.map((pair, index) => ({
        ...pair,
        result: index === 0 ? ('player2_win' as const) : ('draw' as const)
      }))
    })

    expect(round).toMatchObject({
      tournamentId: tournament.id,
      seq: 1,
      playedDate: '2026-10-05',
      settingsId: settings.id
    })
    expect(pairs.map((pair) => pair.result)).toEqual(['player2_win', 'draw'])
    expect(store.listRounds(tournament.id)).toHaveLength(1)
  })

  it('previews the second round from the first round results and validates on save', () => {
    const database = openDatabase(':memory:')
    const store = createTournamentStore(database)
    const groups = createGroupStore(database)
    const playersDb = database.prepare("INSERT INTO players (last_name, first_name) VALUES (?, '')")
    const ids = ['Абрамов', 'Борисов', 'Волков'].map((lastName) =>
      Number(playersDb.run(lastName).lastInsertRowid)
    )
    const group = groups.create({ name: '7А', comment: '' })
    const join = database.prepare(
      'INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)'
    )
    ids.forEach((id) => join.run(group.id, id))
    const settings = store.listSettings()[0]
    const tournament = store.createTournament({
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })

    store.createRound({
      tournamentId: tournament.id,
      playedDate: '2026-10-05',
      settingsId: settings.id,
      pairs: [{ player1Id: ids[0], player2Id: ids[1], result: 'player1_win' }]
    })

    const preview = store.previewPairs(tournament.id)
    expect(preview.seq).toBe(2)
    expect(preview.pairs).toEqual([{ player1Id: ids[1], player2Id: ids[2] }])
    expect(preview.restingPlayerIds).toEqual([ids[0]])

    expect(() =>
      store.createRound({
        tournamentId: tournament.id,
        playedDate: '2026-10-12',
        settingsId: settings.id,
        pairs: [{ player1Id: ids[0], player2Id: ids[1], result: 'draw' }]
      })
    ).toThrow('Пары не совпадают с расчётными для этого раунда')

    store.createRound({
      tournamentId: tournament.id,
      playedDate: '2026-10-12',
      settingsId: settings.id,
      pairs: [{ player1Id: ids[1], player2Id: ids[2], result: 'draw' }]
    })
    expect(store.listRounds(tournament.id)).toHaveLength(2)
  })

  it('tracks player positions across rounds', () => {
    const database = openDatabase(':memory:')
    const store = createTournamentStore(database)
    const groups = createGroupStore(database)
    const playersDb = database.prepare("INSERT INTO players (last_name, first_name) VALUES (?, '')")
    const ids = ['Абрамов', 'Борисов', 'Волков'].map((lastName) =>
      Number(playersDb.run(lastName).lastInsertRowid)
    )
    const group = groups.create({ name: '7А', comment: '' })
    const join = database.prepare(
      'INSERT INTO group_memberships (group_id, player_id) VALUES (?, ?)'
    )
    ids.forEach((id) => join.run(group.id, id))
    const settings = store.listSettings()[0]
    const tournament = store.createTournament({
      name: 'Осенний',
      groupId: group.id,
      startDate: '2026-10-01',
      settingsId: settings.id
    })

    expect(store.positions(tournament.id)).toEqual({ seqs: [], series: [] })

    store.createRound({
      tournamentId: tournament.id,
      playedDate: '2026-10-05',
      settingsId: settings.id,
      pairs: [{ player1Id: ids[0], player2Id: ids[1], result: 'player1_win' }]
    })
    store.createRound({
      tournamentId: tournament.id,
      playedDate: '2026-10-12',
      settingsId: settings.id,
      pairs: [{ player1Id: ids[1], player2Id: ids[2], result: 'draw' }]
    })

    expect(store.positions(tournament.id)).toEqual({
      seqs: [1, 2],
      series: [
        {
          playerId: ids[0],
          lastName: 'Абрамов',
          firstName: '',
          middleName: '',
          positions: [1, 1]
        },
        {
          playerId: ids[1],
          lastName: 'Борисов',
          firstName: '',
          middleName: '',
          positions: [2, 3]
        },
        {
          playerId: ids[2],
          lastName: 'Волков',
          firstName: '',
          middleName: '',
          positions: [3, 2]
        }
      ]
    })
  })
})
