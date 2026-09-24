import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Student, StudentInput } from '../../../shared/students'
import { useClasses } from '../hooks/useClasses'
import { useStudents } from '../hooks/useStudents'
import Dialog from './Dialog'
import StudentFormDialog from './StudentFormDialog'

function studentName(student: Student): string {
  return [student.lastName, student.firstName, student.middleName].filter(Boolean).join(' ')
}

function StudentsPanel(): React.JSX.Element {
  const { students, create, update, remove } = useStudents()
  const { classes } = useClasses()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState<Student | null>(null)

  const classNames = new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass.name]))

  function openCreate(): void {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(student: Student): void {
    setEditing(student)
    setFormOpen(true)
  }

  async function submit(input: StudentInput): Promise<void> {
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
    <div className="entity-panel students-panel">
      <div className="entity-header">
        <button type="button" className="entity-add" onClick={openCreate}>
          Добавить ученика
        </button>
      </div>
      {students.length === 0 ? (
        <p className="entity-empty">Учеников пока нет</p>
      ) : (
        <ul className="entity-list">
          {students.map((student) => (
            <li key={student.id} className="entity-item">
              <span className="entity-name">{studentName(student)}</span>
              <span className="entity-sub">
                {student.classId !== null ? (classNames.get(student.classId) ?? '—') : '—'}
              </span>
              <span className="entity-value">{student.rating}</span>
              <button
                type="button"
                className="entity-action"
                aria-label={`Изменить: ${student.lastName}`}
                onClick={() => openEdit(student)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="entity-action"
                aria-label={`Удалить: ${student.lastName}`}
                onClick={() => setDeleting(student)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {formOpen && (
        <StudentFormDialog
          student={editing}
          classes={classes}
          onSubmit={submit}
          onClose={() => setFormOpen(false)}
        />
      )}
      {deleting && (
        <Dialog
          titleId="student-delete-title"
          className="entity-delete-dialog"
          onClose={() => setDeleting(null)}
        >
          <h2 id="student-delete-title" className="comment-dialog-title">
            Удалить ученика?
          </h2>
          <p className="comment-dialog-text">{studentName(deleting)}</p>
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

export default StudentsPanel
