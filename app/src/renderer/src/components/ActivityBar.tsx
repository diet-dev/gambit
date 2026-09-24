import { ListChecks, MonitorSmartphone, ScrollText, type LucideIcon } from 'lucide-react'

export type Activity = 'situations' | 'devices' | 'events'

type ActivityBarProps = {
  active: Activity
  onSelect: (activity: Activity) => void
}

const ITEMS: Array<{ id: Activity; icon: LucideIcon; title: string }> = [
  { id: 'situations', icon: ListChecks, title: 'Ситуации' },
  { id: 'devices', icon: MonitorSmartphone, title: 'Устройства' },
  { id: 'events', icon: ScrollText, title: 'События' }
]

function ActivityBar({ active, onSelect }: ActivityBarProps): React.JSX.Element {
  return (
    <div className="activity-bar">
      {ITEMS.map((item) => {
        const IconComponent = item.icon
        return (
          <button
            key={item.id}
            type="button"
            className={
              item.id === active ? 'activity-button activity-button-active' : 'activity-button'
            }
            title={item.title}
            aria-label={item.title}
            aria-pressed={item.id === active}
            onClick={() => onSelect(item.id)}
          >
            <IconComponent size={24} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

export default ActivityBar
