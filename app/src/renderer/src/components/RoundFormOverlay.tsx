import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import type {
  PairResult,
  RoundPairsPreview,
  TournamentSettingsWithUsage
} from '../../../shared/tournament'
import { usePlayers } from '../hooks/usePlayers'
import { useTournaments } from '../hooks/useTournaments'
import { useTournamentSettings } from '../hooks/useTournamentSettings'

const RESULT_LABELS: Record<PairResult, string> = {
  player1_win: 'Победа',
  player2_win: 'Победа',
  draw: 'Ничья',
  player1_absent: 'Неявка',
  player2_absent: 'Неявка',
  both_absent: 'Неявка обоих'
}

function resultLabel(
  result: PairResult,
  playerById: Map<number, { lastName: string; firstName: string; middleName: string }>,
  pair: { player1Id: number; player2Id: number }
): string {
  if (result === 'draw' || result === 'both_absent') {
    return RESULT_LABELS[result]
  }
  const playerId =
    result === 'player1_win' || result === 'player1_absent' ? pair.player1Id : pair.player2Id
  return `${RESULT_LABELS[result]}: ${playerLabel(playerById, playerId)}`
}

type PairDraft = {
  player1Id: number
  player2Id: number
  result: PairResult | null
}

type RoundFormOverlayProps = {
  tournamentId: number | null
  onClose: () => void
  onSaved: () => void
}

function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function playerLabel(
  playerById: Map<number, { lastName: string; firstName: string; middleName: string }>,
  playerId: number
): string {
  const player = playerById.get(playerId)
  if (!player) {
    return '—'
  }
  return [player.lastName, player.firstName, player.middleName].filter(Boolean).join(' ')
}

