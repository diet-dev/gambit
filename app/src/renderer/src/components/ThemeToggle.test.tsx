import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  it('renders both theme options as a radio group', () => {
    const { getByRole } = render(<ThemeToggle theme="dark" onChange={() => {}} />)

    expect(getByRole('radiogroup', { name: 'Тема оформления' })).toBeInTheDocument()
    expect(getByRole('radio', { name: 'Тёмная' })).toBeChecked()
    expect(getByRole('radio', { name: 'Светлая' })).not.toBeChecked()
  })

  it('marks the light option as checked when the light theme is active', () => {
    const { getByRole } = render(<ThemeToggle theme="light" onChange={() => {}} />)

    expect(getByRole('radio', { name: 'Светлая' })).toBeChecked()
    expect(getByRole('radio', { name: 'Тёмная' })).not.toBeChecked()
  })

  it('asks for the light theme when it is clicked', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<ThemeToggle theme="dark" onChange={onChange} />)

    fireEvent.click(getByRole('radio', { name: 'Светлая' }))

    expect(onChange).toHaveBeenCalledWith('light')
  })

  it('asks for the dark theme when it is clicked', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<ThemeToggle theme="light" onChange={onChange} />)

    fireEvent.click(getByRole('radio', { name: 'Тёмная' }))

    expect(onChange).toHaveBeenCalledWith('dark')
  })
})
