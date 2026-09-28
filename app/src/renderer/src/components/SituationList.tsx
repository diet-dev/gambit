import { CircleHelp, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { type Situation, type SituationGroup } from '../../../shared/situations'

type SituationListProps = {
  groups: SituationGroup[]
  selectedId: number | null
  onSelect: (id: number) => void
  onShowComment: (id: number) => void
  onReset: (id: number) => void
  onEdit: (situation: Situation) => void
  onDelete: (situation: Situation) => void
}

function SituationList({
  groups,
  selectedId,
  onSelect,
  onShowComment,
  onReset,
  onEdit,
  onDelete
}: SituationListProps): React.JSX.Element {
  return (
    <nav className="situation-list">
      {groups.map((group) => (
        <section key={group.id} className="situation-group">
          <h2 className="situation-group-title">{group.name}</h2>
          <ul>
            {group.situations.map((situation, index) => {
              const active = situation.id === selectedId

              return (
                <li key={situation.id} className="situation-item-wrapper">
                  <span className="situation-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    className={active ? 'situation-item situation-item-active' : 'situation-item'}
                    aria-current={active}
                    onClick={() => onSelect(situation.id)}
                  >
                    <span className="situation-title">{situation.title}</span>
                    <span className="situation-description">{situation.description}</span>
                  </button>
                  {active && (
                    <div className="situation-actions">
                      <button
                        type="button"
                        className="situation-reset"
                        aria-label={`Сбросить: ${situation.title}`}
                        onClick={() => onReset(situation.id)}
                      >
                        <RotateCcw size={20} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="situation-help"
                        aria-label={`Подробнее: ${situation.title}`}
                        onClick={() => onShowComment(situation.id)}
                      >
                        <CircleHelp size={20} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="situation-edit"
                        aria-label={`Редактировать: ${situation.title}`}
                        onClick={() => onEdit(situation)}
                      >
                        <Pencil size={20} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="situation-delete"
                        aria-label={`Удалить: ${situation.title}`}
                        onClick={() => onDelete(situation)}
                      >
                        <Trash2 size={20} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}

export default SituationList
