import { type SituationGroup } from '../situations'

type SituationListProps = {
  groups: SituationGroup[]
  selectedId: string
  onSelect: (id: string) => void
}

function SituationList({ groups, selectedId, onSelect }: SituationListProps): React.JSX.Element {
  return (
    <nav className="situation-list">
      {groups.map((group) => (
        <section key={group.title} className="situation-group">
          <h2 className="situation-group-title">{group.title}</h2>
          <ul>
            {group.situations.map((situation) => {
              const active = situation.id === selectedId

              return (
                <li key={situation.id}>
                  <button
                    type="button"
                    className={active ? 'situation-item situation-item-active' : 'situation-item'}
                    aria-current={active}
                    onClick={() => onSelect(situation.id)}
                  >
                    <span className="situation-title">{situation.title}</span>
                    <span className="situation-description">{situation.description}</span>
                  </button>
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
