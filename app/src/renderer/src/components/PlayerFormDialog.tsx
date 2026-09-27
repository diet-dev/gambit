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

const modifierKey = /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘ Cmd' : 'Ctrl'

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
  const [groupIds, setGroupIds] = useState<number[]>(player?.groupIds ?? [])
  const [groupsError, setGroupsError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (groupIds.length === 0) {
      setGroupsError('Выберите хотя бы одну группу')
      return
    }
    onSubmit({
      lastName: finalizePersonName(lastName),
      firstName: finalizePersonName(firstName),
      middleName: finalizePersonName(middleName),
      groupIds
    })
  }

  return (
    <Dialog titleId="player-form-title" className="entity-form-dialog" onClose={onClose}>
      <h2 id="player-form-title" className="comment-dialog-title">
        {player ? 'Игрок' : 'Новый игрок'}
      </h2>
      <form className="entity-form player-form" onSubmit={handleSubmit}>
        <label className="entity-field">
          <span className="entity-field-label">
            Фамилия{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <span className="entity-field-control">
            <input
              value={lastName}
              onChange={(event) => setLastName(normalizePersonNameInput(event.target.value))}
              required
            />
          </span>
        </label>
        <label className="entity-field">
          <span className="entity-field-label">
            Имя{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <span className="entity-field-control">
            <input
              value={firstName}
              onChange={(event) => setFirstName(normalizePersonNameInput(event.target.value))}
              required
            />
          </span>
        </label>
        <label className="entity-field">
          <span className="entity-field-label">Отчество</span>
          <span className="entity-field-control">
            <input
              value={middleName}
              onChange={(event) => setMiddleName(normalizePersonNameInput(event.target.value))}
            />
          </span>
        </label>
        <label className="entity-field">
          <span className="entity-field-label">
            Группы{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <span className="entity-field-control">
            <select
              multiple
              value={groupIds.map(String)}
              onChange={(event) => {
                setGroupIds(
                  Array.from(event.target.selectedOptions, (option) => Number(option.value))
                )
                setGroupsError(null)
              }}
              required
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {groups.length > 0 && (
              <span className="entity-hint">
                Для выбора нескольких групп удерживайте {modifierKey}
              </span>
            )}
            {groups.length === 0 && (
              <span className="entity-error">Сначала добавьте группу на вкладке «Группы»</span>
            )}
            {groupsError && <span className="entity-error">{groupsError}</span>}
          </span>
        </label>
        <div className="entity-actions">
          <button type="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" disabled={groups.length === 0}>
            Сохранить
          </button>
        </div>
      </form>
    </Dialog>
  )
}

export default PlayerFormDialog
