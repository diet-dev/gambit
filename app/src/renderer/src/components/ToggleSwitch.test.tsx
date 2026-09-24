import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import ToggleSwitch from './ToggleSwitch'

describe('ToggleSwitch', () => {
  it('renders as an unchecked switch', () => {
    const { getByRole } = render(
      <ToggleSwitch checked={false} onChange={() => {}} label="Играть с ботом" />
    )

    expect(getByRole('switch', { name: 'Играть с ботом' })).toHaveAttribute('aria-checked', 'false')
  })

  it('marks the on state', () => {
    const { getByRole } = render(
      <ToggleSwitch checked onChange={() => {}} label="Играть с ботом" />
    )
    const toggle = getByRole('switch', { name: 'Играть с ботом' })

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(toggle).toHaveClass('toggle-switch-on')
  })

  it('asks to turn on when clicked while off', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <ToggleSwitch checked={false} onChange={onChange} label="Играть с ботом" />
    )

    fireEvent.click(getByRole('switch'))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('asks to turn off when clicked while on', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <ToggleSwitch checked onChange={onChange} label="Играть с ботом" />
    )

    fireEvent.click(getByRole('switch'))

    expect(onChange).toHaveBeenCalledWith(false)
  })
})
