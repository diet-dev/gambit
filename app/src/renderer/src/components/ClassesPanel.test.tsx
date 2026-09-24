import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import ClassesPanel from './ClassesPanel'
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

const studentsStub: StudentsApi = {
  list: vi.fn(async () => []),
  create: vi.fn(async (input: StudentInput) => ({ id: 1, ...input })),
  update: vi.fn(async (student: Student) => student),
  remove: vi.fn(async () => {})
}

function installApi(initial: SchoolClass[]): ClassesApi {
  let classes = [...initial]
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
  window.api = { remote: remoteStub, students: studentsStub, classes: classesApi }
  return classesApi
}

describe('ClassesPanel', () => {
  it('shows an empty state', async () => {
    installApi([])
    const { findByText } = render(<ClassesPanel />)

    expect(await findByText('Классов пока нет')).toBeInTheDocument()
  })

  it('lists classes with name and comment', async () => {
    installApi([{ id: 1, name: '7А', comment: 'первый' }])
    const { findByText, container } = render(<ClassesPanel />)

    expect(await findByText('7А')).toBeInTheDocument()
    expect(container).toHaveTextContent('первый')
  })

  it('creates a class through the form', async () => {
    const api = installApi([])
    const { getByRole, getByLabelText, findByText } = render(<ClassesPanel />)

    fireEvent.click(getByRole('button', { name: 'Добавить класс' }))
    fireEvent.change(getByLabelText(/Название/), { target: { value: '8Б' } })
    fireEvent.change(getByLabelText('Комментарий'), { target: { value: 'второй' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(api.create).toHaveBeenCalledWith({ name: '8Б', comment: 'второй' }))
    expect(await findByText('8Б')).toBeInTheDocument()
  })

  it('filters the class name to uppercase russian letters and digits', () => {
    installApi([])
    const { getByRole, getByLabelText } = render(<ClassesPanel />)

    fireEvent.click(getByRole('button', { name: 'Добавить класс' }))
    const input = getByLabelText(/Название/) as HTMLInputElement
    fireEvent.change(input, { target: { value: '7а-8 б' } })

    expect(input.value).toBe('7А8Б')
  })

  it('rejects a duplicate class name', async () => {
    const api = installApi([{ id: 1, name: '7А', comment: '' }])
    const { getByRole, getByLabelText, findByText } = render(<ClassesPanel />)

    await findByText('7А')
    fireEvent.click(getByRole('button', { name: 'Добавить класс' }))
    fireEvent.change(getByLabelText(/Название/), { target: { value: '7А' } })
    fireEvent.click(getByRole('button', { name: 'Сохранить' }))

    expect(await findByText('Класс с таким именем уже есть')).toBeInTheDocument()
    expect(api.create).not.toHaveBeenCalled()
  })

  it('deletes a class after confirmation', async () => {
    const api = installApi([{ id: 1, name: '7А', comment: '' }])
    const { getByRole, findByText, queryByText, findByRole } = render(<ClassesPanel />)

    await findByText('7А')
    fireEvent.click(getByRole('button', { name: 'Удалить: 7А' }))
    fireEvent.click(await findByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1))
    await waitFor(() => expect(queryByText('7А')).not.toBeInTheDocument())
  })
})
