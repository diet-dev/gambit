import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the empty left panel and the board in the right panel', () => {
    const { container } = render(<App />)

    expect(container.querySelector('.left-panel')).toBeInTheDocument()
    expect(container.querySelector('.right-panel')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
  })
})
