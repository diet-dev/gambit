import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Round, RoundOutcome, RoundResultsRow } from '../../../shared/tournament'

const OUTCOME_LABELS: Record<RoundOutcome, string> = {
  win: 'Выиграл',
  loss: 'Проиграл',
  draw: 'Ничья',
  forfeit_win: 'Техническая победа',
  forfeit_loss: 'Техническое поражение',
  no_game: 'Игра не состоялась',
  resting: 'Отдыхал'
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

type RoundResultsOverlayProps = {
  round: Round
  onClose: () => void
}

function RoundResultsOverlay({ round, onClose }: RoundResultsOverlayProps): React.JSX.Element {
  const [rows, setRows] = useState<RoundResultsRow[] | null>(null)

  useEffect(() => {
    let active = true
    window.api?.tournament?.rounds.results(round.id).then((value) => {
      if (active) {
        setRows(value)
      }
    })
    return () => {
      active = false
    }
  }, [round.id])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="round-form-overlay">
      <button type="button" className="help-overlay-close" aria-label="Закрыть" onClick={onClose}>
        <X size={32} aria-hidden="true" />
      </button>
      <h2 className="help-overlay-title">
        Раунд №{round.seq} — {formatDate(round.playedDate)}
      </h2>
      {rows === null ? (
        <p className="entity-empty">Загрузка…</p>
      ) : (
        <table className="round-results-table">
          <thead>
            <tr>
              <th>Позиция</th>
              <th>ФИО</th>
              <th>Исход</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.playerId}>
                <td>{row.position}</td>
                <td>{[row.lastName, row.firstName, row.middleName].filter(Boolean).join(' ')}</td>
                <td>{OUTCOME_LABELS[row.outcome]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default RoundResultsOverlay
