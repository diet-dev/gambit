import { useTheme } from '../hooks/useTheme'
import ThemeToggle from './ThemeToggle'

function SettingsPanel(): React.JSX.Element {
  const { theme, setTheme } = useTheme()

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
    </div>
  )
}

export default SettingsPanel
