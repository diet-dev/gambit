import { useEffect, useState } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import ActivityBar, { type Activity } from './components/ActivityBar'
import ChessGame from './components/ChessGame'
import GroupsPanel from './components/GroupsPanel'
import DevicesPanel from './components/DevicesPanel'
import EventLogPanel from './components/EventLogPanel'
import HelpArticleOverlay from './components/HelpArticleOverlay'
import HelpPanel from './components/HelpPanel'
import RemoteQrButton from './components/RemoteQrButton'
import RoundsPanel from './components/RoundsPanel'
import SettingsPanel from './components/SettingsPanel'
import SituationCommentDialog from './components/SituationCommentDialog'
import SituationList from './components/SituationList'
import PlayersPanel from './components/PlayersPanel'
import TournamentsPanel from './components/TournamentsPanel'
import { useEventLog } from './hooks/useEventLog'
import { findHelpArticle } from './help/articles'
import { DEFAULT_SITUATION_ID, SITUATION_GROUPS, findSituation } from './situations'

function App(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState(DEFAULT_SITUATION_ID)
  const [commentId, setCommentId] = useState<string | null>(null)
  const [instance, setInstance] = useState(0)
  const [activity, setActivity] = useState<Activity>('situations')
  const [helpArticleId, setHelpArticleId] = useState<string | null>(null)
  const { events, logMove } = useEventLog()
  const selected = findSituation(selectedId) ?? findSituation(DEFAULT_SITUATION_ID)!
  const commentSituation = commentId ? findSituation(commentId) : undefined
  const helpArticle = findHelpArticle(helpArticleId)

  useEffect(() => {
    document.title = `Гамбит — ${selected.title}`
  }, [selected.title])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'gambit-layout',
    onlySaveAfterUserInteractions: true
  })

  function selectActivity(next: Activity): void {
    setActivity(next)
    if (next !== 'help') {
      setHelpArticleId(null)
    }
  }

  function selectSituation(id: string): void {
    setSelectedId(id)
    setCommentId(null)
  }

  function resetSituation(): void {
    setInstance((value) => value + 1)
  }

  return (
    <>
      <ActivityBar active={activity} onSelect={selectActivity} />
      <Group
        className="panels"
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        <Panel id="left" className="panel" defaultSize="30%" minSize={300} maxSize="50%">
          <div className="left-panel">
            {activity === 'situations' && (
              <SituationList
                groups={SITUATION_GROUPS}
                selectedId={selectedId}
                onSelect={selectSituation}
                onShowComment={setCommentId}
                onReset={resetSituation}
              />
            )}
            {activity === 'devices' && <DevicesPanel />}
            {activity === 'groups' && <GroupsPanel />}
            {activity === 'tournaments' && <TournamentsPanel />}
            {activity === 'rounds' && <RoundsPanel />}
            {activity === 'players' && <PlayersPanel />}
            {activity === 'events' && <EventLogPanel events={events} />}
            {activity === 'settings' && <SettingsPanel />}
            {activity === 'help' && (
              <HelpPanel openArticleId={helpArticleId} onOpen={setHelpArticleId} />
            )}
          </div>
        </Panel>
        <Separator className="separator" />
        <Panel id="right" className="panel" minSize="30%">
          <div className="right-panel">
            <ChessGame
              key={`${selected.id}:${instance}`}
              initialPosition={selected.fen}
              onMove={logMove}
            />
            <RemoteQrButton />
            {activity === 'help' && helpArticle && (
              <HelpArticleOverlay article={helpArticle} onClose={() => setHelpArticleId(null)} />
            )}
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
