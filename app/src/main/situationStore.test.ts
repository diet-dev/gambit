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
})
