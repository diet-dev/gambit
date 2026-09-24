import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentsPanel from './StudentsPanel'
import type { RemoteApi } from '../../../shared/remote'
import type { ClassInput, ClassesApi, SchoolClass } from '../../../shared/classes'
import type { Student, StudentInput, StudentsApi } from '../../../shared/students'

const remoteStub: RemoteApi = {
  publishPosition: vi.fn(),
  onRemoteMove: vi.fn(() => () => {}),
  getServerInfo: vi.fn(async () => null),
  getClients: vi.fn(async () => []),
  onClientsChanged: vi.fn(() => () => {})
}

function installApi(
  studentsInit: Student[],
  classesInit: SchoolClass[]
): { studentsApi: StudentsApi; classesApi: ClassesApi } {
  let students = [...studentsInit]
  let classes = [...classesInit]
  const studentsApi = {
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
  const classesApi = {
    list: vi.fn(async () => classes),
    create: vi.fn(async (input: ClassInput) => {
      const created = { id: classes.length + 1, ...input }
      classes = [...classes, created]
      return created
    }),
    update: vi.fn(async (schoolClass: SchoolClass) => {
      classes = classes.map((item) => (item.id === schoolClass.id ? schoolClass : item))
      return schoolClass
    }),
    remove: vi.fn(async (id: number) => {
      classes = classes.filter((item) => item.id !== id)
    })
  }
  window.api = { remote: remoteStub, students: studentsApi, classes: classesApi }
  return { studentsApi, classesApi }
}

const ivanov: Student = {
  id: 1,
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  classId: 1,
  rating: 100
}

const classes: SchoolClass[] = [
  { id: 1, name: '7А', comment: '' },
  { id: 2, name: '8Б', comment: '' }
]

describe('StudentsPanel', () => {
  it('shows an empty state', async () => {
    installApi([], classes)
    const { findByText } = render(<StudentsPanel />)

    expect(await findByText('Учеников пока нет')).toBeInTheDocument()
  })

  it('lists students with their class name', async () => {
    installApi([ivanov], classes)
    const { findByText, container } = render(<StudentsPanel />)

    expect(await findByText('Иванов Иван Иванович')).toBeInTheDocument()
    expect(container).toHaveTextContent('7А')
    expect(container).toHaveTextContent('100')
  })

  it('creates a student with the chosen class', async () => {
    const { studentsApi } = installApi([], classes)
    const user = userEvent.setup()
    const { getByRole, getByLabelText, findByText } = render(<StudentsPanel />)

    await user.click(getByRole('button', { name: 'Добавить ученика' }))
    await user.type(getByLabelText(/Фамилия/), 'Петров')
    await user.type(getByLabelText(/Имя/), 'Пётр')
    await user.selectOptions(getByRole('combobox'), '2')
    await user.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(studentsApi.create).toHaveBeenCalledWith({
        lastName: 'Петров',
        firstName: 'Пётр',
        middleName: '',
        classId: 2,
        rating: 0
      })
    )
    expect(await findByText('Петров Пётр')).toBeInTheDocument()
  })

  it('requires selecting a class', async () => {
    const { studentsApi } = installApi([], classes)
    const { getByRole, getByLabelText, findByText } = render(<StudentsPanel />)

    fireEvent.click(getByRole('button', { name: 'Добавить ученика' }))
    fireEvent.change(getByLabelText(/Фамилия/), { target: { value: 'Петров' } })
    fireEvent.change(getByLabelText(/Имя/), { target: { value: 'Пётр' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    expect(await findByText('Выберите класс')).toBeInTheDocument()
    expect(studentsApi.create).not.toHaveBeenCalled()
  })

  it('deletes a student after confirmation', async () => {
    const { studentsApi } = installApi([ivanov], classes)
    const { getByRole, findByText, queryByText, findByRole } = render(<StudentsPanel />)

    await findByText('Иванов Иван Иванович')
    fireEvent.click(getByRole('button', { name: 'Удалить: Иванов' }))
    fireEvent.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(studentsApi.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('Иванов Иван Иванович')).not.toBeInTheDocument())
  })
})
