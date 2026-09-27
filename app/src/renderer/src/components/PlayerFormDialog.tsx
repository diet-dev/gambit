import { useState } from 'react'
import type { Group } from '../../../shared/groups'
import type { Player, PlayerInput } from '../../../shared/players'
import Dialog from './Dialog'

function normalizePersonNameInput(value: string): string {
  return value
    .replace(/[^А-ЯЁа-яё-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(
      /(^|-)([а-яё])/g,
      (_match, separator: string, letter: string) => separator + letter.toUpperCase()
    )
}

function finalizePersonName(value: string): string {
  return value.replace(/-+$/, '')
}

type PlayerFormDialogProps = {
  player: Player | null
  groups: Group[]
  onSubmit: (input: PlayerInput) => void
  onClose: () => void
}

function PlayerFormDialog({
  player,
  groups,
  onSubmit,
  onClose
}: PlayerFormDialogProps): React.JSX.Element {
  const [lastName, setLastName] = useState(player?.lastName ?? '')
  const [firstName, setFirstName] = useState(player?.firstName ?? '')
  const [middleName, setMiddleName] = useState(player?.middleName ?? '')
  const [groupId, setGroupId] = useState<number | null>(player?.groupId ?? null)
  const [rating, setRating] = useState(String(player?.rating ?? 0))

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    onSubmit({
      lastName: finalizePersonName(lastName),
      firstName: finalizePersonName(firstName),
      middleName: finalizePersonName(middleName),
      groupId,
      rating: Number(rating) || 0
    })
  }

  return (
    <Dialog titleId="player-form-title" className="entity-form-dialog" onClose={onClose}>
      <h2 id="player-form-title" className="comment-dialog-title">
        {player ? 'Игрок' : 'Новый игрок'}
      </h2>
      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="entity-field">
          <span>
            Фамилия{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <input
            value={lastName}
            onChange={(event) => setLastName(normalizePersonNameInput(event.target.value))}
            required
          />
        </label>
        <label className="entity-field">
          <span>
            Имя{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <input
            value={firstName}
            onChange={(event) => setFirstName(normalizePersonNameInput(event.target.value))}
            required
          />
        </label>
        <label className="entity-field">
          <span>Отчество</span>
          <input
            value={middleName}
            onChange={(event) => setMiddleName(normalizePersonNameInput(event.target.value))}
          />
        </label>
        <label className="entity-field">
          <span>Группа</span>
          <select
            value={groupId ?? ''}
            onChange={(event) =>
              setGroupId(event.target.value === '' ? null : Number(event.target.value))
            }
          >
            <option value="">Без группы</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {groups.length === 0 && (
            <span className="entity-error">Сначала добавьте группу на вкладке «Группы»</span>
          )}
        </label>
        <label className="entity-field">
          <span>Рейтинг</span>
          <input type="number" value={rating} onChange={(event) => setRating(event.target.value)} />
        </label>
        <div className="entity-actions">
          <button type="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </Dialog>
  )
}

export default PlayerFormDialog
