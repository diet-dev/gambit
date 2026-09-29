import { useEffect, useState } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import ActivityBar from './components/ActivityBar'
import { ACTIVITY_TITLES, type Activity } from './components/activities'
import ChessGame from './components/ChessGame'
import GroupsPanel from './components/GroupsPanel'
import DevicesPanel from './components/DevicesPanel'
import EventLogPanel from './components/EventLogPanel'
import HelpArticleOverlay from './components/HelpArticleOverlay'
import HelpPanel from './components/HelpPanel'
import RemoteQrButton from './components/RemoteQrButton'
import RoundsPanel from './components/RoundsPanel'
import RoundResultsOverlay from './components/RoundResultsOverlay'
import SettingsPanel from './components/SettingsPanel'
import SituationCommentDialog from './components/SituationCommentDialog'
import SituationList from './components/SituationList'
import SituationSaveOverlay from './components/SituationSaveOverlay'
import Dialog from './components/Dialog'
import PlayersPanel from './components/PlayersPanel'
import RoundFormOverlay from './components/RoundFormOverlay'
import TournamentChartOverlay from './components/TournamentChartOverlay'
import TournamentsPanel from './components/TournamentsPanel'
import { useEventLog } from './hooks/useEventLog'
import { useSituations } from './hooks/useSituations'
import { findHelpArticle } from './help/articles'
import { findSituation, firstSituation, type Situation } from '../../shared/situations'
import type { Round, Tournament } from '../../shared/tournament'

function App(): React.JSX.Element {
  const { groups, reload } = useSituations()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [commentId, setCommentId] = useState<number | null>(null)
  const [savingFen, setSavingFen] = useState<string | null>(null)
  const [editingSituation, setEditingSituation] = useState<Situation | null>(null)
  const [deletingSituation, setDeletingSituation] = useState<Situation | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [instance, setInstance] = useState(0)
  const [activity, setActivity] = useState<Activity>('situations')
  const [helpArticleId, setHelpArticleId] = useState<string | null>(null)
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null)
  const [roundFormOpen, setRoundFormOpen] = useState(false)
  const [roundFormSavedAt, setRoundFormSavedAt] = useState(0)
  const [viewingRound, setViewingRound] = useState<Round | null>(null)
  const [chartTournament, setChartTournament] = useState<Tournament | null>(null)
  const { events, logMove } = useEventLog()
  const selected = findSituation(groups, selectedId) ?? firstSituation(groups)
  const commentSituation = commentId === null ? undefined : findSituation(groups, commentId)
  const helpArticle = findHelpArticle(helpArticleId)

  useEffect(() => {
    const suffix = activity === 'situations' ? selected?.title : ACTIVITY_TITLES[activity]
    document.title = suffix ? `Гамбит — ${suffix}` : 'Гамбит'
  }, [selected, activity])

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

  function selectSituation(id: number): void {
    setSelectedId(id)
    setCommentId(null)
  }

  function resetSituation(): void {
    setInstance((value) => value + 1)
  }

  async function confirmSituationDelete(): Promise<void> {
    if (deletingSituation === null) {
      return
    }
    try {
      await window.api?.situations?.remove(deletingSituation.id)
      if (selectedId === deletingSituation.id) {
        setSelectedId(null)
      }
      setDeletingSituation(null)
      reload()
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : 'Не удалось удалить ситуацию')
    }
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
                groups={groups}
                selectedId={selected?.id ?? null}
                onSelect={selectSituation}
                onShowComment={setCommentId}
                onReset={resetSituation}
                onEdit={setEditingSituation}
                onDelete={setDeletingSituation}
              />
            )}
            {activity === 'devices' && <DevicesPanel />}
            {activity === 'groups' && <GroupsPanel />}
            {activity === 'tournaments' && (
              <TournamentsPanel
                onOpenChart={(tournament) =>
                  setChartTournament((previous) =>
                    previous?.id === tournament.id ? null : tournament
                  )
                }
              />
            )}
            {activity === 'rounds' && (
              <RoundsPanel
                selectedTournamentId={selectedTournamentId}
                onSelectTournament={setSelectedTournamentId}
                onCreateRound={() => {
                  setViewingRound(null)
                  setRoundFormOpen(true)
                }}
                onOpenRound={(round) => {
                  setRoundFormOpen(false)
                  setViewingRound(round)
                }}
                savedAt={roundFormSavedAt}
              />
            )}
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
            {selected && (
              <ChessGame
                key={`${selected.id}:${instance}`}
                initialPosition={selected.fen}
                onMove={logMove}
                onSaveSituation={setSavingFen}
              />
            )}
            <RemoteQrButton />
            {activity === 'help' && helpArticle && (
              <HelpArticleOverlay article={helpArticle} onClose={() => setHelpArticleId(null)} />
            )}
            {activity === 'rounds' && roundFormOpen && (
              <RoundFormOverlay
                key={`${selectedTournamentId}:${roundFormSavedAt}`}
                tournamentId={selectedTournamentId}
                onClose={() => setRoundFormOpen(false)}
                onSaved={() => {
                  setRoundFormOpen(false)
                  setRoundFormSavedAt((value) => value + 1)
                }}
              />
            )}
            {activity === 'rounds' && viewingRound !== null && (
              <RoundResultsOverlay
                key={viewingRound.id}
                round={viewingRound}
                onClose={() => setViewingRound(null)}
              />
            )}
            {activity === 'tournaments' && chartTournament !== null && (
              <TournamentChartOverlay
                key={chartTournament.id}
                tournament={chartTournament}
                onClose={() => setChartTournament(null)}
              />
            )}
            {savingFen !== null && (
              <SituationSaveOverlay
                fen={savingFen}
                onClose={() => setSavingFen(null)}
                onSaved={() => {
                  setSavingFen(null)
                  reload()
                }}
              />
            )}
            {editingSituation !== null && (
              <SituationSaveOverlay
                key={editingSituation.id}
                fen={editingSituation.fen}
                situation={editingSituation}
                onClose={() => setEditingSituation(null)}
                onSaved={() => {
                  setEditingSituation(null)
                  reload()
                }}
              />
            )}
          </div>
        </Panel>
      </Group>
      {commentSituation && (
        <SituationCommentDialog situation={commentSituation} onClose={() => setCommentId(null)} />
      )}
      {deletingSituation && (
        <Dialog
          titleId="situation-delete-dialog"
          className="entity-delete-dialog"
          onClose={() => setDeletingSituation(null)}
        >
          <h2 id="situation-delete-dialog" className="comment-dialog-title">
            Удалить пример?
          </h2>
          <p className="comment-dialog-text">{deletingSituation.title}</p>
          {deleteError && <p className="entity-error">{deleteError}</p>}
          <div className="entity-actions">
            <button type="button" onClick={() => setDeletingSituation(null)}>
              Отмена
            </button>
            <button type="button" onClick={() => void confirmSituationDelete()}>
              Удалить
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}

export default App
