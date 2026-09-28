import { useEffect } from 'react'
import type { Round } from '../../../shared/tournament'
import { useRounds } from '../hooks/useRounds'
import { useTournaments } from '../hooks/useTournaments'
import { useTournamentSettings } from '../hooks/useTournamentSettings'

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

type RoundsPanelProps = {
  selectedTournamentId: number | null
  onSelectTournament: (tournamentId: number | null) => void
  onCreateRound: () => void
  savedAt: number
}

function RoundsPanel({
  selectedTournamentId,
  onSelectTournament,
  onCreateRound,
  savedAt
}: RoundsPanelProps): React.JSX.Element {
  const { tournaments } = useTournaments()
  const { settings } = useTournamentSettings()
  const { rounds, reload } = useRounds(selectedTournamentId)

  useEffect(() => {
    if (savedAt > 0) {
      void reload()
    }
  }, [savedAt, reload])

  const settingsNames = new Map(settings.map((item) => [item.id, item.name]))

  return (
    <div className="entity-panel rounds-panel">
      <label className="entity-field">
        <span>Турнир</span>
        <select
          value={selectedTournamentId ?? ''}
          onChange={(event) =>
            onSelectTournament(event.target.value === '' ? null : Number(event.target.value))
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
      {selectedTournamentId !== null && (
        <div className="rounds-header">
          <button type="button" className="entity-add" onClick={onCreateRound}>
            Создать раунд
          </button>
        </div>
      )}
      {selectedTournamentId !== null &&
        (rounds.length === 0 ? (
          <p className="entity-empty">Раундов пока нет</p>
        ) : (
          <ul className="entity-list">
            {[...rounds].reverse().map((round: Round) => (
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
