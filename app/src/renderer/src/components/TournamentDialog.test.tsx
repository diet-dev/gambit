import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import TournamentDialog from './TournamentDialog'
import type { Group } from '../../../shared/groups'
import type { Tournament, TournamentSettingsWithUsage } from '../../../shared/tournament'

const groups: Group[] = [{ id: 1, name: '7А', comment: '' }]

const settings: TournamentSettingsWithUsage[] = [
  {
    id: 2,
    name: 'Стандарт',
    weakerPlaysWhite: true,
    drawScoring: 'weaker',
    absenceScoring: 'loss',
    createdAt: '2026-09-27T00:00:00.000Z',
    used: false
  }
]

const tournament: Tournament = {
  id: 1,
  name: 'Осенний',
  groupId: 1,
  startDate: '2026-10-01',
  settingsId: 2
}

describe('TournamentDialog', () => {
  it('creates a tournament with the chosen fields', () => {
    const onSubmit = vi.fn()
    const { getByRole, getByLabelText } = render(
      <TournamentDialog
        tournament={null}
        groups={groups}
        settings={settings}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    )

    expect(getByRole('heading', { name: 'Новый турнир' })).toBeInTheDocument()
    fireEvent.change(getByLabelText(/Название/), { target: { value: 'Осенний' } })
    fireEvent.change(getByLabelText('Группа'), { target: { value: '1' } })
    fireEvent.change(getByLabelText('Дата начала'), { target: { value: '2026-10-01' } })
    fireEvent.change(getByLabelText('Настройки'), { target: { value: '2' } })
    fireEvent.click(getByRole('button', { name: 'Создать' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Осенний',
      groupId: 1,
      startDate: '2026-10-01',
      settingsId: 2
    })
  })

  it('edits an existing tournament', () => {
    const onSubmit = vi.fn()
    const { getByRole, getByLabelText } = render(
      <TournamentDialog
        tournament={tournament}
        groups={groups}
        settings={settings}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    )

    expect(getByRole('heading', { name: 'Турнир' })).toBeInTheDocument()
    expect(getByLabelText(/Название/)).toHaveValue('Осенний')

    fireEvent.change(getByLabelText(/Название/), { target: { value: 'Зимний' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Зимний',
      groupId: 1,
      startDate: '2026-10-01',
      settingsId: 2
    })
  })

  it('disables saving when there are no groups or settings', () => {
    const onSubmit = vi.fn()
    const { getByRole } = render(
      <TournamentDialog
        tournament={null}
        groups={[]}
        settings={[]}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    )

    expect(getByRole('button', { name: 'Создать' })).toBeDisabled()
    expect(getByTextSafe('Сначала добавьте группу')).toBeInTheDocument()
    expect(getByTextSafe('Сначала добавьте настройку')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('fills the name with a template when a group is chosen and keeps it in sync', () => {
    const groups2: Group[] = [
      { id: 1, name: '7А', comment: '' },
      { id: 2, name: '8Б', comment: '' }
    ]
    const { getByLabelText } = render(
      <TournamentDialog
        tournament={null}
        groups={groups2}
        settings={settings}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    )

    const nameInput = getByLabelText(/Название/) as HTMLInputElement
    const groupSelect = getByLabelText('Группа')

    expect(nameInput).toHaveValue('')
    fireEvent.change(groupSelect, { target: { value: '1' } })
    expect(nameInput).toHaveValue('Турнир в группе "7А"')

    fireEvent.change(groupSelect, { target: { value: '2' } })
    expect(nameInput).toHaveValue('Турнир в группе "8Б"')

    fireEvent.change(nameInput, { target: { value: 'Моё название' } })
    fireEvent.change(groupSelect, { target: { value: '1' } })
    expect(nameInput).toHaveValue('Моё название')
  })
})

function getByTextSafe(text: string): HTMLElement {
  const container = document.body
  const element = Array.from(container.querySelectorAll('.entity-error')).find((item) =>
    item.textContent?.includes(text)
  )
  if (!element) {
    throw new Error(`Expected error text "${text}" not found`)
  }
  return element as HTMLElement
}
