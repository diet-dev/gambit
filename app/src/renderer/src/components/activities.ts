export type Activity =
  | 'situations'
  | 'groups'
  | 'players'
  | 'tournaments'
  | 'rounds'
  | 'devices'
  | 'events'
  | 'settings'
  | 'help'

export const ACTIVITY_TITLES: Record<Activity, string> = {
  situations: 'Ситуации',
  groups: 'Группы',
  players: 'Игроки',
  tournaments: 'Турниры',
  rounds: 'Раунды',
  devices: 'Устройства',
  events: 'События',
  settings: 'Настройки',
  help: 'Справка'
}
