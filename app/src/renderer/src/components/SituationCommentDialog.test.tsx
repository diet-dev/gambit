import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SituationCommentDialog from './SituationCommentDialog'
import { findSituation } from '../situations'

const situation = findSituation('legal-mate')!

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
