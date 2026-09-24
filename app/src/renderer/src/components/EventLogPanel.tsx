import type { RemoteEvent } from '../events'

type EventLogPanelProps = {
  events: RemoteEvent[]
}

function eventText(event: RemoteEvent): string {
  switch (event.kind) {
    case 'device-new':
      return `Новое устройство: ${event.label} (${event.address})`
    case 'device-online':
      return `${event.label} подключился`
    case 'device-offline':
      return `${event.label} отключился`
    case 'move':
      return event.origin === 'remote'
        ? `Ход с телефона: ${event.from} → ${event.to}`
        : `Ход: ${event.from} → ${event.to}`
  }
}

function formatTime(time: number): string {
  return new Date(time).toLocaleTimeString('ru-RU', { hour12: false })
}

function EventLogPanel({ events }: EventLogPanelProps): React.JSX.Element {
  if (events.length === 0) {
    return (
      <div className="events-panel">
        <p className="events-empty">Событий пока нет</p>
      </div>
    )
  }

  return (
    <div className="events-panel">
      <ul className="events-list">
        {[...events].reverse().map((event) => (
          <li key={event.id} className={`event-item event-${event.kind}`}>
            <span className="event-time">{formatTime(event.time)}</span>
            <span className="event-text">{eventText(event)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EventLogPanel
