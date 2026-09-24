import { useEffect, useState } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import ActivityBar, { type Activity } from './components/ActivityBar'
import ChessGame from './components/ChessGame'
import DevicesPanel from './components/DevicesPanel'
import RemoteQrButton from './components/RemoteQrButton'
import SituationCommentDialog from './components/SituationCommentDialog'
import SituationList from './components/SituationList'
import { DEFAULT_SITUATION_ID, SITUATION_GROUPS, findSituation } from './situations'

function App(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState(DEFAULT_SITUATION_ID)
  const [commentId, setCommentId] = useState<string | null>(null)
  const [instance, setInstance] = useState(0)
  const [activity, setActivity] = useState<Activity>('situations')
  const selected = findSituation(selectedId) ?? findSituation(DEFAULT_SITUATION_ID)!
  const commentSituation = commentId ? findSituation(commentId) : undefined

  useEffect(() => {
    document.title = `Гамбит — ${selected.title}`
  }, [selected.title])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'gambit-layout',
    onlySaveAfterUserInteractions: true
  })

  function selectSituation(id: string): void {
    setSelectedId(id)
    setCommentId(null)
  }

  function resetSituation(): void {
    setInstance((value) => value + 1)
  }

  return (
    <>
      <ActivityBar active={activity} onSelect={setActivity} />
      <Group
        className="panels"
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        <Panel id="left" className="panel" defaultSize="30%" minSize={300} maxSize="50%">
          <div className="left-panel">
            {activity === 'situations' ? (
              <SituationList
                groups={SITUATION_GROUPS}
                selectedId={selectedId}
                onSelect={selectSituation}
                onShowComment={setCommentId}
                onReset={resetSituation}
              />
            ) : (
              <DevicesPanel />
            )}
          </div>
        </Panel>
        <Separator className="separator" />
        <Panel id="right" className="panel" minSize="30%">
          <div className="right-panel">
            <ChessGame key={`${selected.id}:${instance}`} initialPosition={selected.fen} />
            <RemoteQrButton />
          </div>
        </Panel>
      </Group>
      {commentSituation && (
        <SituationCommentDialog situation={commentSituation} onClose={() => setCommentId(null)} />
      )}
    </>
  )
}

export default App
