import { CircleHelp } from 'lucide-react'
import { type SituationGroup } from '../situations'

type SituationListProps = {
  groups: SituationGroup[]
  selectedId: string
  onSelect: (id: string) => void
  onShowComment: (id: string) => void
}

function SituationList({
  groups,
  selectedId,
  onSelect,
  onShowComment
}: SituationListProps): React.JSX.Element {
  return (
    <nav className="situation-list">
      {groups.map((group) => (
        <section key={group.title} className="situation-group">
          <h2 className="situation-group-title">{group.title}</h2>
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
                    <button
                      type="button"
                      className="situation-help"
                      aria-label={`Подробнее: ${situation.title}`}
                      onClick={() => onShowComment(situation.id)}
                    >
                      <CircleHelp size={20} aria-hidden="true" />
                    </button>
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
