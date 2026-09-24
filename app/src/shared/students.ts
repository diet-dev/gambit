export type Student = {
  id: number
  lastName: string
  firstName: string
  middleName: string
  classId: number | null
  rating: number
}

export type StudentInput = Omit<Student, 'id'>

export type StudentsApi = {
  list: () => Promise<Student[]>
  create: (student: StudentInput) => Promise<Student>
  update: (student: Student) => Promise<Student>
  remove: (id: number) => Promise<void>
}
