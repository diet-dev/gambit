import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import ActivityBar from './ActivityBar'

describe('ActivityBar', () => {
  it('renders the activities and marks the active one', () => {
    const { container, getByRole } = render(<ActivityBar active="situations" onSelect={() => {}} />)

    expect(container.querySelectorAll('.activity-button')).toHaveLength(7)
    expect(getByRole('button', { name: 'Ситуации' })).toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'Классы' })).not.toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'Ученики' })).not.toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'Устройства' })).not.toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'События' })).not.toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'Настройки' })).not.toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'Справка' })).not.toHaveClass('activity-button-active')
    expect(container.querySelectorAll('.activity-bar-bottom .activity-button')).toHaveLength(2)
  })

  it('calls onSelect when an activity is clicked', () => {
    const onSelect = vi.fn()
    const { getByRole } = render(<ActivityBar active="situations" onSelect={onSelect} />)

    fireEvent.click(getByRole('button', { name: 'Устройства' }))

    expect(onSelect).toHaveBeenCalledWith('devices')
  })
})
