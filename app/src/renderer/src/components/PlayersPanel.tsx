import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Player, PlayerInput } from '../../../shared/players'
import { useGroups } from '../hooks/useGroups'
import { usePlayers } from '../hooks/usePlayers'
import Dialog from './Dialog'
import PlayerFormDialog from './PlayerFormDialog'

function playerName(player: Player): string {
  return [player.lastName, player.firstName, player.middleName].filter(Boolean).join(' ')
}

function PlayersPanel(): React.JSX.Element {
  const { players, create, update, remove } = usePlayers()
  const { groups } = useGroups()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Player | null>(null)
  const [deleting, setDeleting] = useState<Player | null>(null)
  const [groupFilter, setGroupFilter] = useState<number | null>(null)

  const groupNames = new Map(groups.map((group) => [group.id, group.name]))
  const visiblePlayers =
    groupFilter === null
      ? players
      : players.filter((player) => player.groupIds.includes(groupFilter))

  function openCreate(): void {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(player: Player): void {
    setEditing(player)
    setFormOpen(true)
  }

  async function submit(input: PlayerInput): Promise<void> {
    if (editing) {
      await update({ ...input, id: editing.id })
    } else {
      await create(input)
    }
    setFormOpen(false)
  }

  async function confirmDelete(): Promise<void> {
    if (deleting) {
      await remove(deleting.id)
      setDeleting(null)
    }
  }

  return (
    <div className="entity-panel players-panel">
      <div className="entity-header">
        <button type="button" className="entity-add" onClick={openCreate}>
          Добавить игрока
        </button>
        <label className="players-filter">
          <span>Группа:</span>
          <select
            value={groupFilter ?? ''}
            onChange={(event) =>
              setGroupFilter(event.target.value === '' ? null : Number(event.target.value))
            }
          >
            <option value="">Все группы</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {players.length === 0 ? (
        <p className="entity-empty">Игроков пока нет</p>
      ) : visiblePlayers.length === 0 ? (
        <p className="entity-empty">В этой группе пока нет игроков</p>
      ) : (
        <ul className="entity-list">
          {visiblePlayers.map((player) => (
            <li key={player.id} className="entity-item">
              <span className="entity-name">{playerName(player)}</span>
              <span className="entity-sub">
                {player.groupIds.map((id) => groupNames.get(id) ?? '—').join(', ')}
              </span>
              <button
                type="button"
                className="entity-action"
                aria-label={`Изменить: ${player.lastName}`}
                onClick={() => openEdit(player)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="entity-action"
                aria-label={`Удалить: ${player.lastName}`}
                onClick={() => setDeleting(player)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {formOpen && (
        <PlayerFormDialog
          player={editing}
          groups={groups}
          onSubmit={submit}
          onClose={() => setFormOpen(false)}
        />
      )}
      {deleting && (
        <Dialog
          titleId="player-delete-title"
          className="entity-delete-dialog"
          onClose={() => setDeleting(null)}
        >
          <h2 id="player-delete-title" className="comment-dialog-title">
            Удалить игрока?
          </h2>
          <p className="comment-dialog-text">{playerName(deleting)}</p>
          <div className="entity-actions">
            <button type="button" onClick={() => setDeleting(null)}>
              Отмена
            </button>
            <button type="button" onClick={confirmDelete}>
              Удалить
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default PlayersPanel
