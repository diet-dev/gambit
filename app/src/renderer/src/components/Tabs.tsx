type TabsProps<T extends string> = {
  items: { id: T; title: string }[]
  activeId: T
  onSelect: (id: T) => void
}

function Tabs<T extends string>({ items, activeId, onSelect }: TabsProps<T>): React.JSX.Element {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === activeId}
          className={item.id === activeId ? 'tabs-tab tabs-tab-active' : 'tabs-tab'}
          onClick={() => onSelect(item.id)}
        >
          {item.title}
        </button>
      ))}
    </div>
  )
}

export default Tabs
