import { useState } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import ChessGame from './components/ChessGame'
import SituationList from './components/SituationList'
import { DEFAULT_SITUATION_ID, SITUATION_GROUPS, findSituation } from './situations'

function App(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState(DEFAULT_SITUATION_ID)
  const selected = findSituation(selectedId) ?? findSituation(DEFAULT_SITUATION_ID)!

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'gambit-layout',
    onlySaveAfterUserInteractions: true
  })

  return (
    <Group
      className="panels"
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
    >
      <Panel id="left" className="panel" defaultSize="30%" minSize="10%" maxSize="50%">
        <div className="left-panel">
          <SituationList
            groups={SITUATION_GROUPS}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </Panel>
      <Separator className="separator" />
      <Panel id="right" className="panel" minSize="30%">
        <div className="right-panel">
          <ChessGame key={selected.id} initialPosition={selected.fen} />
        </div>
      </Panel>
    </Group>
  )
}

export default App
