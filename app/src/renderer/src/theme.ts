export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'gambit-theme'
export const DEFAULT_THEME: Theme = 'dark'

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : DEFAULT_THEME
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function initTheme(): Theme {
  const theme = loadTheme()
  applyTheme(theme)
  return theme
}
