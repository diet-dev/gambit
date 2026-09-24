import { describe, expect, it } from 'vitest'
import { openDatabase } from './database'
import { createClassStore, type ClassStore } from './classStore'
import { createStudentStore, type StudentStore } from './studentStore'

function makeStores(): { students: StudentStore; classes: ClassStore } {
  const database = openDatabase(':memory:')
  return {
    students: createStudentStore(database),
    classes: createClassStore(database)
  }
}

const input = {
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  rating: 100
}

describe('studentStore', () => {
  it('creates a student and lists it', () => {
    const { students, classes } = makeStores()
    const schoolClass = classes.create({ name: '7А', comment: '' })

    const created = students.create({ ...input, classId: schoolClass.id })

    expect(created.id).toBeGreaterThan(0)
    expect(created).toMatchObject({ ...input, classId: schoolClass.id })
    expect(students.list()).toEqual([created])
  })

  it('updates a student', () => {
    const { students, classes } = makeStores()
    const sevenA = classes.create({ name: '7А', comment: '' })
    const eightB = classes.create({ name: '8Б', comment: '' })
    const created = students.create({ ...input, classId: sevenA.id })

    const updated = students.update({ ...created, rating: 250, classId: eightB.id })

    expect(updated).toMatchObject({ id: created.id, rating: 250, classId: eightB.id })
    expect(students.list()[0].classId).toBe(eightB.id)
  })

  it('removes a student', () => {
    const { students, classes } = makeStores()
    const schoolClass = classes.create({ name: '7А', comment: '' })
    const created = students.create({ ...input, classId: schoolClass.id })

    students.remove(created.id)

    expect(students.list()).toHaveLength(0)
  })

  it('lists students ordered by last name', () => {
    const { students, classes } = makeStores()
    const schoolClass = classes.create({ name: '7А', comment: '' })
    students.create({ ...input, lastName: 'Яковлев', classId: schoolClass.id })
    students.create({ ...input, lastName: 'Абрамов', classId: schoolClass.id })

    expect(students.list().map((student) => student.lastName)).toEqual(['Абрамов', 'Яковлев'])
  })
})
