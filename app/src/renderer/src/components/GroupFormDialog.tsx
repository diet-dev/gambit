import { useState } from 'react'
import type { Group, GroupInput } from '../../../shared/groups'
import { finalizeGroupName, normalizeGroupNameInput } from '../../../shared/groupName'
import Dialog from './Dialog'

type GroupFormDialogProps = {
  group: Group | null
  groups: Group[]
  onSubmit: (input: GroupInput) => void
  onClose: () => void
}

function GroupFormDialog({
  group,
  groups,
  onSubmit,
  onClose
}: GroupFormDialogProps): React.JSX.Element {
  const [name, setName] = useState(group?.name ?? '')
  const [comment, setComment] = useState(group?.comment ?? '')
  const [nameError, setNameError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    const finalName = finalizeGroupName(name)
    if (finalName === '') {
      setNameError('Введите название')
      return
    }
    if (finalName !== name) {
      setName(finalName)
    }
    const duplicate = groups.some((item) => item.id !== group?.id && item.name === finalName)
    if (duplicate) {
      setNameError('Группа с таким именем уже есть')
      return
    }
    onSubmit({ name: finalName, comment })
  }

  return (
    <Dialog titleId="group-form-title" className="entity-form-dialog" onClose={onClose}>
      <h2 id="group-form-title" className="comment-dialog-title">
        {group ? 'Группа' : 'Новая группа'}
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
              setName(normalizeGroupNameInput(event.target.value))
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

export default GroupFormDialog
