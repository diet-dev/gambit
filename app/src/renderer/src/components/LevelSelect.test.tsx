import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import LevelSelect from './LevelSelect'

function openMenu(getByRole: ReturnType<typeof render>['getByRole']): void {
  fireEvent.click(getByRole('button', { name: /Сила соперника/ }))
}

describe('LevelSelect', () => {
  it('shows the currently selected level', () => {
    const { getByRole } = render(<LevelSelect level={4} onChange={() => {}} />)

    expect(getByRole('button', { name: /Сила соперника: Мастер/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('opens a listbox with every level', () => {
    const { getByRole } = render(<LevelSelect level={0} onChange={() => {}} />)

    openMenu(getByRole)

    expect(getByRole('listbox', { name: 'Сила соперника' })).toBeInTheDocument()
    expect(getByRole('option', { name: /3 разряд/ })).toHaveAttribute('aria-selected', 'true')
    expect(getByRole('option', { name: /Гроссмейстер/ })).toBeInTheDocument()
    expect(getByRole('option', { name: /Максимум/ })).toBeInTheDocument()
  })

  it('selects a level and closes the list', () => {
    const onChange = vi.fn()
    const { getByRole, queryByRole } = render(<LevelSelect level={0} onChange={onChange} />)

    openMenu(getByRole)
    fireEvent.click(getByRole('option', { name: /КМС/ }))

    expect(onChange).toHaveBeenCalledWith(3)
    expect(queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const { getByRole, queryByRole } = render(<LevelSelect level={0} onChange={() => {}} />)

    openMenu(getByRole)
    fireEvent.keyDown(getByRole('listbox'), { key: 'Escape' })

    expect(queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes when clicking outside', () => {
    const { getByRole, queryByRole } = render(<LevelSelect level={0} onChange={() => {}} />)

    openMenu(getByRole)
    fireEvent.mouseDown(document.body)

    expect(queryByRole('listbox')).not.toBeInTheDocument()
  })
})
