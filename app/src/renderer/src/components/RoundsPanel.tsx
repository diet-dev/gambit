import { useState } from 'react'
import type { Round } from '../../../shared/tournament'
import { useRounds } from '../hooks/useRounds'
import { useTournaments } from '../hooks/useTournaments'
import { useTournamentSettings } from '../hooks/useTournamentSettings'

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

function RoundsPanel(): React.JSX.Element {
  const { tournaments } = useTournaments()
  const { settings } = useTournamentSettings()
  const [tournamentId, setTournamentId] = useState<number | null>(null)
  const { rounds } = useRounds(tournamentId)

  const settingsNames = new Map(settings.map((item) => [item.id, item.name]))

  return (
    <div className="entity-panel rounds-panel">
      <label className="entity-field">
        <span>Турнир</span>
        <select
          value={tournamentId ?? ''}
          onChange={(event) =>
            setTournamentId(event.target.value === '' ? null : Number(event.target.value))
          }
        >
          <option value="">Выберите турнир</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
        {tournaments.length === 0 && (
          <span className="entity-error">Сначала создайте турнир на подвкладке «Турниры»</span>
        )}
      </label>
      {tournamentId !== null &&
        (rounds.length === 0 ? (
          <p className="entity-empty">Раундов пока нет</p>
        ) : (
          <ul className="entity-list">
            {rounds.map((round: Round) => (
              <li key={round.id} className="entity-item">
                <span className="entity-name">№{round.seq}</span>
                <span className="entity-sub">
                  {[formatDate(round.playedDate), settingsNames.get(round.settingsId) ?? '—'].join(
                    ' · '
                  )}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}

export default RoundsPanel
