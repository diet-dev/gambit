import {
  CircleHelp,
  GraduationCap,
  ListChecks,
  MonitorSmartphone,
  School,
  ScrollText,
  Settings,
  type LucideIcon
} from 'lucide-react'

export type Activity =
  'situations' | 'groups' | 'players' | 'devices' | 'events' | 'settings' | 'help'

type ActivityBarProps = {
  active: Activity
  onSelect: (activity: Activity) => void
}

type Item = { id: Activity; icon: LucideIcon; title: string }

const TOP_ITEMS: Item[] = [
  { id: 'situations', icon: ListChecks, title: 'Ситуации' },
  { id: 'groups', icon: School, title: 'Группы' },
  { id: 'players', icon: GraduationCap, title: 'Игроки' },
  { id: 'devices', icon: MonitorSmartphone, title: 'Устройства' },
  { id: 'events', icon: ScrollText, title: 'События' }
]

const BOTTOM_ITEMS: Item[] = [
  { id: 'settings', icon: Settings, title: 'Настройки' },
  { id: 'help', icon: CircleHelp, title: 'Справка' }
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
