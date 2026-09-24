import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  initTheme,
  loadTheme,
  saveTheme
} from './theme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('loadTheme', () => {
  it('defaults to dark when nothing is stored', () => {
    expect(loadTheme()).toBe('dark')
    expect(DEFAULT_THEME).toBe('dark')
  })

  it('returns the stored theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    expect(loadTheme()).toBe('light')
  })

  it('falls back to dark when the stored value is not a known theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'midnight')

    expect(loadTheme()).toBe('dark')
  })
})

describe('saveTheme', () => {
  it('persists the theme under the storage key', () => {
    saveTheme('light')

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
})

describe('applyTheme', () => {
  it('sets the theme on the root element', () => {
    applyTheme('light')

    expect(document.documentElement.dataset.theme).toBe('light')

    applyTheme('dark')

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('initTheme', () => {
  it('applies the stored theme and returns it', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    expect(initTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('applies the dark default when nothing is stored', () => {
    expect(initTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
