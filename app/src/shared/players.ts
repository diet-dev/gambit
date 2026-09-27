export type Player = {
  id: number
  lastName: string
  firstName: string
  middleName: string
  groupIds: number[]
}

export type PlayerInput = Omit<Player, 'id'>

export type PlayersApi = {
  list: () => Promise<Player[]>
  create: (player: PlayerInput) => Promise<Player>
  update: (player: Player) => Promise<Player>
  remove: (id: number) => Promise<void>
}
