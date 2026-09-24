import { useState } from 'react'
import type { ClassInput, SchoolClass } from '../../../shared/classes'
import Dialog from './Dialog'

type ClassFormDialogProps = {
  schoolClass: SchoolClass | null
  classes: SchoolClass[]
  onSubmit: (input: ClassInput) => void
  onClose: () => void
}

function ClassFormDialog({
  schoolClass,
  classes,
  onSubmit,
  onClose
}: ClassFormDialogProps): React.JSX.Element {
  const [name, setName] = useState(schoolClass?.name ?? '')
  const [comment, setComment] = useState(schoolClass?.comment ?? '')
  const [nameError, setNameError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') {
      setNameError('Введите название')
      return
    }
    const duplicate = classes.some(
      (item) =>
        item.id !== schoolClass?.id && item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
    )
    if (duplicate) {
      setNameError('Класс с таким именем уже есть')
      return
    }
    onSubmit({ name: trimmed, comment })
  }

  return (
    <Dialog titleId="class-form-title" className="entity-form-dialog" onClose={onClose}>
      <h2 id="class-form-title" className="comment-dialog-title">
        {schoolClass ? 'Класс' : 'Новый класс'}
      </h2>
      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="entity-field">
          <span>
            Название{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value.replace(/[^А-Яа-яЁё0-9]/g, '').toUpperCase())
              setNameError(null)
            }}
            required
          />
          {nameError && <span className="entity-error">{nameError}</span>}
        </label>
        <label className="entity-field">
          <span>Комментарий</span>
          <input value={comment} onChange={(event) => setComment(event.target.value)} />
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

export default ClassFormDialog
