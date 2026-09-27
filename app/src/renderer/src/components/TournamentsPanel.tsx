import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type {
  AbsenceScoring,
  DrawScoring,
  Tournament,
  TournamentInput,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'
import { useGroups } from '../hooks/useGroups'
import { usePlayers } from '../hooks/usePlayers'
import { useTournamentSettings } from '../hooks/useTournamentSettings'
import { useTournaments } from '../hooks/useTournaments'
import Tabs from './Tabs'
import TournamentDialog from './TournamentDialog'
import TournamentSettingsDialog from './TournamentSettingsDialog'
import Dialog from './Dialog'

type TournamentsTab = 'tournaments' | 'settings'

const TABS: { id: TournamentsTab; title: string }[] = [
  { id: 'tournaments', title: 'Турниры' },
  { id: 'settings', title: 'Настройки' }
]

const DRAW_LABELS: Record<DrawScoring, string> = {
  weaker: 'в пользу слабого',
  stronger: 'в пользу сильного',
  none: 'без обмена'
}

const ABSENCE_LABELS: Record<AbsenceScoring, string> = {
  loss: 'поражение неявившемуся',
  no_effect: 'без последствий'
}

function settingsSummary(settings: TournamentSettingsWithUsage): string {
  return [
    settings.weakerPlaysWhite ? 'слабый — белыми' : 'сильный — белыми',
    `ничья: ${DRAW_LABELS[settings.drawScoring]}`,
    `неявка: ${ABSENCE_LABELS[settings.absenceScoring]}`
  ].join(' · ')
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

function TournamentsPanel(): React.JSX.Element {
  const [tab, setTab] = useState<TournamentsTab>('tournaments')
  const {
    settings,
    create: createSettings,
    update: updateSettings,
    remove: removeSettings
  } = useTournamentSettings()
  const {
    tournaments,
    create: createTournament,
    update: updateTournament,
    remove: removeTournament
  } = useTournaments()
  const { groups } = useGroups()
  const { players } = usePlayers()
  const nonEmptyGroups = groups.filter((group) =>
    players.some((player) => player.groupIds.includes(group.id))
  )

  const [editingSettings, setEditingSettings] = useState<TournamentSettingsWithUsage | null>(null)
  const [creatingSettings, setCreatingSettings] = useState(false)
  const [deletingSettings, setDeletingSettings] = useState<TournamentSettingsWithUsage | null>(null)
  const [settingsDeleteError, setSettingsDeleteError] = useState<string | null>(null)

  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [creatingTournament, setCreatingTournament] = useState(false)
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null)
  const [tournamentDeleteError, setTournamentDeleteError] = useState<string | null>(null)

  const groupNames = new Map(groups.map((group) => [group.id, group.name]))
  const settingsNames = new Map(settings.map((item) => [item.id, item.name]))

  async function handleSettingsSubmit(
    input: TournamentSettingsInput,
    asNewVersion: boolean
  ): Promise<void> {
    if (editingSettings && !asNewVersion && !editingSettings.used) {
      await updateSettings(editingSettings.id, input)
    } else {
      await createSettings(input)
    }
    setEditingSettings(null)
    setCreatingSettings(false)
  }

  async function confirmSettingsDelete(): Promise<void> {
    if (deletingSettings) {
      try {
        await removeSettings(deletingSettings.id)
        setDeletingSettings(null)
      } catch (error) {
        setSettingsDeleteError(
          error instanceof Error ? error.message : 'Не удалось удалить настройку'
        )
      }
    }
  }

  async function handleTournamentSubmit(input: TournamentInput): Promise<void> {
    if (editingTournament) {
      await updateTournament(editingTournament.id, input)
    } else {
      await createTournament(input)
    }
    setEditingTournament(null)
    setCreatingTournament(false)
  }

  async function confirmTournamentDelete(): Promise<void> {
    if (deletingTournament) {
      try {
        await removeTournament(deletingTournament.id)
        setDeletingTournament(null)
      } catch (error) {
        setTournamentDeleteError(
          error instanceof Error ? error.message : 'Не удалось удалить турнир'
        )
      }
    }
  }

  return (
    <div className="entity-panel tournaments-panel">
      <Tabs items={TABS} activeId={tab} onSelect={setTab} />
      {tab === 'tournaments' && (
        <div className="tournaments-list" role="tabpanel" aria-label="Турниры">
          <ul className="entity-list">
            {tournaments.map((tournament) => (
              <li key={tournament.id} className="entity-item">
                <span className="entity-name">{tournament.name}</span>
                <span className="entity-sub">
                  {[
                    groupNames.get(tournament.groupId) ?? '—',
                    formatDate(tournament.startDate),
                    settingsNames.get(tournament.settingsId) ?? '—'
                  ].join(' · ')}
                </span>
                <button
                  type="button"
                  className="entity-action"
                  aria-label={`Изменить: ${tournament.name}`}
                  onClick={() => setEditingTournament(tournament)}
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="entity-action"
                  aria-label={`Удалить: ${tournament.name}`}
                  onClick={() => {
                    setTournamentDeleteError(null)
                    setDeletingTournament(tournament)
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="entity-add" onClick={() => setCreatingTournament(true)}>
            Добавить турнир
          </button>
        </div>
      )}
      {tab === 'settings' && (
        <div className="tournaments-settings" role="tabpanel" aria-label="Настройки">
          <ul className="entity-list">
            {settings.map((item) => (
              <li key={item.id} className="entity-item">
                <span className="entity-name">{item.name}</span>
                <span className="entity-sub">{settingsSummary(item)}</span>
                <button
                  type="button"
                  className="entity-action"
                  aria-label={`Изменить: ${item.name}`}
                  onClick={() => setEditingSettings(item)}
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="entity-action"
                  aria-label={`Удалить: ${item.name}`}
                  onClick={() => {
                    setSettingsDeleteError(null)
                    setDeletingSettings(item)
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="entity-add" onClick={() => setCreatingSettings(true)}>
            Добавить настройку
          </button>
        </div>
      )}
      {(creatingSettings || editingSettings) && (
        <TournamentSettingsDialog
          settings={creatingSettings ? null : editingSettings}
          onSubmit={(input, asNewVersion) => void handleSettingsSubmit(input, asNewVersion)}
          onClose={() => {
            setCreatingSettings(false)
            setEditingSettings(null)
          }}
        />
      )}
      {deletingSettings && (
        <Dialog
          titleId="tournament-settings-delete-dialog"
          className="entity-delete-dialog"
          onClose={() => setDeletingSettings(null)}
        >
          <h2 id="tournament-settings-delete-dialog" className="comment-dialog-title">
            Удалить настройку?
          </h2>
          <p className="comment-dialog-text">{deletingSettings.name}</p>
          {settingsDeleteError && <p className="entity-error">{settingsDeleteError}</p>}
          <div className="entity-actions">
            <button type="button" onClick={() => setDeletingSettings(null)}>
              Отмена
            </button>
            <button type="button" onClick={confirmSettingsDelete}>
              Удалить
            </button>
          </div>
        </Dialog>
      )}
      {(creatingTournament || editingTournament) && (
        <TournamentDialog
          tournament={creatingTournament ? null : editingTournament}
          groups={nonEmptyGroups}
          settings={settings}
          onSubmit={(input) => void handleTournamentSubmit(input)}
          onClose={() => {
            setCreatingTournament(false)
            setEditingTournament(null)
          }}
        />
      )}
      {deletingTournament && (
        <Dialog
          titleId="tournament-delete-dialog"
          className="entity-delete-dialog"
          onClose={() => setDeletingTournament(null)}
        >
          <h2 id="tournament-delete-dialog" className="comment-dialog-title">
            Удалить турнир?
          </h2>
          <p className="comment-dialog-text">{deletingTournament.name}</p>
          {tournamentDeleteError && <p className="entity-error">{tournamentDeleteError}</p>}
          <div className="entity-actions">
            <button type="button" onClick={() => setDeletingTournament(null)}>
              Отмена
            </button>
            <button type="button" onClick={confirmTournamentDelete}>
              Удалить
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default TournamentsPanel
