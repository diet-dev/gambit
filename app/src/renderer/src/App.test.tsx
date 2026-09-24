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

  it('switches the left panel to the devices tab', () => {
    const { container, getByRole, queryByRole } = render(<App />)

    expect(container.querySelector('.left-panel .situation-list')).toBeInTheDocument()

    fireEvent.click(getByRole('button', { name: 'Устройства' }))

    expect(getByRole('button', { name: 'Устройства' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .devices-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the events tab', () => {
    const { container, getByRole, queryByRole } = render(<App />)

    fireEvent.click(getByRole('button', { name: 'События' }))

    expect(getByRole('button', { name: 'События' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .events-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the classes tab', () => {
    const { container, getByRole, queryByRole } = render(<App />)

    fireEvent.click(getByRole('button', { name: 'Классы' }))

    expect(getByRole('button', { name: 'Классы' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .classes-panel')).toBeInTheDocument()
  })

  it('switches the left panel to the students tab', () => {
    const { container, getByRole, queryByRole } = render(<App />)

    fireEvent.click(getByRole('button', { name: 'Ученики' }))

    expect(getByRole('button', { name: 'Ученики' })).toHaveClass('activity-button-active')
    expect(queryByRole('button', { name: /Мат в один ход/ })).not.toBeInTheDocument()
    expect(container.querySelector('.left-panel .students-panel')).toBeInTheDocument()
  })

  it('restarts the active situation by remounting the board', () => {
    const { container, getByRole } = render(<App />)
    const boardBefore = container.querySelector('.board')

    fireEvent.click(getByRole('button', { name: /Сбросить: Начальная позиция/ }))

    expect(container.querySelector('.board')).not.toBe(boardBefore)
    expect(container.querySelector('[data-square="e2"] [data-piece="wP"]')).toBeInTheDocument()
  })

  it('switches the left panel to the settings and help tabs', () => {
    const { container, getByRole } = render(<App />)

    fireEvent.click(getByRole('button', { name: 'Настройки' }))
    expect(container.querySelector('.left-panel .settings-panel')).toBeInTheDocument()

    fireEvent.click(getByRole('button', { name: 'Справка' }))
    expect(container.querySelector('.left-panel .help-panel')).toBeInTheDocument()
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
