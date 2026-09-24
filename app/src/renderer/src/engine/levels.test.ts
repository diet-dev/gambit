import { afterEach, describe, expect, it } from 'vitest'
import {
  ENGINE_LEVELS,
  LEVEL_STORAGE_KEY,
  clampLevel,
  levelByIndex,
  loadLevelIndex,
  saveLevelIndex
} from './levels'

afterEach(() => {
  localStorage.clear()
})

describe('ENGINE_LEVELS', () => {
  it('lists chess levels from the third category up to maximum', () => {
    expect(ENGINE_LEVELS.map((level) => level.name)).toEqual([
      '3 разряд',
      '2 разряд',
      '1 разряд',
      'КМС',
      'Мастер',
      'Гроссмейстер',
      'Максимум'
    ])
  })

  it('keeps Elo values inside the engine range and increasing', () => {
    const elos = ENGINE_LEVELS.map((level) => level.elo)

    expect(elos[0]).toBeGreaterThanOrEqual(1320)
    expect(elos[elos.length - 1]).toBeLessThanOrEqual(3190)
    for (let index = 1; index < elos.length; index += 1) {
      expect(elos[index]).toBeGreaterThan(elos[index - 1])
    }
  })
})

describe('clampLevel', () => {
  it('keeps the level inside the available range', () => {
    expect(clampLevel(-1)).toBe(0)
    expect(clampLevel(3)).toBe(3)
    expect(clampLevel(99)).toBe(ENGINE_LEVELS.length - 1)
  })
})

describe('levelByIndex', () => {
  it('returns the level for a valid index', () => {
    expect(levelByIndex(4)).toEqual({ name: 'Мастер', elo: 2200 })
  })

  it('clamps out-of-range indexes', () => {
    expect(levelByIndex(-5)).toEqual(ENGINE_LEVELS[0])
    expect(levelByIndex(100)).toEqual(ENGINE_LEVELS[ENGINE_LEVELS.length - 1])
  })
})

describe('level storage', () => {
  it('defaults to the weakest level when nothing is stored', () => {
    expect(loadLevelIndex()).toBe(0)
  })

  it('stores and loads the selected level', () => {
    saveLevelIndex(5)

    expect(localStorage.getItem(LEVEL_STORAGE_KEY)).toBe('5')
    expect(loadLevelIndex()).toBe(5)
  })

  it('falls back to a clamped level for invalid stored data', () => {
    localStorage.setItem(LEVEL_STORAGE_KEY, 'nonsense')
    expect(loadLevelIndex()).toBe(0)

    localStorage.setItem(LEVEL_STORAGE_KEY, '99')
    expect(loadLevelIndex()).toBe(ENGINE_LEVELS.length - 1)
  })
})
