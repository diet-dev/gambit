import { useState } from 'react'
import Tabs from './Tabs'

type TournamentsTab = 'tournaments' | 'settings'

const TABS: { id: TournamentsTab; title: string }[] = [
  { id: 'tournaments', title: 'Турниры' },
  { id: 'settings', title: 'Настройки' }
]

function TournamentsPanel(): React.JSX.Element {
  const [tab, setTab] = useState<TournamentsTab>('tournaments')

  return (
    <div className="entity-panel tournaments-panel">
      <Tabs items={TABS} activeId={tab} onSelect={setTab} />
      {tab === 'tournaments' && (
        <div className="entity-list tournaments-list" role="tabpanel" aria-label="Турниры" />
      )}
      {tab === 'settings' && (
        <div className="entity-list tournaments-settings" role="tabpanel" aria-label="Настройки" />
      )}
    </div>
  )
}

export default TournamentsPanel
