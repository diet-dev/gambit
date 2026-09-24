import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SituationList from './SituationList'
import { SITUATION_GROUPS } from '../situations'

describe('SituationList', () => {
  it('renders every situation, grouped by theme', () => {
    const { container } = render(
      <SituationList
        groups={SITUATION_GROUPS}
        selectedId="start"
        onSelect={() => {}}
        onShowComment={() => {}}
      />
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
      <SituationList
        groups={SITUATION_GROUPS}
        selectedId="start"
        onSelect={onSelect}
        onShowComment={() => {}}
      />
    )

    fireEvent.click(getByRole('button', { name: /Вилка конём/ }))

    expect(onSelect).toHaveBeenCalledWith('knight-fork')
  })

  it('shows the comment button only on the active situation', () => {
    const { container, queryByRole } = render(
      <SituationList
        groups={SITUATION_GROUPS}
        selectedId="start"
        onSelect={() => {}}
        onShowComment={() => {}}
      />
    )

    expect(container.querySelectorAll('.situation-help')).toHaveLength(1)
    expect(queryByRole('button', { name: /Подробнее: Начальная позиция/ })).toBeInTheDocument()
    expect(queryByRole('button', { name: /Подробнее: Мат Легаля/ })).not.toBeInTheDocument()
  })

  it('numbers situations from one within each group', () => {
    const { container } = render(
      <SituationList
        groups={SITUATION_GROUPS}
        selectedId="start"
        onSelect={() => {}}
        onShowComment={() => {}}
      />
    )

    const sections = Array.from(container.querySelectorAll('.situation-group'))
    expect(sections.length).toBeGreaterThan(1)

    for (const section of sections) {
      const count = section.querySelectorAll('.situation-item').length
      const numbers = Array.from(section.querySelectorAll('.situation-number')).map(
        (element) => element.textContent
      )

      expect(numbers).toEqual(Array.from({ length: count }, (_, index) => String(index + 1)))
    }
  })

  it('calls onShowComment with the active situation id', () => {
    const onShowComment = vi.fn()
    const { getByRole } = render(
      <SituationList
        groups={SITUATION_GROUPS}
        selectedId="legal-mate"
        onSelect={() => {}}
        onShowComment={onShowComment}
      />
    )

    fireEvent.click(getByRole('button', { name: /Подробнее: Мат Легаля/ }))

    expect(onShowComment).toHaveBeenCalledWith('legal-mate')
  })
})
