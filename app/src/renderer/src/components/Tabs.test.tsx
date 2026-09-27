import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import Tabs from './Tabs'

describe('Tabs', () => {
  it('renders the tabs and marks the active one', () => {
    const { getByRole } = render(
      <Tabs
        items={[
          { id: 'a', title: 'Первый' },
          { id: 'b', title: 'Второй' }
        ]}
        activeId="a"
        onSelect={() => {}}
      />
    )

    expect(getByRole('tablist')).toBeInTheDocument()
    expect(getByRole('tab', { name: 'Первый' })).toHaveClass('tabs-tab-active')
    expect(getByRole('tab', { name: 'Второй' })).not.toHaveClass('tabs-tab-active')
    expect(getByRole('tab', { name: 'Первый' })).toHaveAttribute('aria-selected', 'true')
  })

  it('calls onSelect with the clicked tab id', () => {
    const onSelect = vi.fn()
    const { getByRole } = render(
      <Tabs
        items={[
          { id: 'a', title: 'Первый' },
          { id: 'b', title: 'Второй' }
        ]}
        activeId="a"
        onSelect={onSelect}
      />
    )

    fireEvent.click(getByRole('tab', { name: 'Второй' }))

    expect(onSelect).toHaveBeenCalledWith('b')
  })
})
