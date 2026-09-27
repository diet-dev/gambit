import { useState } from 'react'
import type {
  Tournament,
  TournamentInput,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'
import type { Group } from '../../../shared/groups'
import Dialog from './Dialog'

type TournamentDialogProps = {
  tournament: Tournament | null
  groups: Group[]
  settings: TournamentSettingsWithUsage[]
  onSubmit: (input: TournamentInput) => void
  onClose: () => void
}

function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function nameTemplateFor(groupId: number, groups: Group[]): string {
  const group = groups.find((item) => item.id === groupId)
  return `Турнир в группе "${group?.name ?? ''}"`
}

function TournamentDialog({
  tournament,
  groups,
  settings,
  onSubmit,
  onClose
}: TournamentDialogProps): React.JSX.Element {
  const [name, setName] = useState(tournament?.name ?? '')
  const [groupId, setGroupId] = useState<number | null>(tournament?.groupId ?? null)
  const [startDate, setStartDate] = useState(tournament?.startDate ?? today())
  const [settingsId, setSettingsId] = useState<number | null>(tournament?.settingsId ?? null)
  const [nameTemplate, setNameTemplate] = useState<string | null>(
    tournament?.groupId != null ? nameTemplateFor(tournament.groupId, groups) : null
  )

  function handleGroupChange(value: number): void {
    setGroupId(value)
    if (name === '' || name === nameTemplate) {
      const nextTemplate = nameTemplateFor(value, groups)
      setName(nextTemplate)
      setNameTemplate(nextTemplate)
    }
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (groupId === null || settingsId === null || startDate === '') {
      return
    }
    onSubmit({ name, groupId, startDate, settingsId })
  }

  return (
    <Dialog titleId="tournament-dialog" className="entity-form-dialog" onClose={onClose}>
      <h2 id="tournament-dialog" className="comment-dialog-title">
        {tournament ? 'Турнир' : 'Новый турнир'}
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
          <span>
            Группа{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <select
            value={groupId ?? ''}
            onChange={(event) => handleGroupChange(Number(event.target.value))}
            required
          >
            <option value="" disabled>
              Выберите группу
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {groups.length === 0 && (
            <span className="entity-error">Нет групп с игроками — сначала добавьте игроков</span>
          )}
        </label>
        <label className="entity-field">
          <span>
            Дата начала{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </label>
        <label className="entity-field">
          <span>
            Настройки{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <select
            value={settingsId ?? ''}
            onChange={(event) => setSettingsId(Number(event.target.value))}
            required
          >
            <option value="" disabled>
              Выберите настройки
            </option>
            {settings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {settings.length === 0 && (
            <span className="entity-error">
              Сначала добавьте настройку на подвкладке «Настройки»
            </span>
          )}
        </label>
        <div className="entity-actions">
          <button type="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" disabled={groups.length === 0 || settings.length === 0}>
            {tournament ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

export default TournamentDialog
