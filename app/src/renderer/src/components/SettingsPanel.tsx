import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import ThemeToggle from './ThemeToggle'

function SettingsPanel(): React.JSX.Element {
  const { theme, setTheme } = useTheme()
  const [exporting, setExporting] = useState(false)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function exportDatabase(): Promise<void> {
    setExporting(true)
    setError(null)
    try {
      const path = await window.api?.database?.exportSnapshot()
      setSavedPath(path)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось экспортировать базу')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="entity-panel settings-panel">
      <section className="settings-section">
        <h2 className="settings-section-title">Оформление</h2>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Тема</span>
            <span className="settings-row-hint">
              Светлая тема повышает контраст — удобно на проекторе
            </span>
          </div>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </section>
      <section className="settings-section">
        <h2 className="settings-section-title">База данных</h2>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Экспорт базы</span>
            <span className="settings-row-hint">Полная копия базы со схемой и данными</span>
            {savedPath !== null && (
              <span className="settings-row-hint">Сохранено: {savedPath}</span>
            )}
            {error !== null && <span className="entity-error">{error}</span>}
          </div>
          <button
            type="button"
            className="settings-export-button"
            disabled={exporting}
            onClick={() => void exportDatabase()}
          >
            {exporting ? 'Экспорт…' : 'Экспортировать…'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default SettingsPanel
