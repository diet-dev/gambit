import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { ClassInput, SchoolClass } from '../../../shared/classes'
import { useClasses } from '../hooks/useClasses'
import ClassFormDialog from './ClassFormDialog'
import Dialog from './Dialog'

function ClassesPanel(): React.JSX.Element {
  const { classes, create, update, remove } = useClasses()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SchoolClass | null>(null)
  const [deleting, setDeleting] = useState<SchoolClass | null>(null)

  function openCreate(): void {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(schoolClass: SchoolClass): void {
    setEditing(schoolClass)
    setFormOpen(true)
  }

  async function submit(input: ClassInput): Promise<void> {
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
    <div className="entity-panel classes-panel">
      <div className="entity-header">
        <button type="button" className="entity-add" onClick={openCreate}>
          Добавить класс
        </button>
      </div>
      {classes.length === 0 ? (
        <p className="entity-empty">Классов пока нет</p>
      ) : (
        <ul className="entity-list">
          {classes.map((schoolClass) => (
            <li key={schoolClass.id} className="entity-item">
              <span className="entity-name">{schoolClass.name}</span>
              <span className="entity-sub">{schoolClass.comment}</span>
              <button
                type="button"
                className="entity-action"
                aria-label={`Изменить: ${schoolClass.name}`}
                onClick={() => openEdit(schoolClass)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="entity-action"
                aria-label={`Удалить: ${schoolClass.name}`}
                onClick={() => setDeleting(schoolClass)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {formOpen && (
        <ClassFormDialog
          schoolClass={editing}
          onSubmit={submit}
          onClose={() => setFormOpen(false)}
        />
      )}
      {deleting && (
        <Dialog
          titleId="class-delete-title"
          className="entity-delete-dialog"
          onClose={() => setDeleting(null)}
        >
          <h2 id="class-delete-title" className="comment-dialog-title">
            Удалить класс?
          </h2>
          <p className="comment-dialog-text">{deleting.name}</p>
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

export default ClassesPanel
