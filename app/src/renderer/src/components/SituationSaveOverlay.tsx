import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { SituationCreateInput } from '../../../shared/situations'
import { finalizeHeadingText, normalizeHeadingInput } from '../../../shared/situations'
import { useSituations } from '../hooks/useSituations'

const NEW_GROUP = 'new'

type SituationSaveOverlayProps = {
  fen: string
  onClose: () => void
  onSaved: () => void
}

function SituationSaveOverlay({
  fen,
  onClose,
  onSaved
}: SituationSaveOverlayProps): React.JSX.Element {
  const { groups } = useSituations()
  const [groupId, setGroupId] = useState<number | typeof NEW_GROUP | null>(null)
  const [groupName, setGroupName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const newGroupSelected = groupId === NEW_GROUP
  const canSave =
    !saving &&
    title.trim() !== '' &&
    (newGroupSelected ? groupName.trim() !== '' : groupId !== null)

  async function save(): Promise<void> {
    const input: SituationCreateInput = {
      title: finalizeHeadingText(title),
      description: finalizeHeadingText(description),
      comment: finalizeHeadingText(comment),
      fen
    }
    if (newGroupSelected) {
      input.groupName = finalizeHeadingText(groupName)
    } else if (groupId !== null) {
      input.groupId = groupId
    }
    setSaving(true)
    setError(null)
    try {
      await window.api?.situations?.create(input)
      onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось сохранить ситуацию')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="round-form-overlay">
      <button type="button" className="help-overlay-close" aria-label="Закрыть" onClick={onClose}>
        <X size={32} aria-hidden="true" />
      </button>
      <h2 className="help-overlay-title">Сохранить ситуацию</h2>
      <form
        className="entity-form situation-save-form"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <label className="entity-field">
          <span className="entity-field-label">
            Группа{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <span className="entity-field-control">
            <select
              value={groupId === null ? '' : String(groupId)}
              onChange={(event) => {
                const value = event.target.value
                setGroupId(value === '' || value === NEW_GROUP ? NEW_GROUP : Number(value))
              }}
              required
            >
              <option value="" disabled>
                Выберите группу
              </option>
              <option value={NEW_GROUP}>Новая группа</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </span>
        </label>
        {newGroupSelected && (
          <label className="entity-field">
            <span className="entity-field-label">
              Название группы{' '}
              <span className="entity-required" aria-hidden="true">
                *
              </span>
            </span>
            <span className="entity-field-control">
              <input
                value={groupName}
                onChange={(event) => setGroupName(normalizeHeadingInput(event.target.value))}
                placeholder="Например: Мои позиции"
                required
              />
            </span>
          </label>
        )}
        <label className="entity-field">
          <span className="entity-field-label">
            Название ситуации{' '}
            <span className="entity-required" aria-hidden="true">
              *
            </span>
          </span>
          <span className="entity-field-control">
            <input
              value={title}
              onChange={(event) => setTitle(normalizeHeadingInput(event.target.value))}
              placeholder="Например: Мат на диагонали"
              required
            />
          </span>
        </label>
        <label className="entity-field">
          <span className="entity-field-label">Описание</span>
          <span className="entity-field-control">
            <input
              value={description}
              onChange={(event) => setDescription(normalizeHeadingInput(event.target.value))}
              placeholder="Короткая подпись в списке"
            />
          </span>
        </label>
        <label className="entity-field">
          <span className="entity-field-label">Комментарий</span>
          <span className="entity-field-control">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Разжёванный разбор позиции для кнопки «Подробнее»"
              rows={5}
            />
          </span>
        </label>
        <p className="entity-sub">Позиция: {fen}</p>
        {error !== null && <p className="entity-error">{error}</p>}
        <div className="entity-actions">
          <button type="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" disabled={!canSave}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SituationSaveOverlay
