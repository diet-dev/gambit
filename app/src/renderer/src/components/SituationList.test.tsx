import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SituationList from './SituationList'
import { SITUATION_GROUPS } from '../situations'

describe('SituationList', () => {
  it('renders every situation, grouped by theme', () => {
    const { container } = render(
      <SituationList groups={SITUATION_GROUPS} selectedId="start" onSelect={() => {}} />
    )

    const total = SITUATION_GROUPS.flatMap((group) => group.situations).length
    expect(container.querySelectorAll('.situation-item')).toHaveLength(total)
    expect(container).toHaveTextContent('Начало')
    expect(container).toHaveTextContent('Мат Легаля')
    expect(container).toHaveTextContent('Вилка конём')
    expect(container).toHaveTextContent('Спёртый мат')
  })

  it('calls onSelect with the situation id when an item is clicked', () => {
    const onSelect = vi.fn()
    const { getByRole } = render(
      <SituationList groups={SITUATION_GROUPS} selectedId="start" onSelect={onSelect} />
    )

    fireEvent.click(getByRole('button', { name: /Вилка конём/ }))

    expect(onSelect).toHaveBeenCalledWith('knight-fork')
  })
})
