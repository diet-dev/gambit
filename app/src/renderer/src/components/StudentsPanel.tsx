import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Student, StudentInput } from '../../../shared/students'
import { useStudents } from '../hooks/useStudents'
import Dialog from './Dialog'
import StudentFormDialog from './StudentFormDialog'

function studentName(student: Student): string {
  return [student.lastName, student.firstName, student.middleName].filter(Boolean).join(' ')
}

function StudentsPanel(): React.JSX.Element {
  const { students, create, update, remove } = useStudents()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState<Student | null>(null)

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
    <div className="students-panel">
      <div className="students-header">
        <button type="button" className="students-add" onClick={openCreate}>
          Добавить ученика
        </button>
      </div>
      {students.length === 0 ? (
        <p className="students-empty">Учеников пока нет</p>
      ) : (
        <ul className="students-list">
          {students.map((student) => (
            <li key={student.id} className="student-item">
              <span className="student-name">{studentName(student)}</span>
              <span className="student-class">{student.className}</span>
              <span className="student-rating">{student.rating}</span>
              <button
                type="button"
                className="student-action"
                aria-label={`Изменить: ${student.lastName}`}
                onClick={() => openEdit(student)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="student-action"
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
        <StudentFormDialog student={editing} onSubmit={submit} onClose={() => setFormOpen(false)} />
      )}
      {deleting && (
        <Dialog
          titleId="student-delete-title"
          className="student-delete-dialog"
          onClose={() => setDeleting(null)}
        >
          <h2 id="student-delete-title" className="comment-dialog-title">
            Удалить ученика?
          </h2>
          <p className="comment-dialog-text">{studentName(deleting)}</p>
          <div className="student-form-actions">
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
