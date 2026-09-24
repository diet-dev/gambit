import { useState } from 'react'
import type { ClassInput, SchoolClass } from '../../../shared/classes'
import Dialog from './Dialog'

type ClassFormDialogProps = {
  schoolClass: SchoolClass | null
  onSubmit: (input: ClassInput) => void
  onClose: () => void
}

function ClassFormDialog({
  schoolClass,
  onSubmit,
  onClose
}: ClassFormDialogProps): React.JSX.Element {
  const [name, setName] = useState(schoolClass?.name ?? '')
  const [comment, setComment] = useState(schoolClass?.comment ?? '')

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    onSubmit({ name: name.trim(), comment })
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
          <input value={name} onChange={(event) => setName(event.target.value)} required />
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
