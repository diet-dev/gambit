import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SettingsPanel from './SettingsPanel'
import { THEME_STORAGE_KEY } from '../theme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('SettingsPanel', () => {
  it('shows the appearance section with the dark theme selected by default', () => {
    const { getByRole, getByText } = render(<SettingsPanel />)

    expect(getByText('Оформление')).toBeInTheDocument()
    expect(getByRole('radio', { name: 'Тёмная' })).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('switches to the light theme and persists the choice', () => {
    const { getByRole } = render(<SettingsPanel />)

    fireEvent.click(getByRole('radio', { name: 'Светлая' }))

    expect(getByRole('radio', { name: 'Светлая' })).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('reflects a previously stored theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    const { getByRole } = render(<SettingsPanel />)

    expect(getByRole('radio', { name: 'Светлая' })).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
