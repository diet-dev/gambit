import { deviceLabel } from '../remote/deviceLabel'
import { useRemoteClients } from '../hooks/useRemoteClients'

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
