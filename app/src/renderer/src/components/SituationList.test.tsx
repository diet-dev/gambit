import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SituationList from './SituationList'
import type { SituationGroup } from '../../../shared/situations'

const groups: SituationGroup[] = [
  {
    id: 1,
    name: 'Начало',
    sortOrder: 1,
    situations: [
      {
        id: 1,
        groupId: 1,
        title: 'Начальная позиция',
        description: 'Классическое начало игры. Белые ходят первыми.',
        comment: '',
        fen: 'start-fen',
        sortOrder: 1
      }
    ]
  },
  {
    id: 2,
    name: 'Маты',
    sortOrder: 2,
    situations: [
      {
        id: 2,
        groupId: 2,
        title: 'Мат Легаля',
        description: 'Классическая ловушка в дебюте.',
        comment: '',
        fen: 'legal-fen',
        sortOrder: 1
      },
      {
        id: 3,
        groupId: 2,
        title: 'Спёртый мат',
        description: 'Конь ставит мат королю, запертому своими фигурами.',
        comment: '',
        fen: 'smothered-fen',
        sortOrder: 2
      },
      {
        id: 4,
        groupId: 2,
        title: 'Вилка конём',
        description: 'Конь нападает сразу на короля и ладью.',
        comment: '',
        fen: 'fork-fen',
        sortOrder: 3
      }
    ]
  }
]

describe('SituationList', () => {
  it('renders every situation, grouped by theme', () => {
    const { container } = render(
      <SituationList
        groups={groups}
        selectedId={1}
        onSelect={() => {}}
        onShowComment={() => {}}
        onReset={() => {}}
      />
    )

    const total = groups.flatMap((group) => group.situations).length
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
        groups={groups}
        selectedId={1}
        onSelect={onSelect}
        onShowComment={() => {}}
        onReset={() => {}}
      />
    )

    fireEvent.click(getByRole('button', { name: /Конь нападает сразу на короля/ }))

    expect(onSelect).toHaveBeenCalledWith(4)
  })

  it('shows the comment button only on the active situation', () => {
    const { container, queryByRole } = render(
      <SituationList
        groups={groups}
        selectedId={1}
        onSelect={() => {}}
        onShowComment={() => {}}
        onReset={() => {}}
      />
    )

    expect(container.querySelectorAll('.situation-help')).toHaveLength(1)
    expect(queryByRole('button', { name: /Подробнее: Начальная позиция/ })).toBeInTheDocument()
    expect(queryByRole('button', { name: /Подробнее: Мат Легаля/ })).not.toBeInTheDocument()
  })

  it('numbers situations from one within each group', () => {
    const { container } = render(
      <SituationList
        groups={groups}
        selectedId={1}
        onSelect={() => {}}
        onShowComment={() => {}}
        onReset={() => {}}
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
        groups={groups}
        selectedId={2}
        onSelect={() => {}}
        onShowComment={onShowComment}
        onReset={() => {}}
      />
    )

    fireEvent.click(getByRole('button', { name: /Подробнее: Мат Легаля/ }))

    expect(onShowComment).toHaveBeenCalledWith(2)
  })

  it('shows the reset button only on the active situation', () => {
    const { container, queryByRole } = render(
      <SituationList
        groups={groups}
        selectedId={1}
        onSelect={() => {}}
        onShowComment={() => {}}
        onReset={() => {}}
      />
    )

    expect(container.querySelectorAll('.situation-reset')).toHaveLength(1)
    expect(queryByRole('button', { name: /Сбросить: Начальная позиция/ })).toBeInTheDocument()
    expect(queryByRole('button', { name: /Сбросить: Мат Легаля/ })).not.toBeInTheDocument()
  })

  it('calls onReset with the active situation id', () => {
    const onReset = vi.fn()
    const { getByRole } = render(
      <SituationList
        groups={groups}
        selectedId={2}
        onSelect={() => {}}
        onShowComment={() => {}}
        onReset={onReset}
      />
    )

    fireEvent.click(getByRole('button', { name: /Сбросить: Мат Легаля/ }))

    expect(onReset).toHaveBeenCalledWith(2)
  })
})
