import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the situation list on the left and the board in the right panel', () => {
    const { container } = render(<App />)

    expect(container.querySelector('.left-panel .situation-list')).toBeInTheDocument()
    expect(container.querySelector('.right-panel')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
  })

  it('loads a situation onto the board when it is clicked', () => {
    const { container, getByRole } = render(<App />)

    fireEvent.click(getByRole('button', { name: /Мат в один ход/ }))

    expect(container.querySelector('[data-square="g8"] [data-piece="bK"]')).toBeInTheDocument()
    expect(container.querySelector('[data-square="e1"] [data-piece="wQ"]')).toBeInTheDocument()
  })

  it('restarts the active situation by remounting the board', () => {
    const { container, getByRole } = render(<App />)
    const boardBefore = container.querySelector('.board')

    fireEvent.click(getByRole('button', { name: /Сбросить: Начальная позиция/ }))

    expect(container.querySelector('.board')).not.toBe(boardBefore)
    expect(container.querySelector('[data-square="e2"] [data-piece="wP"]')).toBeInTheDocument()
  })

  it('reflects the selected situation in the window title', () => {
    const { getByRole } = render(<App />)

    expect(document.title).toBe('Гамбит — Начальная позиция')

    fireEvent.click(getByRole('button', { name: /Мат в один ход/ }))

    expect(document.title).toBe('Гамбит — Мат в один ход')
  })

  it('opens the comment dialog for the active situation and closes it on Escape', () => {
    const { queryByRole, getByRole } = render(<App />)

    fireEvent.click(getByRole('button', { name: /Подробнее: Начальная позиция/ }))

    const dialog = getByRole('dialog')
    expect(dialog).toHaveTextContent('Начальная позиция')
    expect(dialog).toHaveTextContent('точка отсчёта любой партии')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })
})
