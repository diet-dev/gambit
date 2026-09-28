import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createSituationStore } from './situationStore'

describe('situationStore', () => {
  it('lists the seeded groups and situations in sort order', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)

    const groups = store.list()

    expect(groups.map((group) => group.name)).toEqual([
      'Начало',
      'Основы',
      'Маты',
      'Правила',
      'Приёмы',
      'Эндшпиль',
      'Ошибки',
      'Стратегия',
      'Дебюты',
      'Приёмы II'
    ])
    const situations = groups.flatMap((group) => group.situations)
    expect(situations).toHaveLength(70)
    expect(groups[0].situations[0]).toMatchObject({
      title: 'Начальная позиция',
      sortOrder: 1
    })
    expect(groups[0].situations[0].fen).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    )
    database.close()
  })

  it('seeds only legal chess positions', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)

    const fens = store
      .list()
      .flatMap((group) => group.situations)
      .map((situation) => situation.fen)

    expect(fens.length).toBeGreaterThan(0)
    for (const fen of fens) {
      expect(() => new Chess(fen)).not.toThrow()
    }
    database.close()
  })

  it('seeds positions with the intended checkmate, stalemate and special rights', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)
    const fenByTitle = new Map(
      store
        .list()
        .flatMap((group) => group.situations)
        .map((situation) => [situation.title, situation.fen])
    )

    expect(new Chess(fenByTitle.get('Детский мат')!).isCheckmate()).toBe(true)
    expect(new Chess(fenByTitle.get('Мат Легаля')!).isCheckmate()).toBe(true)
    expect(new Chess(fenByTitle.get('Пат')!).isStalemate()).toBe(true)

    const castling = new Chess(fenByTitle.get('Рокировка')!)
    expect(castling.moves({ verbose: true }).some((move) => move.flags.includes('k'))).toBe(true)

    const enPassant = new Chess(fenByTitle.get('Взятие на проходе')!)
    expect(enPassant.moves({ verbose: true }).some((move) => move.flags.includes('e'))).toBe(true)
    database.close()
  })

  it('creates a situation in an existing group with normalized texts', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)
    const group = store.list()[0]

    const created = store.create({
      groupId: group.id,
      title: '  моя   позиция ',
      description: '  подпись  ',
      comment: ' разбор ',
      fen: '8/8/8/8/8/8/8/K6k w - - 0 2'
    })

    expect(created).toMatchObject({
      groupId: group.id,
      title: 'Моя позиция',
      description: 'Подпись',
      comment: 'Разбор',
      sortOrder: group.situations.length + 1
    })
    const reloaded = store.list().find((item) => item.id === group.id)
    expect(reloaded?.situations.at(-1)?.title).toBe('Моя позиция')
    database.close()
  })

  it('creates a new group when only a name is given', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)
    const groupsBefore = store.list()

    store.create({
      groupName: '  мои   позиции ',
      title: 'Своя позиция',
      description: '',
      comment: '',
      fen: '8/8/8/8/8/8/8/K6k b - - 0 2'
    })

    const groups = store.list()
    expect(groups).toHaveLength(groupsBefore.length + 1)
    const created = groups.at(-1)!
    expect(created.name).toBe('Мои позиции')
    expect(created.sortOrder).toBe(groupsBefore.length + 1)
    expect(created.situations.map((situation) => situation.title)).toEqual(['Своя позиция'])
    database.close()
  })

  it('rejects duplicate fen, duplicate title and empty inputs', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)
    const group = store.list()[0]
    const fen = group.situations[0].fen

    expect(() =>
      store.create({
        groupId: group.id,
        title: 'Дубль позиции',
        description: '',
        comment: '',
        fen
      })
    ).toThrow(/Позиция уже сохранена/)

    expect(() =>
      store.create({
        groupId: group.id,
        title: group.situations[0].title,
        description: '',
        comment: '',
        fen: '8/8/8/8/8/8/8/K6k w - - 0 9'
      })
    ).toThrow(/уже есть ситуация с таким названием/)

    expect(() =>
      store.create({
        groupName: 'Новая',
        title: '   ',
        description: '',
        comment: '',
        fen: '8/8/8/8/8/8/8/K6k w - - 0 9'
      })
    ).toThrow('Введите название ситуации')

    expect(() =>
      store.create({
        groupName: '   ',
        title: 'Позиция',
        description: '',
        comment: '',
        fen: '8/8/8/8/8/8/8/K6k w - - 0 9'
      })
    ).toThrow('Введите название группы или выберите существующую')

    expect(() =>
      store.create({
        groupName: group.name.toLowerCase(),
        title: 'Позиция',
        description: '',
        comment: '',
        fen: '8/8/8/8/8/8/8/K6k w - - 0 9'
      })
    ).toThrow(/Группа с таким именем уже есть/)
    database.close()
  })

  it('updates title and moves a situation to another group', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)
    const first = store.list()[0]

    store.create({
      groupName: 'Мои позиции',
      title: 'Своя позиция',
      description: '',
      comment: '',
      fen: '8/8/8/8/8/8/8/K6k b - - 0 2'
    })
    const mine = store.list().at(-1)!.situations[0]

    const updated = store.update({
      id: mine.id,
      groupId: first.id,
      title: '  переименованная  ',
      description: ' новая подпись ',
      comment: ''
    })

    expect(updated).toMatchObject({
      id: mine.id,
      groupId: first.id,
      title: 'Переименованная',
      description: 'Новая подпись',
      fen: mine.fen
    })
    const reloaded = store.list()
    expect(reloaded[0].situations.map((situation) => situation.title)).toContain('Переименованная')
    expect(reloaded.at(-1)!.situations).toHaveLength(0)
    database.close()
  })

  it('rejects updating into an existing title and unknown group or situation', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)
    const group = store.list().find((item) => item.name === 'Маты')!
    const [a, b] = group.situations

    expect(() =>
      store.update({
        id: b.id,
        groupId: group.id,
        title: a.title,
        description: '',
        comment: ''
      })
    ).toThrow(/уже есть ситуация с таким названием/)

    expect(() =>
      store.update({
        id: b.id,
        groupId: 999,
        title: 'Позиция',
        description: '',
        comment: ''
      })
    ).toThrow('Выбранная группа не найдена')

    expect(() =>
      store.update({
        id: 999,
        groupId: group.id,
        title: 'Позиция',
        description: '',
        comment: ''
      })
    ).toThrow('Ситуация не найдена')
    database.close()
  })

  it('removes a situation', () => {
    const database = openDatabase(':memory:')
    const store = createSituationStore(database)
    const group = store.list()[0]
    const before = group.situations.length

    store.remove(group.situations[0].id)

    expect(store.list()[0].situations).toHaveLength(before - 1)
    expect(() => store.remove(group.situations[0].id)).not.toThrow()
    database.close()
  })
})
