export type EngineLevel = {
  name: string
  elo: number
}

export const ENGINE_LEVELS: EngineLevel[] = [
  { name: '3 разряд', elo: 1350 },
  { name: '2 разряд', elo: 1500 },
  { name: '1 разряд', elo: 1700 },
  { name: 'КМС', elo: 1900 },
  { name: 'Мастер', elo: 2200 },
  { name: 'Гроссмейстер', elo: 2600 },
  { name: 'Максимум', elo: 3190 }
]

export const LEVEL_STORAGE_KEY = 'gambit-engine-level'

export function clampLevel(index: number): number {
  return Math.min(Math.max(Math.round(index), 0), ENGINE_LEVELS.length - 1)
}

export function levelByIndex(index: number): EngineLevel {
  return ENGINE_LEVELS[clampLevel(index)]
}

export function loadLevelIndex(): number {
  const stored = localStorage.getItem(LEVEL_STORAGE_KEY)
  if (stored === null) {
    return 0
  }

  const parsed = Number(stored)
  if (!Number.isInteger(parsed)) {
    return 0
  }

  return clampLevel(parsed)
}

export function saveLevelIndex(index: number): void {
  localStorage.setItem(LEVEL_STORAGE_KEY, String(clampLevel(index)))
}
