import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Group, GroupInput } from '../../../shared/groups'
import { useGroups } from '../hooks/useGroups'
import GroupFormDialog from './GroupFormDialog'
import Dialog from './Dialog'

function GroupsPanel(): React.JSX.Element {
  const { groups, create, update, remove } = useGroups()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState<Group | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function openCreate(): void {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(group: Group): void {
    setEditing(group)
    setFormOpen(true)
  }

  async function submit(input: GroupInput): Promise<void> {
    if (editing) {
      await update({ ...input, id: editing.id })
    } else {
      await create(input)
    }
    setFormOpen(false)
  }

  async function confirmDelete(): Promise<void> {
    if (deleting) {
      try {
        await remove(deleting.id)
        setDeleting(null)
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : 'Не удалось удалить группу')
      }
    }
  }

  return (
    <div className="entity-panel groups-panel">
      <div className="entity-header">
        <button type="button" className="entity-add" onClick={openCreate}>
          Добавить группу
        </button>
      </div>
      {groups.length === 0 ? (
        <p className="entity-empty">Групп пока нет</p>
      ) : (
        <ul className="entity-list">
          {groups.map((group) => (
            <li key={group.id} className="entity-item">
              <span className="entity-name">{group.name}</span>
              <span className="entity-sub">{group.comment}</span>
              <button
                type="button"
                className="entity-action"
                aria-label={`Изменить: ${group.name}`}
                onClick={() => openEdit(group)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="entity-action"
                aria-label={`Удалить: ${group.name}`}
                onClick={() => {
                  setDeleteError(null)
                  setDeleting(group)
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {formOpen && (
        <GroupFormDialog
          group={editing}
          groups={groups}
          onSubmit={submit}
          onClose={() => setFormOpen(false)}
        />
      )}
      {deleting && (
        <Dialog
          titleId="group-delete-title"
          className="entity-delete-dialog"
          onClose={() => setDeleting(null)}
        >
          <h2 id="group-delete-title" className="comment-dialog-title">
            Удалить группу?
          </h2>
          <p className="comment-dialog-text">{deleting.name}</p>
          {deleteError && <p className="entity-error">{deleteError}</p>}
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

export default GroupsPanel
