import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import ActivityBar from './ActivityBar'

describe('ActivityBar', () => {
  it('renders the activities and marks the active one', () => {
    const { container, getByRole } = render(<ActivityBar active="situations" onSelect={() => {}} />)

    expect(container.querySelectorAll('.activity-button')).toHaveLength(3)
    expect(getByRole('button', { name: 'Ситуации' })).toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'Устройства' })).not.toHaveClass('activity-button-active')
    expect(getByRole('button', { name: 'События' })).not.toHaveClass('activity-button-active')
  })

  it('calls onSelect when an activity is clicked', () => {
    const onSelect = vi.fn()
    const { getByRole } = render(<ActivityBar active="situations" onSelect={onSelect} />)

    fireEvent.click(getByRole('button', { name: 'Устройства' }))

    expect(onSelect).toHaveBeenCalledWith('devices')
  })
})
