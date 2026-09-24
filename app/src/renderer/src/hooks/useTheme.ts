import { useCallback, useEffect, useState } from 'react'
import { applyTheme, loadTheme, saveTheme, type Theme } from '../theme'

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(loadTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme): void => {
    setThemeState(next)
    saveTheme(next)
  }, [])

  return { theme, setTheme }
}
