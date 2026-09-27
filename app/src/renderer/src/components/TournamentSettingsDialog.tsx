import { useState } from 'react'
import type {
  AbsenceScoring,
  DrawScoring,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'
import Dialog from './Dialog'

const DRAW_OPTIONS: { value: DrawScoring; label: string }[] = [
  { value: 'weaker', label: 'В пользу слабого' },
  { value: 'stronger', label: 'В пользу сильного' },
  { value: 'none', label: 'Без обмена' }
]

const ABSENCE_OPTIONS: { value: AbsenceScoring; label: string }[] = [
  { value: 'loss', label: 'Поражение неявившемуся' },
  { value: 'no_effect', label: 'Без последствий' }
]

type TournamentSettingsDialogProps = {
  settings: TournamentSettingsWithUsage | null
  onSubmit: (input: TournamentSettingsInput, asNewVersion: boolean) => void
  onClose: () => void
}

function TournamentSettingsDialog({
  settings,
  onSubmit,
  onClose
}: TournamentSettingsDialogProps): React.JSX.Element {
  const [name, setName] = useState(settings?.name ?? '')
  const [weakerPlaysWhite, setWeakerPlaysWhite] = useState(settings?.weakerPlaysWhite ?? true)
  const [drawScoring, setDrawScoring] = useState<DrawScoring>(settings?.drawScoring ?? 'weaker')
  const [absenceScoring, setAbsenceScoring] = useState<AbsenceScoring>(
    settings?.absenceScoring ?? 'loss'
  )

  const onlyNewVersion = settings !== null && settings.used

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    onSubmit({ name, weakerPlaysWhite, drawScoring, absenceScoring }, onlyNewVersion)
  }

  return (
    <Dialog titleId="tournament-settings-dialog" className="entity-form-dialog" onClose={onClose}>
      <h2 id="tournament-settings-dialog" className="comment-dialog-title">
        {settings ? 'Настройка турнира' : 'Новая настройка'}
      </h2>
      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="entity-field">
          <span>
            Название{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="entity-field">
          <span>Слабый играет белыми</span>
          <input
            type="checkbox"
            checked={weakerPlaysWhite}
            onChange={(event) => setWeakerPlaysWhite(event.target.checked)}
          />
        </label>
        <label className="entity-field">
          <span>Ничья</span>
          <select
            value={drawScoring}
            onChange={(event) => setDrawScoring(event.target.value as DrawScoring)}
          >
            {DRAW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="entity-field">
          <span>Неявка</span>
          <select
            value={absenceScoring}
            onChange={(event) => setAbsenceScoring(event.target.value as AbsenceScoring)}
          >
            {ABSENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {onlyNewVersion && (
          <p className="entity-sub">
            Настройка используется турами — изменения сохраняются новой версией.
          </p>
        )}
        <div className="entity-actions">
          <button type="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit">
            {onlyNewVersion ? 'Сохранить как новую версию' : settings ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

export default TournamentSettingsDialog
