import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import TournamentSettingsDialog from './TournamentSettingsDialog'
import type {
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'

const standard: TournamentSettingsWithUsage = {
  id: 1,
  name: 'Стандарт',
  weakerPlaysWhite: true,
  drawScoring: 'weaker',
  absenceScoring: 'loss',
  createdAt: '2026-09-27T00:00:00.000Z',
  used: false
}

describe('TournamentSettingsDialog', () => {
  it('creates new settings with defaults', () => {
    const onSubmit = vi.fn()
    const { getByRole, getByLabelText } = render(
      <TournamentSettingsDialog settings={null} onSubmit={onSubmit} onClose={() => {}} />
    )

    expect(getByRole('heading', { name: 'Новая настройка' })).toBeInTheDocument()
    fireEvent.change(getByLabelText(/Название/), { target: { value: 'Блиц' } })
    fireEvent.click(getByRole('button', { name: 'Создать' }))

    expect(onSubmit).toHaveBeenCalledWith(
      { name: 'Блиц', weakerPlaysWhite: true, drawScoring: 'weaker', absenceScoring: 'loss' },
      false
    )
  })

  it('edits existing settings and keeps the values', () => {
    const onSubmit = vi.fn()
    const { getByRole, getByLabelText } = render(
      <TournamentSettingsDialog settings={standard} onSubmit={onSubmit} onClose={() => {}} />
    )

    expect(getByRole('heading', { name: 'Настройка турнира' })).toBeInTheDocument()
    expect(getByLabelText(/Название/)).toHaveValue('Стандарт')

    fireEvent.click(getByLabelText('Слабый играет белыми'))
    fireEvent.change(getByLabelText('Ничья'), { target: { value: 'stronger' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))
    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: 'Стандарт',
        weakerPlaysWhite: false,
        drawScoring: 'stronger',
        absenceScoring: 'loss'
      },
      false
    )
  })

  it('submits as a new version when the settings are used', () => {
    const onSubmit = vi.fn((input: TournamentSettingsInput) => input)
    const { getByRole } = render(
      <TournamentSettingsDialog
        settings={{ ...standard, used: true }}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    )

    expect(getByRole('button', { name: 'Сохранить как новую версию' })).toBeInTheDocument()
    fireEvent.click(getByRole('button', { name: 'Сохранить как новую версию' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.anything(), true)
  })
})
