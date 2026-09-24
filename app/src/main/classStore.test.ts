import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createClassStore, type ClassStore } from './classStore'
import { createStudentStore, type StudentStore } from './studentStore'

function makeStores(): { classes: ClassStore; students: StudentStore } {
  const database = openDatabase(':memory:')
  return {
    classes: createClassStore(database),
    students: createStudentStore(database)
  }
}

describe('classStore', () => {
  it('creates and lists classes ordered by name', () => {
    const { classes } = makeStores()

    const seven = classes.create({ name: '7А', comment: 'первый' })
    classes.create({ name: '8Б', comment: '' })

    expect(seven.id).toBeGreaterThan(0)
    expect(classes.list()).toEqual([
      { id: seven.id, name: '7А', comment: 'первый' },
      { id: seven.id + 1, name: '8Б', comment: '' }
    ])
  })

  it('updates a class', () => {
    const { classes } = makeStores()
    const created = classes.create({ name: '7А', comment: '' })

    const updated = classes.update({ ...created, name: '7Б', comment: 'изменён' })

    expect(updated).toEqual({ id: created.id, name: '7Б', comment: 'изменён' })
  })

  it('removes a class and clears the reference on its students', () => {
    const { classes, students } = makeStores()
    const schoolClass = classes.create({ name: '7А', comment: '' })
    const student = students.create({
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: '',
      classId: schoolClass.id,
      rating: 0
    })

    classes.remove(schoolClass.id)

    expect(classes.list()).toHaveLength(0)
    expect(students.list()[0]).toMatchObject({ id: student.id, classId: null })
  })
})
