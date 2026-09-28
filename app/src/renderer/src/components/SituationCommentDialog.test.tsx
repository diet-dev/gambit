import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SituationCommentDialog from './SituationCommentDialog'
import type { Situation } from '../../../shared/situations'

const situation: Situation = {
  id: 2,
  groupId: 1,
  title: 'Мат Легаля',
  description: 'Классическая ловушка в дебюте.',
  comment: 'Белые жертвуют ферзя, чтобы заманить чёрного короля под удар лёгких фигур.',
  fen: 'rn1q1bnr/ppp1kB1p/3p2p1/3NN3/4P3/8/PPPP1PPP/R1BbK2R b KQ - 2 7',
  sortOrder: 1
}

describe('SituationCommentDialog', () => {
  it('renders the situation title and comment', () => {
    const { getByRole, getByText } = render(
      <SituationCommentDialog situation={situation} onClose={() => {}} />
    )

    expect(getByRole('dialog')).toBeInTheDocument()
    expect(getByRole('dialog')).toHaveTextContent(situation.title)
    expect(getByText(situation.comment)).toBeInTheDocument()
  })

  it('closes on the close button', () => {
    const onClose = vi.fn()
    const { getByRole } = render(<SituationCommentDialog situation={situation} onClose={onClose} />)

    fireEvent.click(getByRole('button', { name: 'Закрыть' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<SituationCommentDialog situation={situation} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
