import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import HelpArticleOverlay from './HelpArticleOverlay'
import { helpArticles } from '../help/articles'

const article = helpArticles[0]

describe('HelpArticleOverlay', () => {
  it('renders the article title and markdown body', () => {
    const { getByText, container } = render(
      <HelpArticleOverlay article={article} onClose={() => {}} />
    )

    expect(getByText(article.title)).toBeInTheDocument()
    expect(container).toHaveTextContent('Stockfish')
  })

  it('closes on the button and on Escape', () => {
    const onClose = vi.fn()
    const { getByRole } = render(<HelpArticleOverlay article={article} onClose={onClose} />)

    fireEvent.click(getByRole('button', { name: 'Закрыть' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
