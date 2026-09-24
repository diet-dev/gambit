import { useState } from 'react'
import type { Student, StudentInput } from '../../../shared/students'
import Dialog from './Dialog'

type StudentFormDialogProps = {
  student: Student | null
  onSubmit: (input: StudentInput) => void
  onClose: () => void
}

function StudentFormDialog({
  student,
  onSubmit,
  onClose
}: StudentFormDialogProps): React.JSX.Element {
  const [lastName, setLastName] = useState(student?.lastName ?? '')
  const [firstName, setFirstName] = useState(student?.firstName ?? '')
  const [middleName, setMiddleName] = useState(student?.middleName ?? '')
  const [className, setClassName] = useState(student?.className ?? '')
  const [rating, setRating] = useState(String(student?.rating ?? 0))
  const [classNameError, setClassNameError] = useState(false)

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    const trimmedClassName = className.trim()
    if (trimmedClassName === '' || /\s/.test(trimmedClassName)) {
      setClassNameError(true)
      return
    }
    onSubmit({
      lastName,
      firstName,
      middleName,
      className: trimmedClassName,
      rating: Number(rating) || 0
    })
  }

  return (
    <Dialog titleId="student-form-title" className="student-form-dialog" onClose={onClose}>
      <h2 id="student-form-title" className="comment-dialog-title">
        {student ? 'Ученик' : 'Новый ученик'}
      </h2>
      <form className="student-form" onSubmit={handleSubmit}>
        <label className="student-field">
          <span>
            Фамилия{' '}
            <span className="student-required" aria-hidden="true">
              *
            </span>
          </span>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
        </label>
        <label className="student-field">
          <span>
            Имя{' '}
            <span className="student-required" aria-hidden="true">
              *
            </span>
          </span>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>
        <label className="student-field">
          <span>Отчество</span>
          <input value={middleName} onChange={(event) => setMiddleName(event.target.value)} />
        </label>
        <label className="student-field">
          <span>
            Класс{' '}
            <span className="student-required" aria-hidden="true">
              *
            </span>
          </span>
          <input
            value={className}
            onChange={(event) => {
              setClassName(event.target.value)
              setClassNameError(false)
            }}
            required
          />
          {classNameError && (
            <span className="student-field-error">
              Класс обязателен, без пробелов; по краям обрезается
            </span>
          )}
        </label>
        <label className="student-field">
          <span>Рейтинг</span>
          <input type="number" value={rating} onChange={(event) => setRating(event.target.value)} />
        </label>
        <div className="student-form-actions">
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
