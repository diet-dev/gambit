import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import TournamentsPanel from './TournamentsPanel'

describe('TournamentsPanel', () => {
  it('shows the tournaments sub-tab by default', () => {
    const { container, getByRole } = render(<TournamentsPanel />)

    expect(getByRole('tab', { name: 'Турниры' })).toHaveAttribute('aria-selected', 'true')
    expect(getByRole('tabpanel', { name: 'Турниры' })).toBeInTheDocument()
    expect(container.querySelector('.tournaments-settings')).not.toBeInTheDocument()
  })

  it('switches to the settings sub-tab', () => {
    const { container, getByRole } = render(<TournamentsPanel />)

    fireEvent.click(getByRole('tab', { name: 'Настройки' }))

    expect(getByRole('tab', { name: 'Настройки' })).toHaveAttribute('aria-selected', 'true')
    expect(getByRole('tabpanel', { name: 'Настройки' })).toBeInTheDocument()
    expect(container.querySelector('.tournaments-list')).not.toBeInTheDocument()
  })
})
