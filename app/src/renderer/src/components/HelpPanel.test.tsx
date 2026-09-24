import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import HelpPanel from './HelpPanel'

describe('HelpPanel', () => {
  it('lists the bundled articles and marks the open one', () => {
    const { getByRole } = render(<HelpPanel openArticleId="license" onOpen={() => {}} />)

    expect(getByRole('button', { name: 'Лицензия' })).toHaveAttribute('aria-current', 'true')
  })

  it('calls onOpen when an article is clicked', () => {
    const onOpen = vi.fn()
    const { getByRole } = render(<HelpPanel openArticleId={null} onOpen={onOpen} />)

    fireEvent.click(getByRole('button', { name: 'Лицензия' }))

    expect(onOpen).toHaveBeenCalledWith('license')
  })
})
