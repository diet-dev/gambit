import { useState } from 'react'
import type { SchoolClass } from '../../../shared/classes'
import type { Student, StudentInput } from '../../../shared/students'
import Dialog from './Dialog'

type StudentFormDialogProps = {
  student: Student | null
  classes: SchoolClass[]
  onSubmit: (input: StudentInput) => void
  onClose: () => void
}

function StudentFormDialog({
  student,
  classes,
  onSubmit,
  onClose
}: StudentFormDialogProps): React.JSX.Element {
  const [lastName, setLastName] = useState(student?.lastName ?? '')
  const [firstName, setFirstName] = useState(student?.firstName ?? '')
  const [middleName, setMiddleName] = useState(student?.middleName ?? '')
  const [classId, setClassId] = useState<number | null>(student?.classId ?? null)
  const [rating, setRating] = useState(String(student?.rating ?? 0))
  const [classError, setClassError] = useState(false)

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (classId === null) {
      setClassError(true)
      return
    }
    onSubmit({
      lastName,
      firstName,
      middleName,
      classId,
      rating: Number(rating) || 0
    })
  }

  return (
    <Dialog titleId="student-form-title" className="entity-form-dialog" onClose={onClose}>
      <h2 id="student-form-title" className="comment-dialog-title">
        {student ? 'Ученик' : 'Новый ученик'}
      </h2>
      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="entity-field">
          <span>
            Фамилия{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
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
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>
        <label className="entity-field">
          <span>Отчество</span>
          <input value={middleName} onChange={(event) => setMiddleName(event.target.value)} />
        </label>
        <label className="entity-field">
          <span>
            Класс{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <select
            value={classId ?? ''}
            onChange={(event) => {
              setClassId(event.target.value === '' ? null : Number(event.target.value))
              setClassError(false)
            }}
            required
          >
            <option value="" disabled>
              Выберите класс
            </option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
          {classes.length === 0 && (
            <span className="entity-error">Сначала добавьте класс на вкладке «Классы»</span>
          )}
          {classError && <span className="entity-error">Выберите класс</span>}
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

export default StudentFormDialog
