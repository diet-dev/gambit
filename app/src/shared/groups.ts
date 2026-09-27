export type Group = {
  id: number
  name: string
  comment: string
}

export type GroupInput = Omit<Group, 'id'>

export type GroupsApi = {
  list: () => Promise<Group[]>
  create: (input: GroupInput) => Promise<Group>
  update: (group: Group) => Promise<Group>
  remove: (id: number) => Promise<void>
}