function RoundFormOverlay({
  tournamentId,
  onClose,
  onSaved
}: RoundFormOverlayProps): React.JSX.Element {
  const { tournaments } = useTournaments()
  const { players } = usePlayers()
  const { settings } = useTournamentSettings()
  const tournament = tournaments.find((item) => item.id === tournamentId) ?? null

  const [date, setDate] = useState(today())
  const [settingsChoice, setSettingsChoice] = useState<number | null>(null)
  const [preview, setPreview] = useState<RoundPairsPreview | null>(null)
  const [pairs, setPairs] = useState<PairDraft[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const settingsId = settingsChoice ?? tournament?.settingsId ?? null
  const reorderEnabled = (preview?.seq ?? 0) === 1
  const allResultsSet =
    (pairs ?? []).length > 0 && (pairs ?? []).every((pair) => pair.result !== null)

  const playerById = new Map(
    players.map((player) => [
      player.id,
      { lastName: player.lastName, firstName: player.firstName, middleName: player.middleName }
    ])
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (tournament === null) {
      return
    }
    let active = true
    window.api?.tournament?.rounds.preview(tournament.id).then((value) => {
      if (!active) {
        return
      }
      setPreview(value)
      setPairs(value.pairs.map((pair) => ({ ...pair, result: null })))
    })
    return () => {
      active = false
    }
  }, [tournament])

  function swapWithinPair(pairIndex: number): void {
    if (pairs === null) {
      return
    }
    const next = [...pairs]
    const pair = next[pairIndex]
    next[pairIndex] = { ...pair, player1Id: pair.player2Id, player2Id: pair.player1Id }
    setPairs(next)
  }

  function moveSlotUp(pairIndex: number): void {
    if (pairs === null || pairIndex === 0) {
      return
    }
    const next = [...pairs]
    const current = next[pairIndex]
    const previous = next[pairIndex - 1]
    next[pairIndex - 1] = { ...previous, player2Id: current.player1Id }
    next[pairIndex] = { ...current, player1Id: previous.player2Id }
    setPairs(next)
  }

  function moveSlotDown(pairIndex: number): void {
    if (pairs === null || pairIndex === pairs.length - 1) {
      return
    }
    const next = [...pairs]
    const current = next[pairIndex]
    const following = next[pairIndex + 1]
    next[pairIndex + 1] = { ...following, player1Id: current.player2Id }
    next[pairIndex] = { ...current, player2Id: following.player1Id }
    setPairs(next)
  }

  function setResult(pairIndex: number, result: PairResult): void {
    if (pairs === null) {
      return
    }
    const next = [...pairs]
    next[pairIndex] = { ...next[pairIndex], result }
    setPairs(next)
  }

  async function handleSave(): Promise<void> {
    if (tournament === null || pairs === null || settingsId === null || !allResultsSet) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      await window.api?.tournament?.rounds.create({
        tournamentId: tournament.id,
        playedDate: date,
        settingsId,
        pairs: pairs.map((pair) => ({
          player1Id: pair.player1Id,
          player2Id: pair.player2Id,
          result: pair.result as PairResult
        }))
      })
      onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось сохранить раунд')
    } finally {
      setSaving(false)
    }
  }

  const restingLabels = (preview?.restingPlayerIds ?? []).map((playerId) =>
    playerLabel(playerById, playerId)
  )

  if (tournament === null) {
    return (
      <div className="round-form-overlay">
        <p className="entity-empty">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="round-form-overlay">
      <button type="button" className="help-overlay-close" aria-label="Закрыть" onClick={onClose}>
        <X size={32} aria-hidden="true" />
      </button>
      <h2 className="help-overlay-title">Новый раунд — {tournament.name}</h2>
      {pairs === null ? (
        <p className="entity-empty">Загрузка…</p>
      ) : (
        <form
          className="round-form"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSave()
          }}
        >
          <div className="round-form-fields">
            <label className="entity-field">
              <span>
                Дата проведения{' '}
                <span className="entity-required" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>
            <label className="entity-field">
              <span>
                Настройки{' '}
                <span className="entity-required" aria-hidden="true">
                  *
                </span>
              </span>
              <select
                value={settingsId ?? ''}
                onChange={(event) => setSettingsChoice(Number(event.target.value))}
                required
              >
                {settings.map((item: TournamentSettingsWithUsage) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <span className="entity-hint">По умолчанию — настройки турнира</span>
            </label>
          </div>
          <div className="round-form-pairs">
            {pairs.map((pair, index) => (
              <div key={`${pair.player1Id}-${pair.player2Id}`} className="pair-plate">
                <div className="pair-plate-slot">
                  <span className="pair-plate-arrows">
                    <button
                      type="button"
                      aria-label={`Поднять игрока ${playerLabel(playerById, pair.player1Id)}`}
                      disabled={!reorderEnabled || index === 0}
                      onClick={() => moveSlotUp(index)}
                    >
                      <ArrowUp size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Опустить игрока ${playerLabel(playerById, pair.player1Id)}`}
                      disabled={!reorderEnabled}
                      onClick={() => swapWithinPair(index)}
                    >
                      <ArrowDown size={14} aria-hidden="true" />
                    </button>
                  </span>
                  <span className="pair-plate-name">{playerLabel(playerById, pair.player1Id)}</span>
                </div>
                <span className="pair-plate-vs">—</span>
                <div className="pair-plate-slot">
                  <span className="pair-plate-arrows">
                    <button
                      type="button"
                      aria-label={`Поднять игрока ${playerLabel(playerById, pair.player2Id)}`}
                      disabled={!reorderEnabled}
                      onClick={() => swapWithinPair(index)}
                    >
                      <ArrowUp size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Опустить игрока ${playerLabel(playerById, pair.player2Id)}`}
                      disabled={!reorderEnabled || index === pairs.length - 1}
                      onClick={() => moveSlotDown(index)}
                    >
                      <ArrowDown size={14} aria-hidden="true" />
                    </button>
                  </span>
                  <span className="pair-plate-name">{playerLabel(playerById, pair.player2Id)}</span>
                </div>
                <label className="pair-plate-result">
                  <select
                    aria-label={`Исход пары ${index + 1}`}
                    value={pair.result ?? ''}
                    onChange={(event) => setResult(index, event.target.value as PairResult)}
                    required
                  >
                    <option value="" disabled>
                      Выберите исход
                    </option>
                    {(
                      [
                        'player1_win',
                        'player2_win',
                        'draw',
                        'player1_absent',
                        'player2_absent',
                        'both_absent'
                      ] as PairResult[]
                    ).map((result) => (
                      <option key={result} value={result}>
                        {resultLabel(result, playerById, pair)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
          <p className="entity-sub">
            {restingLabels.length > 0 ? `Не играет: ${restingLabels.join(', ')}` : 'Отдыхающих нет'}
            {reorderEnabled ? ' · стрелками можно менять пары (только для первого раунда)' : ''}
          </p>
          {error && <p className="entity-error">{error}</p>}
          <div className="entity-actions">
            <button type="button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" disabled={!allResultsSet || saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default RoundFormOverlay
