import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import StudentsPanel from './StudentsPanel'
import type { RemoteApi } from '../../../shared/remote'
import type { Student, StudentInput, StudentsApi } from '../../../shared/students'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

function installApi(initial: Student[]): StudentsApi {
  let students = [...initial]
  const api = {
    list: vi.fn(async () => students),
    create: vi.fn(async (input: StudentInput) => {
      const created = { id: students.length + 1, ...input }
      students = [...students, created]
      return created
    }),
    update: vi.fn(async (student: Student) => {
      students = students.map((item) => (item.id === student.id ? student : item))
      return student
    }),
    remove: vi.fn(async (id: number) => {
      students = students.filter((item) => item.id !== id)
    })
  }
  window.api = { remote: remoteStub, students: api }
  return api
}

const ivanov: Student = {
  id: 1,
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  className: '7А',
  rating: 100
}

describe('StudentsPanel', () => {
  it('shows an empty state', async () => {
    installApi([])
    const { findByText } = render(<StudentsPanel />)

    expect(await findByText('Учеников пока нет')).toBeInTheDocument()
  })

  it('lists students', async () => {
    installApi([ivanov])
    const { findByText, container } = render(<StudentsPanel />)

    expect(await findByText('Иванов Иван Иванович')).toBeInTheDocument()
    expect(container).toHaveTextContent('7А')
    expect(container).toHaveTextContent('100')
  })

  it('creates a student through the form', async () => {
    const api = installApi([])
    const { getByRole, getByLabelText, findByText } = render(<StudentsPanel />)

    fireEvent.click(getByRole('button', { name: 'Добавить ученика' }))
    fireEvent.change(getByLabelText(/Фамилия/), { target: { value: 'Петров' } })
    fireEvent.change(getByLabelText(/Имя/), { target: { value: 'Пётр' } })
    fireEvent.change(getByLabelText(/Класс/), { target: { value: '8Б' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        lastName: 'Петров',
        firstName: 'Пётр',
        middleName: '',
        className: '8Б',
        rating: 0
      })
    )
    expect(await findByText('Петров Пётр')).toBeInTheDocument()
  })

  it('rejects a class with spaces and trims surrounding spaces', async () => {
    const api = installApi([])
    const { getByRole, getByLabelText, findByText } = render(<StudentsPanel />)

    fireEvent.click(getByRole('button', { name: 'Добавить ученика' }))
    fireEvent.change(getByLabelText(/Фамилия/), { target: { value: 'Петров' } })
    fireEvent.change(getByLabelText(/Имя/), { target: { value: 'Пётр' } })
    fireEvent.change(getByLabelText(/Класс/), { target: { value: '7 А' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    expect(await findByText(/Класс обязателен/)).toBeInTheDocument()
    expect(api.create).not.toHaveBeenCalled()

    fireEvent.change(getByLabelText(/Класс/), { target: { value: ' 7А ' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ className: '7А' }))
    )
  })

  it('deletes a student after confirmation', async () => {
    const api = installApi([ivanov])
    const { getByRole, findByText, queryByText, findByRole } = render(<StudentsPanel />)

    await findByText('Иванов Иван Иванович')
    fireEvent.click(getByRole('button', { name: 'Удалить: Иванов' }))
    fireEvent.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('Иванов Иван Иванович')).not.toBeInTheDocument())
  })
})
