import { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import type { Chart as ChartInstance } from 'chart.js'
import { X } from 'lucide-react'
import type { Tournament, TournamentPositions } from '../../../shared/tournament'

const LINE_COLORS = [
  '#4fc3f7',
  '#ffd54f',
  '#81c784',
  '#f48fb1',
  '#ba68c8',
  '#ffb74d',
  '#4db6ac',
  '#e57373',
  '#9575cd',
  '#a1887f',
  '#90a4ae',
  '#fff176'
]

function shortName(player: { lastName: string; firstName: string; middleName: string }): string {
  const initials = [player.firstName, player.middleName]
    .filter(Boolean)
    .map((name) => `${name[0].toUpperCase()}.`)
    .join(' ')
  return [player.lastName, initials].filter(Boolean).join(' ')
}

type TournamentChartOverlayProps = {
  tournament: Tournament
  onClose: () => void
}

function TournamentChartOverlay({
  tournament,
  onClose
}: TournamentChartOverlayProps): React.JSX.Element {
  const [data, setData] = useState<TournamentPositions | null>(null)
  const [hidden, setHidden] = useState<ReadonlySet<number>>(new Set())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartInstance | null>(null)

  useEffect(() => {
    let active = true
    window.api?.tournament?.rounds.positions(tournament.id).then((value) => {
      if (active) {
        setData(value)
      }
    })
    return () => {
      active = false
    }
  }, [tournament.id])

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
    if (data === null || canvasRef.current === null) {
      return
    }
    const gridColor = 'rgba(255, 255, 255, 0.08)'
    const textColor = getComputedStyle(document.body).getPropertyValue('--ev-c-text-2') || '#888'
    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.seqs,
        datasets: data.series.map((player, index) => ({
          label: shortName(player),
          data: player.positions,
          borderColor: LINE_COLORS[index % LINE_COLORS.length],
          backgroundColor: LINE_COLORS[index % LINE_COLORS.length],
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          tension: 0.3,
          clip: false
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 8 } },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: {
            title: { display: true, text: 'Раунд', color: textColor },
            ticks: { color: textColor, precision: 0 },
            grid: { color: gridColor }
          },
          y: {
            reverse: true,
            min: 1,
            ticks: { color: textColor, precision: 0, stepSize: 1 },
            grid: { color: gridColor },
            title: { display: true, text: 'Позиция', color: textColor }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}-е место`
            }
          }
        }
      }
    })
    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [data])

  function toggle(playerId: number, index: number): void {
    setHidden((previous) => {
      const next = new Set(previous)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      chartRef.current?.setDatasetVisibility(index, !next.has(playerId))
      chartRef.current?.update()
      return next
    })
  }

  return (
    <div className="round-form-overlay tournament-chart-overlay">
      <button type="button" className="help-overlay-close" aria-label="Закрыть" onClick={onClose}>
        <X size={32} aria-hidden="true" />
      </button>
      <h2 className="help-overlay-title">{tournament.name} — позиции игроков</h2>
      {data === null ? (
        <p className="entity-empty">Загрузка…</p>
      ) : data.seqs.length === 0 ? (
        <p className="entity-empty">Раундов пока нет</p>
      ) : (
        <>
          <div className="chart-canvas-wrap">
            <canvas ref={canvasRef} />
          </div>
          <ul className="chart-legend">
            {data.series.map((player, index) => (
              <li key={player.playerId}>
                <button
                  type="button"
                  className={
                    hidden.has(player.playerId) ? 'chart-legend-item off' : 'chart-legend-item'
                  }
                  onClick={() => toggle(player.playerId, index)}
                >
                  <span
                    className="chart-legend-color"
                    style={{ background: LINE_COLORS[index % LINE_COLORS.length] }}
                    aria-hidden="true"
                  />
                  {shortName(player)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default TournamentChartOverlay
