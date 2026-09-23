import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import ChessGame from './components/ChessGame'

function App(): React.JSX.Element {
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
        <div className="left-panel" />
      </Panel>
      <Separator className="separator" />
      <Panel id="right" className="panel" minSize="30%">
        <div className="right-panel">
          <ChessGame />
        </div>
      </Panel>
    </Group>
  )
}

export default App
