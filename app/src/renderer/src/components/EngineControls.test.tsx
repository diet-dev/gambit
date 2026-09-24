import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import EngineControls from './EngineControls'

describe('EngineControls', () => {
  it('shows the bot icon and the level list', () => {
    const { container, getByRole } = render(
      <EngineControls enabled={false} level={2} onToggle={() => {}} onLevelChange={() => {}} />
    )

    expect(container.querySelector('.engine-controls-icon')).toBeInTheDocument()
    expect(getByRole('button', { name: /Сила соперника: 1 разряд/ })).toBeInTheDocument()
  })

  it('marks the control when the bot is on', () => {
    const { container } = render(
      <EngineControls enabled level={0} onToggle={() => {}} onLevelChange={() => {}} />
    )

    expect(container.querySelector('.engine-controls')).toHaveClass('engine-controls-on')
  })

  it('renders the bot switch and the level list', () => {
    const { getByRole } = render(
      <EngineControls enabled={false} level={2} onToggle={() => {}} onLevelChange={() => {}} />
    )

    expect(getByRole('switch', { name: 'Играть с ботом' })).toHaveAttribute('aria-checked', 'false')
    expect(getByRole('button', { name: /Сила соперника: 1 разряд/ })).toBeInTheDocument()
  })

  it('reports toggling the bot on', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(
      <EngineControls enabled={false} level={0} onToggle={onToggle} onLevelChange={() => {}} />
    )

    fireEvent.click(getByRole('switch'))

    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('reports a level change', () => {
    const onLevelChange = vi.fn()
    const { getByRole } = render(
      <EngineControls enabled level={0} onToggle={() => {}} onLevelChange={onLevelChange} />
    )

    fireEvent.click(getByRole('button', { name: /Сила соперника/ }))
    fireEvent.click(getByRole('option', { name: /Мастер/ }))

    expect(onLevelChange).toHaveBeenCalledWith(4)
  })
})
