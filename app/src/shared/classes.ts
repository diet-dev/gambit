export type SchoolClass = {
  id: number
  name: string
  comment: string
}

export type ClassInput = Omit<SchoolClass, 'id'>

export type ClassesApi = {
  list: () => Promise<SchoolClass[]>
  create: (input: ClassInput) => Promise<SchoolClass>
  update: (schoolClass: SchoolClass) => Promise<SchoolClass>
  remove: (id: number) => Promise<void>
}
