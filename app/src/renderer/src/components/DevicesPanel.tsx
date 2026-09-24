import { useRemoteClients } from '../hooks/useRemoteClients'

function deviceLabel(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) {
    return 'iPhone'
  }
  if (/iPad/i.test(userAgent)) {
    return 'iPad'
  }
  if (/Android/i.test(userAgent)) {
    return 'Android'
  }
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'Mac'
  }
  if (/Windows/i.test(userAgent)) {
    return 'Windows'
  }
  if (/Linux/i.test(userAgent)) {
    return 'Linux'
  }
  return 'Устройство'
}

function DevicesPanel(): React.JSX.Element {
  const clients = useRemoteClients()

  return (
    <div className="devices-panel">
      {clients.length === 0 ? (
        <p className="devices-empty">Устройства ещё не подключались</p>
      ) : (
        <ul className="devices-list">
          {clients.map((client) => (
            <li key={client.id} className="device-item">
              <span
                className={client.online ? 'device-status device-status-online' : 'device-status'}
                aria-hidden="true"
              />
              <span className="device-name">{deviceLabel(client.userAgent)}</span>
              <span className="device-address">{client.address}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DevicesPanel
