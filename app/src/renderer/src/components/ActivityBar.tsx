import {
  CircleHelp,
  GraduationCap,
  ListChecks,
  MonitorSmartphone,
  School,
  ScrollText,
  Settings,
  Swords,
  Trophy,
  type LucideIcon
} from 'lucide-react'

import { ACTIVITY_TITLES, type Activity } from './activities'

type ActivityBarProps = {
  active: Activity
  onSelect: (activity: Activity) => void
}

type Item = { id: Activity; icon: LucideIcon; title: string }

const TOP_ITEMS: Item[] = [
  { id: 'situations', icon: ListChecks, title: ACTIVITY_TITLES.situations },
  { id: 'groups', icon: School, title: ACTIVITY_TITLES.groups },
  { id: 'players', icon: GraduationCap, title: ACTIVITY_TITLES.players },
  { id: 'tournaments', icon: Trophy, title: ACTIVITY_TITLES.tournaments },
  { id: 'rounds', icon: Swords, title: ACTIVITY_TITLES.rounds },
  { id: 'devices', icon: MonitorSmartphone, title: ACTIVITY_TITLES.devices },
  { id: 'events', icon: ScrollText, title: ACTIVITY_TITLES.events }
]

const BOTTOM_ITEMS: Item[] = [
  { id: 'settings', icon: Settings, title: ACTIVITY_TITLES.settings },
  { id: 'help', icon: CircleHelp, title: ACTIVITY_TITLES.help }
]

function ActivityButton({
  item,
  active,
  onSelect
}: {
  item: Item
  active: Activity
  onSelect: (activity: Activity) => void
}): React.JSX.Element {
  const IconComponent = item.icon
  return (
    <button
      type="button"
      className={item.id === active ? 'activity-button activity-button-active' : 'activity-button'}
      title={item.title}
      aria-label={item.title}
      aria-pressed={item.id === active}
      onClick={() => onSelect(item.id)}
    >
      <IconComponent size={24} aria-hidden="true" />
    </button>
  )
}

function ActivityBar({ active, onSelect }: ActivityBarProps): React.JSX.Element {
  return (
    <div className="activity-bar">
      <div className="activity-bar-group">
        {TOP_ITEMS.map((item) => (
          <ActivityButton key={item.id} item={item} active={active} onSelect={onSelect} />
        ))}
      </div>
      <div className="activity-bar-group activity-bar-bottom">
        {BOTTOM_ITEMS.map((item) => (
          <ActivityButton key={item.id} item={item} active={active} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

export default ActivityBar
