import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type {
  AbsenceScoring,
  DrawScoring,
  TournamentSettingsInput,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'
import { useTournamentSettings } from '../hooks/useTournamentSettings'
import Tabs from './Tabs'
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

function TournamentsPanel(): React.JSX.Element {
  const [tab, setTab] = useState<TournamentsTab>('tournaments')
  const { settings, create, update, remove } = useTournamentSettings()
  const [editing, setEditing] = useState<TournamentSettingsWithUsage | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<TournamentSettingsWithUsage | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleSubmit(
    input: TournamentSettingsInput,
    asNewVersion: boolean
  ): Promise<void> {
    if (editing && !asNewVersion && !editing.used) {
      await update(editing.id, input)
    } else {
      await create(input)
    }
    setEditing(null)
    setCreating(false)
  }

  async function confirmDelete(): Promise<void> {
    if (deleting) {
      try {
        await remove(deleting.id)
        setDeleting(null)
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : 'Не удалось удалить настройку')
      }
    }
  }

  return (
    <div className="entity-panel tournaments-panel">
      <Tabs items={TABS} activeId={tab} onSelect={setTab} />
      {tab === 'tournaments' && (
        <div className="entity-list tournaments-list" role="tabpanel" aria-label="Турниры" />
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
                  onClick={() => setEditing(item)}
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="entity-action"
                  aria-label={`Удалить: ${item.name}`}
                  onClick={() => {
                    setDeleteError(null)
                    setDeleting(item)
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="entity-add" onClick={() => setCreating(true)}>
            Добавить настройку
          </button>
        </div>
      )}
      {(creating || editing) && (
        <TournamentSettingsDialog
          settings={creating ? null : editing}
          onSubmit={(input, asNewVersion) => void handleSubmit(input, asNewVersion)}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
      {deleting && (
        <Dialog
          titleId="tournament-settings-delete-dialog"
          className="entity-delete-dialog"
          onClose={() => setDeleting(null)}
        >
          <h2 id="tournament-settings-delete-dialog" className="comment-dialog-title">
            Удалить настройку?
          </h2>
          <p className="comment-dialog-text">{deleting.name}</p>
          {deleteError && <p className="entity-error">{deleteError}</p>}
          <div className="entity-actions">
            <button type="button" onClick={() => setDeleting(null)}>
              Отмена
            </button>
            <button type="button" onClick={confirmDelete}>
              Удалить
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default TournamentsPanel
